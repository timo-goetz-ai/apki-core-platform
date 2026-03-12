# Tabelle: applications

Bewerbungs-Tracking mit Timeline.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | AutoNumber | PK | |
| match | LinkToAnotherRecord | ✓ | → matches |
| status | SingleSelect | | 📝 Entwurf, ✅ Gesendet, 👁️ Gelesen, 📞 Rückmeldung, … |
| applied_at | DateTime | | |
| anschreiben_version | LongText | | |
| cv_version | SingleLineText | | |
| documents_sent | LongText | | |
| contact_person | SingleLineText | | |
| contact_email | Email | | |
| response_date | DateTime | | |
| response_type | SingleSelect | | Automatische Eingangsbestätigung, Persönliche Antwort, Einladung, Absage, … |
| interview_date | DateTime | | |
| interview_type | SingleSelect | | Telefon, Video, Vor-Ort, Assessment Center |
| interview_notes | LongText | | |
| interview_questions | LongText | | |
| follow_up_date | Date | | |
| follow_up_done | Checkbox | | Default: false |
| salary_discussed | SingleLineText | | |
| gut_feeling | Rating | | 1–5 |
| learnings | LongText | | |
| notes | LongText | | |
| created_at | DateTime | | Default: now() |
| updated_at | DateTime | | |
