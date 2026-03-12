# Tabelle: platforms

Job-Plattformen und deren Konfiguration.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | AutoNumber | PK | |
| name | SingleLineText | ✓ | |
| url | URL | | |
| type | SingleSelect | | Jobbörse, Karrierenetzwerk, Unternehmensseite, Aggregator |
| scrape_method | SingleSelect | | API, RSS, HTML Scraping, Manual |
| api_endpoint | SingleLineText | | |
| search_url_template | SingleLineText | | Platzhalter: {keyword} |
| frequency | SingleSelect | | Täglich, Alle 2 Tage, Wöchentlich |
| active | Checkbox | | Default: true |
| last_scraped | DateTime | | |
| notes | LongText | | |
