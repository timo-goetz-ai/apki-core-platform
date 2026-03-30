# CI/CD Setup – TimoGoetz1988/aios

## 1Password Service Account (empfohlen)

1. [Service Account](https://developer.1password.com/docs/service-accounts/) anlegen mit Lesezugriff auf Tresor **`05_INFRASTRUCTURE`** (kein veralteter Tresor `AIOS`, falls leer/entfernt).
2. Token in GitHub: **Settings → Secrets → Actions → `OP_SERVICE_ACCOUNT_TOKEN`**.
3. Im Tresor existiert u. a. ein Item **`1PASSWORT_Service Account Auth Token: AIOS`** (Referenz für manuelle Ablage); der CI nutzt den **GitHub-Secret**, nicht dieses Item direkt.

Ohne Token: `load-secrets-action` schlägt fehl; Workflows nutzen wo möglich `continue-on-error: true`, Builds laufen oft trotzdem ohne die injizierten Secrets.

## Deploy-Erfolg (Webhook)

Es gibt **kein** Item `Slack` im Tresor. Stattdessen wird der **Discord-Incoming-Webhook** aus dem Item **`DISCORD`** verwendet (Feld-UUID der URL, siehe `deploy-prod.yml`). Payload entspricht der [Discord-Webhook-API](https://discord.com/developers/docs/resources/webhook#execute-webhook) (`content`).

Willst du einen anderen Kanal: eigenes Concealed-Feld mit fester Bezeichnung anlegen und `deploy-prod.yml` + `scripts/verify-1password-workflow-refs.py` anpassen.

## Von den Workflows referenzierte Items (05_INFRASTRUCTURE)

Diese Pfade werden in `.github/workflows/*.yml` genutzt; sie müssen im Tresor existieren (Prüfung: `python3 scripts/verify-1password-workflow-refs.py`).

| Item | Beispiel-Felder (op://…/Feld) |
|------|--------------------------------|
| AI-APIs | `anthropic_api_key`, `openai_api_key`, `openrouter_api_key` |
| AgenticOS | `base_path` |
| Cloudflare-API | `account_id`, `api_token` |
| Coolify | `url`, `token`, `aios_core_uuid`, `dashboard_uuid`, `coder_agent_uuid` |
| Core | `jwt_secret`, `dashboard_api_key`, `aios_core_url`, `aios_token`, `next_public_aios_core_api_url`, `next_public_ws_url` |
| Hetzner | `ip`, `token`, `ssh_private_key` |
| NocoDB | `url`, `api_key`, `mcp_projekte_table_id`, `mcp_dienste_table_id`, `mcp_audit_table_id` |
| DISCORD | Webhook-Feld (UUID im Workflow; Discord-`content`-JSON) |

Weitere kanonische Operations-URLs liegen in `scripts/infra-1password.op.template` (N8N, NocoDB, Coolify für lokales `op run`).

## GitHub Secrets (übersicht)

| Secret | Rolle |
|--------|--------|
| `OP_SERVICE_ACCOUNT_TOKEN` | 1Password Service Account für `load-secrets-action@v2` |
