# Tabelle: activity_log

Chronologisches Log aller Aktivitäten.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | AutoNumber | PK | |
| timestamp | DateTime | | Default: now() |
| action | SingleSelect | | Scrape durchgeführt, Neue Jobs gefunden, Matching durchgeführt, … |
| details | LongText | | |
| related_job | LinkToAnotherRecord | | → jobs |
| related_match | LinkToAnotherRecord | | → matches |
| source | SingleSelect | | N8n Workflow, Manuell, System |
