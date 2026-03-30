# CI/CD Setup – TimoGoetz1988/aios

## 1Password Service Account (GitHub Actions)

Kanonisches Service-Konto: **`1PASSWORT_300326_INFRA_HETZNER`** (Hetzner/Infra, Stand 2026-03-30).

1. Im 1Password-Tresor **`05_INFRASTRUCTURE`** liegt das Item  
   **`Service Account Auth Token: 1PASSWORT_300326_INFRA_HETZNER`** — dort ist das **Token** im Feld **`Anmeldedaten`** (Concealed) abgelegt.
2. **Nur** diesen Wert in GitHub eintragen: **Settings → Secrets and variables → Actions → `OP_SERVICE_ACCOUNT_TOKEN`**.  
   Niemals ins Repo committen; die Workflows nutzen ausschließlich den GitHub-Secret-Namen.
3. Das Service-Konto braucht im 1Password-Admin **Lesezugriff** auf Tresor **`05_INFRASTRUCTURE`** (alle `op://05_INFRASTRUCTURE/…`-Referenzen in `.github/workflows/`).

Ältere Referenz: Item **`1PASSWORT_Service Account Auth Token: AIOS`** — nur noch relevant, falls du ein Legacy-Konto parallel führst; CI ist auf **`05_INFRASTRUCTURE`** ausgerichtet.

Ohne gültigen `OP_SERVICE_ACCOUNT_TOKEN`: `load-secrets-action` schlägt fehl; viele Jobs nutzen `continue-on-error: true`, Builds können trotzdem ohne injizierte Secrets laufen.

### Geheimnisreferenzen (offizielle Doku)

- Übersicht: [Secret references](https://developer.1password.com/docs/cli/secret-references/) — `op://Tresor/Item/Feld` in Umgebungsvariablen, Konfiguration und Skripten **ohne Klartext** im Code.
- CLI: [Get started with 1Password CLI](https://developer.1password.com/docs/cli/get-started/) — `op signin` (lokal) bzw. Service-Account-Token (CI).

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

## Lokale Entwicklung (1Password-App + CLI)

- Mit **persönlicher** CLI-Session (`op signin`): Secrets aus Tresor laden, z. B.  
  `op run --env-file scripts/infra-1password.op.template -- <befehl>`  
  (nur `op://`-Referenzen in der Template-Datei, kein Klartext).
- Für n8n über Tailscale: `./scripts/op-run-n8n-tailscale.sh …` (setzt `N8N_BASE_URL` aus 1Password-Notiz).

## GitHub Secrets (Übersicht)

| Secret | Rolle |
|--------|--------|
| `OP_SERVICE_ACCOUNT_TOKEN` | Token des Service-Kontos **`1PASSWORT_300326_INFRA_HETZNER`** für `load-secrets-action@v2` |
