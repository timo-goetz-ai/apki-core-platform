# n8n Workflow-Namen: Migration Layer → Phasen-Präfix (`10_` … `50_`)

**Kanonisch:** Anzeigenamen haben ein **Phasen-Präfix** vor dem bisherigen technischen Namen: `{PhaseDecade}_{Original}`, wobei für dreistellige Layer-Zahlen `PhaseDecade = floor(NNN/100)*10` gilt (z. B. `310_*` → `30_310_*`). Zwei- und einstellige Sonderfälle siehe Tabelle.

| Alt | Neu | Hinweis |
|-----|-----|---------|
| 310_TREND_MONITOR | 30_310_TREND_MONITOR | RESEARCH |
| 320_SENTIMENT_TRACKER | 30_320_SENTIMENT_TRACKER | ggf. nur Doku/Prod |
| 330_CONTENT_OPPORTUNITY | 30_330_CONTENT_OPPORTUNITY | ggf. nur Doku/Prod |
| 430_DAILY_DIGEST | 40_430_DAILY_DIGEST | ggf. nur Doku/Prod |
| 435_WEEKLY_SUMMARY | 40_435_WEEKLY_SUMMARY | Export + Doku |
| 450_CONTENT_MASTER_FLOW_v2 | 40_450_CONTENT_MASTER_FLOW_v2 | |
| 540_TELEGRAM_ASSISTANT | 50_540_TELEGRAM_ASSISTANT | |
| 240_AIOS_DISCOVERY | 20_240_AIOS_DISCOVERY | Doku |
| 340_NICHE_RESEARCH | 30_340_NICHE_RESEARCH | |
| 350_CONTENT_FORECAST | 30_350_CONTENT_FORECAST | |
| 360_DEEP_INSIGHTS | 30_360_DEEP_INSIGHTS | |
| 410_PIXART_IMAGE | 40_410_PIXART_IMAGE | |
| 420_FISH_AUDIO | 40_420_FISH_AUDIO | |
| 460_GDRIVE_SYNC | 40_460_GDRIVE_SYNC | |
| 480_BATCH_TRIGGER | 40_480_BATCH_TRIGGER | |
| 541_WORKFLOW_CONTROL | 50_541_WORKFLOW_CONTROL | |
| 542_STATUS_REPORT | 50_542_STATUS_REPORT | |
| 543_RESEARCH_DATA | 50_543_RESEARCH_DATA | |
| 550_JARVIS_APPROVAL_FLOW | 50_550_JARVIS_APPROVAL_FLOW | |
| 551_JARVIS_CALLBACK | 50_551_JARVIS_CALLBACK | |
| 560_JOB_MONITOR | 50_560_JOB_MONITOR | |
| 30_CONTENT_IMAGE | 40_30_CONTENT_IMAGE | 2-stellig → CONTENT |
| 32_CONTENT_VOICE | 40_32_CONTENT_VOICE | |
| 40_PUBLISH_SOCIAL | 40_40_PUBLISH_SOCIAL | zweites `40_` beabsichtigt |
| 41_PUBLISH_BLOG | 40_41_PUBLISH_BLOG | |
| 50_NOCODB_BACKUP | 10_50_NOCODB_BACKUP | Backup → Foundation |

**n8n live:** Workflows per UI oder API umbenennen (`PATCH /api/v1/workflows/:id`, Feld `name`). **NocoDB** `workflows`: Anzeigenamen synchronisieren. **Webhook-Pfade** separat prüfen.

**Repo:** `python3 scripts/n8n-apply-workflow-rename-in-repo.py` (ersetzt nur **Originalstrings**; überspringt diese Map und das Skript selbst). JSON-`name` und Dateinamen unter `automations/n8n-workflows/` werden angepasst.

## Live-Skripte (ohne Secrets im Repo)

| Skript | Zweck |
|--------|--------|
| `scripts/n8n-rename-via-api.py` | n8n: GET+PUT pro Treffer (`DRY_RUN=1` testen). **N8N_BASE_URL** idealerweise **intern** (öffentliche URL kann HTML/Cloudflare liefern). |
| `scripts/nocodb-workflows-rename-from-map.py` | NocoDB `workflows`: Spalte `name` gemäß Map (`DRY_RUN=1`). |
| `scripts/n8n-workflow-test-matrix-refresh.py` | Testlog-Tabelle; Fallback **Repo-Exporte** wenn API blockiert. |
| `scripts/n8n-audit-webhooks-subflows.py` | Webhooks + Execute-Workflow; `--from-exports` ohne API. |
| `scripts/coolify-watch-deployments.py` | Letzte Deployments (Env: `COOLIFY_URL`, `COOLIFY_TOKEN`). |
| `scripts/run-n8n-nocodb-live-rename.sh` | Reihenfolge: NocoDB → n8n → Matrix → Audit. |
