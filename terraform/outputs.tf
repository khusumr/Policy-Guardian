output "backend_url" {
  value = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "backend_app_name" {
  value = azurerm_linux_web_app.backend.name
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}

output "frontend_static_web_app_api_key" {
  value     = azurerm_static_web_app.frontend.api_key
  sensitive = true
}

output "frontend_static_web_app_hostname" {
  value = azurerm_static_web_app.frontend.default_host_name
}

output "frontend_static_web_app_location" {
  value = azurerm_static_web_app.frontend.location
}

output "application_insights_app_id" {
  value = azurerm_application_insights.backend.app_id
}

output "application_insights_connection_string" {
  value     = azurerm_application_insights.backend.connection_string
  sensitive = true
}

output "log_analytics_workspace_name" {
  value = azurerm_log_analytics_workspace.main.name
}