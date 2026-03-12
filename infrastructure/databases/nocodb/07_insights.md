# Tabelle: insights

Research-Erkenntnisse und Muster.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | AutoNumber | PK | |
| title | SingleLineText | | |
| category | SingleSelect | | Keyword-Erkenntnis, Markt-Trend, Branchen-Insight, Bewerbungs-Tipp, … |
| description | LongText | | |
| action_items | LongText | | |
| priority | SingleSelect | | Hoch, Mittel, Niedrig |
| created_at | DateTime | | Default: now() |
