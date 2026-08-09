resource "azurerm_resource_group" "main" {
  name     = "ai-policy-generator-rg"
  location = "West US 2"
}

resource "azurerm_storage_account" "main" {
  name                     = "aipolicykhusum2026"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
}

resource "azurerm_storage_container" "source_documents" {
  name                  = "source-documents"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "generated_policies" {
  name                  = "generated-policies"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"
}