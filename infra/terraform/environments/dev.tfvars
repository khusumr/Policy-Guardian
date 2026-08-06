# Copy this to dev.tfvars / prod.tfvars and adjust as needed.
# These are NOT auto-loaded — the pipeline passes -var-file explicitly
# (see pipelines/templates/terraform-steps.yml).

environment          = "dev"
resource_group_name  = "BugBusters"
location             = "eastus"
project_name         = "bugbusters"
app_service_sku      = "B1"
allowed_cors_origins = ["*"] # tighten to the real frontend URL once known
