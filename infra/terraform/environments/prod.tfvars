# Copy this to prod.tfvars and adjust as needed.

environment          = "prod"
resource_group_name  = "BugBusters"
location             = "eastus"
project_name         = "bugbusters"
app_service_sku      = "B2"
allowed_cors_origins = ["*"] # tighten to the real frontend URL once known
