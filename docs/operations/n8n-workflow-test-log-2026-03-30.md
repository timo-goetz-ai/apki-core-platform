# n8n Workflow Test Log

**Zweck:** Sequenzielle Tests jedes Workflows mit nachvollziehbarem Ergebnis (kein blindes Massentriggering in Produktion).

## Vorgehen

1. Inventar: `python3 scripts/n8n-workflow-inventory.py` (interne `N8N_BASE_URL` empfohlen)
2. Matrix: `python3 scripts/n8n-workflow-test-matrix-refresh.py` (optional `--from-exports-only`, `--execute-ids`)
3. Live-Umbenennung: `DRY_RUN=1 python3 scripts/n8n-rename-via-api.py` dann ohne `DRY_RUN` (interne URL)

## Testmatrix (Spalten)

| Workflow-Name (neu) | n8n-ID | Trigger-Typ | Klasse (safe / side-effect) | Getestet am (UTC) | Ergebnis | Execution-ID | Anmerkung |
|---------------------|--------|-------------|----------------------------|-------------------|----------|--------------|-----------|
| 10_50_NOCODB_BACKUP | — | schedule | side-effect | — | pending | — | export:automations/n8n-workflows/scheduled-jobs/10_50_NOCODB_BACKUP.json |
| 30_310_TREND_MONITOR | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/research/30_310_TREND_MONITOR.json |
| 30_340_NICHE_RESEARCH | — | schedule | side-effect | — | pending | — | export:automations/n8n-workflows/research/30_340_NICHE_RESEARCH.json |
| 30_350_CONTENT_FORECAST | — | schedule | side-effect | — | pending | — | export:automations/n8n-workflows/research/30_350_CONTENT_FORECAST.json |
| 30_360_DEEP_INSIGHTS | — | schedule | side-effect | — | pending | — | export:automations/n8n-workflows/research/30_360_DEEP_INSIGHTS.json |
| 40_30_CONTENT_IMAGE | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/content-pipeline/40_30_CONTENT_IMAGE.json |
| 40_32_CONTENT_VOICE | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/content-pipeline/40_32_CONTENT_VOICE.json |
| 40_40_PUBLISH_SOCIAL | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/content-pipeline/40_40_PUBLISH_SOCIAL.json |
| 40_410_PIXART_IMAGE | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/content-pipeline/40_410_PIXART_IMAGE.json |
| 40_41_PUBLISH_BLOG | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/content-pipeline/40_41_PUBLISH_BLOG.json |
| 40_420_FISH_AUDIO | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/content-pipeline/40_420_FISH_AUDIO.json |
| 40_435_WEEKLY_SUMMARY | — | schedule | side-effect | — | pending | — | export:automations/n8n-workflows/content-pipeline/40_435_WEEKLY_SUMMARY.json |
| 40_450_CONTENT_MASTER_FLOW_v2 | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/content-pipeline/40_450_CONTENT_MASTER_FLOW_v2.json |
| 40_460_GDRIVE_SYNC | rMY8O0y43F6oRGQa | schedule | side-effect | — | pending | — | export:automations/n8n-workflows/content-pipeline/40_460_GDRIVE_SYNC.json |
| 40_480_BATCH_TRIGGER | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/content-pipeline/40_480_BATCH_TRIGGER.json |
| 50_540_TELEGRAM_ASSISTANT | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/telegram/50_540_TELEGRAM_ASSISTANT.json |
| 50_541_WORKFLOW_CONTROL | — | other | side-effect | — | pending | — | export:automations/n8n-workflows/telegram/50_541_WORKFLOW_CONTROL.json |
| 50_542_STATUS_REPORT | — | other | side-effect | — | pending | — | export:automations/n8n-workflows/telegram/50_542_STATUS_REPORT.json |
| 50_543_RESEARCH_DATA | — | other | side-effect | — | pending | — | export:automations/n8n-workflows/telegram/50_543_RESEARCH_DATA.json |
| 50_550_JARVIS_APPROVAL_FLOW | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/telegram/50_550_JARVIS_APPROVAL_FLOW.json |
| 50_551_JARVIS_CALLBACK | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/telegram/50_551_JARVIS_CALLBACK.json |
| 50_560_JOB_MONITOR | vkaSv6LyosTreiWL | schedule | side-effect | — | pending | — | export:automations/n8n-workflows/job-monitor/50_560_JOB_MONITOR.json |
| File-Sort Webhook | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/event-driven/file-sort-webhook.json |
| coder-agent-workflow | — | webhook | side-effect | — | pending | — | export:automations/n8n-workflows/task-pipelines/coder-agent-workflow.json |
| research-jobs | — | schedule | side-effect | — | pending | — | export:automations/n8n-workflows/scheduled-jobs/research-jobs.json |

## Klassen

- **safe:** manueller Testlauf oder Execute mit Testdaten erlaubt.
- **side-effect:** nur nach expliziter Freigabe; dokumentieren, was geschrieben/gesendet wird.

## Hinweis Namensmigration

Siehe [N8N_WORKFLOW_RENAME_MAP.md](./N8N_WORKFLOW_RENAME_MAP.md). Audit: `docs/operations/n8n-webhook-subflow-audit-*.md`.

## Stand 2026-03-30 (Automation)

- **NocoDB `workflows`:** 7 Zeilen live umbenannt (`240_AIOS_DISCOVERY` … `540_TELEGRAM_ASSISTANT`) via `scripts/nocodb-workflows-rename-from-map.py`.
- **Testmatrix:** Zeilen aus Repo-Exporten + Klassifizierung; **Execution-ID** bleibt `pending`, bis Live-n8n API erreichbar ist (`N8N_BASE_URL` intern, nicht die öffentliche Subdomain mit Bot-/Cloudflare-Block).
- **n8n Live-Rename:** `scripts/n8n-rename-via-api.py` — zuerst `DRY_RUN=1`, dann auf Host im VPN z. B. `N8N_BASE_URL=http://10.0.1.16:5678`.
- **Gezielter API-Run:** `python3 scripts/n8n-workflow-test-matrix-refresh.py --execute-ids '<uuid>,…'` (API-Key mit Execute-Recht).
