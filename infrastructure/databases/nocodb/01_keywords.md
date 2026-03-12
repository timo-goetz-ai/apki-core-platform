# Tabelle: keywords

Master-Liste aller Such-Keywords für Job-Research.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | AutoNumber | PK | |
| keyword | SingleLineText | ✓ | |
| keyword_en | SingleLineText | | Englische Übersetzung |
| category | SingleSelect | | Position, Industry, Skill, Benefit, Exclude, Synonym |
| priority | SingleSelect | | Primary, Secondary, Tertiary, Exploratory, Red-Flag |
| weight | Number | | 0–100, -100 für Exclude |
| active | Checkbox | | Default: true |
| notes | LongText | | |
| created_at | DateTime | | Default: now() |
| related_keywords | LinkToAnotherRecord | | Verlinkt zu keywords (Synonyme) |
