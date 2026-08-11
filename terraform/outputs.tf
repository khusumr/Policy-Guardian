output "backend_url" {
  value = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "backend_app_name" {
  value = azurerm_linux_web_app.backend.name
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}
