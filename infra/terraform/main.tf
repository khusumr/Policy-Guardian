data "azurerm_resource_group" "main" {
  name = var.resource_group_name
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  tags = {
    project     = "AI Policy Generator"
    environment = var.environment
    managed_by  = "terraform"
    team        = "BugBusters"
  }
}

resource "random_string" "suffix" {
  length  = 5
  special = false
  upper   = false
}

# ---------------------------------------------------------------------------
# Storage: Blob container for generated policy documents (Word/PDF exports)
# ---------------------------------------------------------------------------
resource "azurerm_storage_account" "app" {
  name                     = "st${var.project_name}${var.environment}${random_string.suffix.result}"
  resource_group_name      = data.azurerm_resource_group.main.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"
  tags                     = local.tags
}

resource "azurerm_storage_container" "policy_documents" {
  name                  = "policy-documents"
  storage_account_name  = azurerm_storage_account.app.name
  container_access_type = "private"
}

# ---------------------------------------------------------------------------
# Key Vault: holds OpenAI key, storage connection string, any other secrets
# ---------------------------------------------------------------------------
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "app" {
  name                       = "kv-${var.project_name}-${var.environment}-${random_string.suffix.result}"
  resource_group_name        = data.azurerm_resource_group.main.name
  location                   = var.location
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  tags                       = local.tags

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = ["Get", "List", "Set", "Delete", "Purge", "Recover"]
  }
}

resource "azurerm_key_vault_secret" "storage_conn_string" {
  name         = "storage-connection-string"
  value        = azurerm_storage_account.app.primary_connection_string
  key_vault_id = azurerm_key_vault.app.id
}

resource "azurerm_key_vault_secret" "openai_key" {
  name         = "openai-api-key"
  value        = azurerm_cognitive_account.openai.primary_access_key
  key_vault_id = azurerm_key_vault.app.id
}

# ---------------------------------------------------------------------------
# Azure OpenAI
# ---------------------------------------------------------------------------
resource "azurerm_cognitive_account" "openai" {
  name                = "oai-${var.project_name}-${var.environment}-${random_string.suffix.result}"
  resource_group_name = data.azurerm_resource_group.main.name
  location             = var.location
  kind                = "OpenAI"
  sku_name            = var.openai_sku
  custom_subdomain_name = "oai-${var.project_name}-${var.environment}-${random_string.suffix.result}"
  tags                = local.tags
}

resource "azurerm_cognitive_deployment" "policy_model" {
  name                 = var.openai_deployment_model
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = var.openai_deployment_model
    version = var.openai_model_version
  }

  sku {
    name     = "Standard"
    capacity = 10
  }
}

# ---------------------------------------------------------------------------
# Observability
# ---------------------------------------------------------------------------
resource "azurerm_log_analytics_workspace" "app" {
  name                = "log-${local.name_prefix}"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.tags
}

resource "azurerm_application_insights" "app" {
  name                = "appi-${local.name_prefix}"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  workspace_id        = azurerm_log_analytics_workspace.app.id
  application_type    = "web"
  tags                = local.tags
}

# ---------------------------------------------------------------------------
# App Service Plan (Linux) — shared by both web apps to keep costs down
# ---------------------------------------------------------------------------
resource "azurerm_service_plan" "app" {
  name                = "asp-${local.name_prefix}"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku
  tags                = local.tags
}

# ---------------------------------------------------------------------------
# Backend: Python (FastAPI/Flask) App Service
# ---------------------------------------------------------------------------
resource "azurerm_linux_web_app" "backend" {
  name                = "app-${var.project_name}-api-${var.environment}"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  service_plan_id     = azurerm_service_plan.app.id
  tags                = local.tags

  site_config {
    application_stack {
      python_version = var.backend_python_version
    }
    cors {
      allowed_origins = var.allowed_cors_origins
    }
    always_on = var.environment == "prod" ? true : false
  }

  app_settings = {
    "AZURE_OPENAI_ENDPOINT"           = azurerm_cognitive_account.openai.endpoint
    "AZURE_OPENAI_DEPLOYMENT"         = azurerm_cognitive_deployment.policy_model.name
    "AZURE_STORAGE_CONTAINER"         = azurerm_storage_container.policy_documents.name
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.app.connection_string
    "KEY_VAULT_URI"                   = azurerm_key_vault.app.vault_uri
    "SCM_DO_BUILD_DURING_DEPLOYMENT"  = "true"
    # Secrets (OpenAI key, storage conn string) are pulled from Key Vault at
    # runtime via managed identity — see access policy below — not stored here.
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_key_vault_access_policy" "backend" {
  key_vault_id = azurerm_key_vault.app.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.backend.identity[0].principal_id

  secret_permissions = ["Get", "List"]
}

resource "azurerm_role_assignment" "backend_storage" {
  scope                = azurerm_storage_account.app.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_linux_web_app.backend.identity[0].principal_id
}

# ---------------------------------------------------------------------------
# Frontend: React/Node App Service (serves the production build)
# ---------------------------------------------------------------------------
resource "azurerm_linux_web_app" "frontend" {
  name                = "app-${var.project_name}-web-${var.environment}"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = var.location
  service_plan_id     = azurerm_service_plan.app.id
  tags                = local.tags

  site_config {
    application_stack {
      node_version = var.frontend_node_version
    }
    always_on = var.environment == "prod" ? true : false
  }

  app_settings = {
    "REACT_APP_API_BASE_URL"                = "https://${azurerm_linux_web_app.backend.default_hostname}"
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.app.connection_string
    "SCM_DO_BUILD_DURING_DEPLOYMENT"        = "true"
    "WEBSITE_NODE_DEFAULT_VERSION"          = "~20"
  }

  identity {
    type = "SystemAssigned"
  }
}
