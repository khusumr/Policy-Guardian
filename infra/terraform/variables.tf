variable "subscription_id" {
  description = "Azure subscription ID (Quadrant-provided subscription)."
  type        = string
  default     = "7981312c-4577-455a-8bae-10269b74a97b"
}

variable "resource_group_name" {
  description = "Existing resource group provided by Quadrant Technologies. We do NOT create/destroy this — only reference it."
  type        = string
  default     = "BugBusters"
}

variable "location" {
  description = "Azure region for all resources."
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Deployment environment: dev or prod. Drives resource naming and sizing."
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be 'dev' or 'prod'."
  }
}

variable "project_name" {
  description = "Short project slug used in resource names."
  type        = string
  default     = "bugbusters"
}

variable "app_service_sku" {
  description = "App Service Plan SKU. Keep cheap for dev (B1), bump for prod if needed."
  type        = string
  default     = "B1"
}

variable "openai_deployment_model" {
  description = "Model to deploy on the Azure OpenAI resource."
  type        = string
  default     = "gpt-4o-mini"
}

variable "openai_model_version" {
  description = "Model version for the OpenAI deployment."
  type        = string
  default     = "2024-07-18"
}

variable "openai_sku" {
  description = "SKU for the Cognitive Services (OpenAI) account."
  type        = string
  default     = "S0"
}

variable "backend_python_version" {
  description = "Python version for the backend App Service Linux runtime."
  type        = string
  default     = "3.11"
}

variable "frontend_node_version" {
  description = "Node version for the frontend App Service Linux runtime."
  type        = string
  default     = "20-lts"
}

variable "allowed_cors_origins" {
  description = "Origins allowed to call the backend API. Add the frontend URL(s) here."
  type        = list(string)
  default     = ["*"]
}
