# CI/CD Setup – TimoGoetz1988/aios

## 1Password (optional, empfohlen)

Für volle CI-Funktionalität (Secrets für Build/Runtime):

1. **1Password Service Account** anlegen: [1Password Service Accounts](https://developer.1password.com/docs/service-accounts/)
2. **Token** in GitHub Repo Secrets eintragen:
   - Repo → Settings → Secrets and variables → Actions
   - Neuer Secret: `OP_SERVICE_ACCOUNT_TOKEN` = Service-Account-Token
3. **1Password Vault** `AIOS` mit allen referenzierten Items (siehe Workflows)

Ohne Token: CI läuft mit `continue-on-error`; Builds nutzen Fallback-Werte.

## GitHub Secrets (manuell)

| Secret | Beschreibung |
|--------|--------------|
| `OP_SERVICE_ACCOUNT_TOKEN` | 1Password Service Account Token |

## 1Password Vault-Struktur (AIOS)

- `AIOS/AI-APIs/*` – openrouter_api_key, anthropic_api_key, openai_api_key
- `AIOS/Core/*` – jwt_secret, postgres_password, dashboard_api_key
- `AIOS/Coolify/*` – url, token
- `AIOS/NocoDB/*` – url, api_key, mcp_*_table_id
- `AIOS/Cloudflare/*` – api_token
- `AIOS/AgenticOS/*` – base_path
- `AIOS/N8N/*` – api_key
