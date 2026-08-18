# ---------------------------------------------------------------------------
# Backend compute — this was missing before: storage existed, but nothing
# actually ran the FastAPI app. Adding the minimum needed for the CI/CD
# pipeline to have somewhere real to deploy to.
# ---------------------------------------------------------------------------

resource "azurerm_service_plan" "backend" {
  name                = "asp-ai-policy-backend"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "B1"
}

resource "azurerm_linux_web_app" "backend" {
  name                = "app-ai-policy-backend"
  resource_group_name = data.azurerm_resource_group.main.name
  location            = data.azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.backend.id

  # System-assigned identity for least-privilege blob access. The role
  # assignment granting it "Storage Blob Data Contributor" is deliberately
  # NOT in this same apply: adding an identity to an *existing* resource
  # and referencing its principal_id from another resource in the same
  # plan hits a known azurerm provider limitation (the identity's
  # principal_id can't be resolved until it has actually settled into
  # state) — terraform plan fails with "Missing required argument" on
  # `identity[0].principal_id`. Once this merges and applies, the identity
  # will be a known value in state, and the role assignment can be added
  # safely in a follow-up. storage_service.py still authenticates via
  # AZURE_STORAGE_CONNECTION_STRING regardless — granting the role doesn't
  # reduce actual exposure until that code is migrated to
  # DefaultAzureCredential, which also needs to happen before this
  # identity is load-bearing.
  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      python_version = "3.11"
    }
    cors {
      allowed_origins = ["*"] # tighten to the real frontend URL once it exists
    }
    # Without this, Azure just shows its default placeholder page even
    # after a successful deploy — it needs to be told how to actually
    # start the app.
    app_command_line = "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
  }

  app_settings = {
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"

    # storage_service.py reads this directly via connection string, not
    # managed identity, so wiring it as a plain app setting matches how the
    # code actually authenticates. NOTE: this puts a secret in App Service
    # config in plain text — fine to get things running, but worth moving
    # to Key Vault + managed identity before this is anything but a class
    # project. Flagging rather than silently deciding for the team.
    "AZURE_STORAGE_CONNECTION_STRING" = azurerm_storage_account.main.primary_connection_string

    # Placeholders — openai_service.py already handles these being unset
    # (falls back to its placeholder response), so leaving blank here is
    # safe until real Azure OpenAI credentials exist.
    "AZURE_OPENAI_ENDPOINT"   = var.azure_openai_endpoint
    "AZURE_OPENAI_API_KEY"    = var.azure_openai_api_key
    "AZURE_OPENAI_DEPLOYMENT" = var.azure_openai_deployment

    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.backend.connection_string
  }

  virtual_network_subnet_id = azurerm_subnet.backend_integration.id
}

# The role assignment granting this identity "Storage Blob Data
# Contributor" (scoped to just the storage account) is added in a
# follow-up PR, once the identity above has settled into state — see the
# comment on the identity block for why it can't land in the same apply.

# ---------------------------------------------------------------------------
# storage_service.py currently hardcodes CONTAINER_NAME = "policies", which
# doesn't match either container actually defined (source-documents,
# generated-policies) — this container exists so that mismatch doesn't
# silently create an untracked container outside Terraform's view. The
# better long-term fix is updating storage_service.py to use
# "generated-policies" instead and removing this — flag it to whoever owns
# that file rather than carrying two names indefinitely.
# ---------------------------------------------------------------------------
resource "azurerm_storage_container" "policies_compat" {
  name                  = "policies"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"
}
