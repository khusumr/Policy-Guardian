# Azure DevOps Setup — One-Time Manual Steps

Do these once, before the first pipeline run. Everything after this is automated.

## 0. Prerequisites
- Access to the Quadrant Azure DevOps organization + a project (create one, e.g. `BugBusters-AIPolicyGenerator`, if it doesn't exist yet).
- Contributor access on the `BugBusters` resource group (subscription `7981312c-4577-455a-8bae-10269b74a97b`).
- Admin on the GitHub repo `khusumr/Buggies`.

## 1. Connect the GitHub repo to Azure DevOps
1. In your Azure DevOps project: **Project Settings > Service connections > New service connection > GitHub**.
2. Authorize via OAuth (or a GitHub PAT if OAuth isn't available) against `khusumr/Buggies`.
3. When creating a pipeline later (`Pipelines > New pipeline`), choose **GitHub** as the source and select this repo — Azure DevOps will read `azure-pipelines.yml` straight from it. No code needs to live in Azure Repos.

## 2. Create the Azure service connection (for Terraform + deploys)
1. **Project Settings > Service connections > New service connection > Azure Resource Manager**.
2. Choose **Service principal (automatic)** (simplest) or **(manual)** if Quadrant wants to hand you specific credentials.
3. Scope: **Resource Group** → subscription `7981312c-4577-455a-8bae-10269b74a97b` → resource group `BugBusters`. Don't scope it to the whole subscription — keep the blast radius to this RG.
4. Name it exactly `BugBusters-ServiceConnection` (or update `AZURE_SERVICE_CONNECTION` in the variable group to whatever you name it).
5. Grant access permission to all pipelines (or approve per-pipeline when prompted).

## 3. Create the Terraform remote state storage (one-time, manual — chicken/egg problem)
Terraform can't create its own state backend, so this one storage account is created by hand, not by Terraform:

```bash
az group show -n BugBusters  # confirm you're pointed at the right RG/subscription

az storage account create \
  --name sttfstatebugbusters \
  --resource-group BugBusters \
  --sku Standard_LRS \
  --encryption-services blob

az storage container create \
  --account-name sttfstatebugbusters \
  --name tfstate
```

(If `sttfstatebugbusters` is taken — storage account names are globally unique — pick another and use it consistently below.)

## 4. Create variable groups
**Pipelines > Library > + Variable group**. Link secrets to Key Vault where noted (requires the Key Vault to exist first — see step 6, chicken/egg again: create these plain for the very first `terraform apply`, then switch the OpenAI/storage secrets to Key-Vault-linked afterward if you want).

### `bugbusters-common`
| Variable | Value |
|---|---|
| `AZURE_SERVICE_CONNECTION` | `BugBusters-ServiceConnection` |
| `TF_STATE_RG` | `BugBusters` |
| `TF_STATE_SA` | `sttfstatebugbusters` |
| `TF_STATE_CONTAINER` | `tfstate` |
| `RESOURCE_GROUP` | `BugBusters` |

### `bugbusters-dev`
| Variable | Value |
|---|---|
| `REACT_APP_API_BASE_URL` | `https://app-bugbusters-api-dev.azurewebsites.net` (fill in after first apply) |

### `bugbusters-prod`
| Variable | Value |
|---|---|
| `REACT_APP_API_BASE_URL` | `https://app-bugbusters-api-prod.azurewebsites.net` (fill in after first apply) |

## 5. Create Environments + the prod approval gate
1. **Pipelines > Environments > New environment** → name it `bugbusters-dev`. No approvals needed.
2. Repeat for `bugbusters-prod`.
3. On `bugbusters-prod` → **... (kebab menu) > Approvals and checks > Approvals** → add your instructor/team lead as a required approver. This is what pauses the pipeline before any prod deploy.

## 6. Create the two pipelines
1. **Pipelines > New pipeline > GitHub > khusumr/Buggies**.
2. Point it at `pipelines/pr-validation.yml`. Name it `PR-Validation`.
3. Repeat, pointing at `pipelines/azure-pipelines.yml` (or move it to the repo root as `azure-pipelines.yml` — either path works, just keep the `template:` paths inside it consistent). Name it `Main-CI-CD`.
4. In GitHub: **Settings > Branches > Add branch protection rule** on `main` → require the `PR-Validation` status check before merging.

## 7. First run
Run `Main-CI-CD` manually once against `main` to provision dev infra. After it succeeds, grab the real backend URL from the Terraform output or the Azure Portal and update `REACT_APP_API_BASE_URL` in the `bugbusters-dev` variable group, then re-run so the frontend build points at the right API.

## Ongoing workflow
- Feature branch → PR into `main` → `PR-Validation` runs automatically (lint/test/terraform plan) → merge once green + reviewed.
- Merge to `main` → `Main-CI-CD` runs automatically → dev is provisioned/deployed → pipeline pauses for prod approval → approver clicks Approve → prod is provisioned/deployed.
