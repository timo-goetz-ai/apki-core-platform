# Tabelle: jobs

Gefundene Stellenanzeigen.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | AutoNumber | PK | |
| title | SingleLineText | ✓ | |
| company | SingleLineText | ✓ | |
| company_size | SingleSelect | | Startup (1-50), KMU (51-250), Mittelstand (251-1000), Großunternehmen (1000+), Konzern (10000+), Unbekannt |
| description | LongText | ✓ | |
| description_summary | LongText | | KI-generierte Zusammenfassung |
| location | SingleLineText | | |
| remote_policy | SingleSelect | | 100% Remote, Remote-First, Hybrid (1-2 Tage), Hybrid (3-4 Tage), Vor-Ort, Nicht angegeben |
| salary_min | Number | | |
| salary_max | Number | | |
| salary_raw | SingleLineText | | Original aus Anzeige |
| employment_type | SingleSelect | | Vollzeit, Teilzeit, Freelance, Befristet, Werkstudent, Praktikum |
| experience_level | SingleSelect | | Quereinsteiger, Junior (0-2), Mid-Level (2-5), Senior (5-10), Lead/Principal (10+), Nicht angegeben |
| url | URL | ✓ | |
| platform | LinkToAnotherRecord | | → platforms |
| extracted_keywords | LongText | | JSON-Array |
| required_skills | LongText | | |
| benefits | LongText | | |
| contact_email | Email | | |
| contact_person | SingleLineText | | |
| posted_date | Date | | |
| deadline | Date | | |
| scraped_at | DateTime | | Default: now() |
| is_duplicate | Checkbox | | Default: false |
| raw_data | LongText | | Original HTML/JSON |
