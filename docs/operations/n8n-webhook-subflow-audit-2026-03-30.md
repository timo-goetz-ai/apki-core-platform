# n8n Webhook- & Subflow-Audit (Exporte, 2026-03-30)

Quelle: Repo-JSON unter `automations/n8n-workflows/` (kein Live-n8n).

| Name | Datei | aktiv | Trigger | Klasse | Webhook-Pfade | Execute-Workflow-Refs |
|------|-------|-------|---------|--------|---------------|----------------------|
| 40_30_CONTENT_IMAGE | automations/n8n-workflows/content-pipeline/40_30_CONTENT_IMAGE.json | False | webhook | side-effect | content-image | — |
| 40_32_CONTENT_VOICE | automations/n8n-workflows/content-pipeline/40_32_CONTENT_VOICE.json | False | webhook | side-effect | content-voice | — |
| 40_40_PUBLISH_SOCIAL | automations/n8n-workflows/content-pipeline/40_40_PUBLISH_SOCIAL.json | False | webhook | side-effect | publish-social | — |
| 40_410_PIXART_IMAGE | automations/n8n-workflows/content-pipeline/40_410_PIXART_IMAGE.json | False | webhook | side-effect | pixart-image | — |
| 40_41_PUBLISH_BLOG | automations/n8n-workflows/content-pipeline/40_41_PUBLISH_BLOG.json | False | webhook | side-effect | publish-blog | — |
| 40_420_FISH_AUDIO | automations/n8n-workflows/content-pipeline/40_420_FISH_AUDIO.json | False | webhook | side-effect | fish-audio | — |
| 40_435_WEEKLY_SUMMARY | automations/n8n-workflows/content-pipeline/40_435_WEEKLY_SUMMARY.json | False | schedule | side-effect | — | — |
| 40_450_CONTENT_MASTER_FLOW_v2 | automations/n8n-workflows/content-pipeline/40_450_CONTENT_MASTER_FLOW_v2.json | True | webhook | side-effect | content-master | — |
| 40_460_GDRIVE_SYNC | automations/n8n-workflows/content-pipeline/40_460_GDRIVE_SYNC.json | True | schedule | side-effect | — | — |
| 40_480_BATCH_TRIGGER | automations/n8n-workflows/content-pipeline/40_480_BATCH_TRIGGER.json | False | webhook | side-effect | batch-trigger | — |
| File-Sort Webhook | automations/n8n-workflows/event-driven/file-sort-webhook.json | False | webhook | side-effect | file-sort | — |
| 50_560_JOB_MONITOR | automations/n8n-workflows/job-monitor/50_560_JOB_MONITOR.json | True | schedule | side-effect | — | — |
| 30_310_TREND_MONITOR | automations/n8n-workflows/research/30_310_TREND_MONITOR.json | True | webhook | side-effect | run-trend-monitor | — |
| 30_340_NICHE_RESEARCH | automations/n8n-workflows/research/30_340_NICHE_RESEARCH.json | False | schedule | side-effect | — | — |
| 30_350_CONTENT_FORECAST | automations/n8n-workflows/research/30_350_CONTENT_FORECAST.json | False | schedule | side-effect | — | — |
| 30_360_DEEP_INSIGHTS | automations/n8n-workflows/research/30_360_DEEP_INSIGHTS.json | False | schedule | side-effect | — | — |
| 10_50_NOCODB_BACKUP | automations/n8n-workflows/scheduled-jobs/10_50_NOCODB_BACKUP.json | False | schedule | side-effect | — | — |
| research-jobs | automations/n8n-workflows/scheduled-jobs/research-jobs.json | False | schedule | side-effect | — | — |
| coder-agent-workflow | automations/n8n-workflows/task-pipelines/coder-agent-workflow.json | False | webhook | side-effect | coder-agent/review | — |
| 50_540_TELEGRAM_ASSISTANT | automations/n8n-workflows/telegram/50_540_TELEGRAM_ASSISTANT.json | False | webhook | side-effect | telegram-assistant | {'__rl': True, 'value': 'PJooaBKts3OiDQHN', 'mode': 'id'}, {'__rl': True, 'value': 'UGDbCCci4P1SMjW6', 'mode': 'id'}, {'__rl': True, 'value': 'sJeuBZW98Cu8DTRv', 'mode': 'id'} |
| 50_541_WORKFLOW_CONTROL | automations/n8n-workflows/telegram/50_541_WORKFLOW_CONTROL.json | False | other | side-effect | — | — |
| 50_542_STATUS_REPORT | automations/n8n-workflows/telegram/50_542_STATUS_REPORT.json | False | other | side-effect | — | — |
| 50_543_RESEARCH_DATA | automations/n8n-workflows/telegram/50_543_RESEARCH_DATA.json | False | other | side-effect | — | — |
| 50_550_JARVIS_APPROVAL_FLOW | automations/n8n-workflows/telegram/50_550_JARVIS_APPROVAL_FLOW.json | False | webhook | side-effect | jarvis-intent | — |
| 50_551_JARVIS_CALLBACK | automations/n8n-workflows/telegram/50_551_JARVIS_CALLBACK.json | False | webhook | side-effect | jarvis-callback | — |
