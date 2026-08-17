variable "azure_openai_endpoint" {
  description = "Azure OpenAI endpoint"
  type        = string
}

variable "azure_openai_api_key" {
  description = "Azure OpenAI API key"
  type        = string
  sensitive   = true
}

variable "azure_openai_deployment" {
  description = "Azure OpenAI deployment name"
  type        = string
}