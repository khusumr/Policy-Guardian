# CI/CD Pipeline — AI Policy Generator (BugBusters)

This is the DevOps deliverable: Terraform infra + Azure DevOps pipelines for
`khusumr/Buggies`. Your teammates' app code isn't in this bundle — these
files are meant to be dropped into the repo alongside `/frontend` and
`/backend` once they exist.

## Where these files go in the repo

```
Buggies/
├── azure-pipelines.yml          <- copy pipelines/azure-pipelines.yml here (repo root)
├── frontend/                    <- teammates' React app (npm scripts: lint, test, build)
├── backend/                     <- teammates' Python app (requirements.txt, tests/)
├── infra/
│   └── terraform/                <- copy the whole infra/terraform folder as-is
│       ├── providers.tf
│       ├── variables.tf
│       ├── main.tf
│       ├── outputs.tf
│       └── environments/
│           ├── dev.tfvars
│           └── prod.tfvars
├── pipelines/
│   ├── pr-validation.yml
│   └── templates/
│       ├── terraform-steps.yml
│       ├── backend-steps.yml
│       ├── frontend-steps.yml
│       └── deploy-webapp-steps.yml
└── docs/
    └── AZURE_DEVOPS_SETUP.md
```

Note: `pipelines/azure-pipelines.yml` in this bundle assumes it will be
copied to the repo **root** as `azure-pipelines.yml` (that's the Azure DevOps
convention), while it references the other templates via their
`pipelines/templates/...` path. If you'd rather keep it inside `pipelines/`
too, just point the Azure DevOps pipeline definition at that path when you
create it in step 6 of the setup guide — no content changes needed.

## What's included

| Piece | What it does |
|---|---|
| `infra/terraform/*` | Provisions everything inside the existing `BugBusters` resource group: App Service Plan + 2 Linux Web Apps (frontend, backend), Azure OpenAI + a model deployment, Storage Account + blob container for generated docs, Key Vault, Log Analytics + App Insights. Parameterized by `dev`/`prod` via `.tfvars`. |
| `pipelines/azure-pipelines.yml` | Main pipeline on `main`: build+test → provision+deploy dev → **manual approval** → provision+deploy prod. |
| `pipelines/pr-validation.yml` | Runs on every PR: lint, test, `terraform plan` (no apply, no deploy). Wire it up as a required check. |
| `pipelines/templates/*.yml` | Reusable step blocks so the same logic isn't duplicated across dev/prod. |
| `docs/AZURE_DEVOPS_SETUP.md` | The one-time manual portal steps (service connections, variable groups, environments/approvals) that can't be expressed in code. **Read this first.** |

## What your teammates need to provide

- `backend/requirements.txt` (+ `requirements-dev.txt` with `pytest`, `ruff`) and tests discoverable by `pytest`.
- `frontend/package.json` with `lint`, `test`, and `build` scripts (standard for CRA/Vite).
- Both apps reading their Azure OpenAI / storage / DB config from environment variables (the Terraform `app_settings` blocks already inject `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_STORAGE_CONTAINER`, `KEY_VAULT_URI`, etc. — they just need to read them, not hardcode them).

## Quick start

1. Read `docs/AZURE_DEVOPS_SETUP.md` and do the one-time setup (~20–30 min).
2. Copy this bundle's files into the repo per the tree above, open a PR.
3. `PR-Validation` should run automatically and go green once `/frontend` and `/backend` exist with the expected scripts.
4. Merge → `Main-CI-CD` provisions dev and deploys both apps → approve prod when ready.
