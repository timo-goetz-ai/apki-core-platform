# Tabelle: matches

Profil-Matches mit detailliertem Scoring.

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| id | AutoNumber | PK | |
| job | LinkToAnotherRecord | ✓ | → jobs |
| total_score | Number | | 0–100 |
| match_category | SingleSelect | | 🔥 PERFECT, 🟢 STRONG, 🟡 GOOD, 🟠 PARTIAL, 🔴 LOW |
| position_score | Number | | 0–100 |
| skills_score | Number | | 0–100 |
| industry_score | Number | | 0–100 |
| location_score | Number | | 0–100 |
| experience_score | Number | | 0–100 |
| benefits_score | Number | | 0–100 |
| bonus_points | Number | | Bonus/Malus |
| red_flags | LongText | | |
| green_flags | LongText | | |
| matched_keywords | LongText | | JSON |
| missing_skills | LongText | | |
| scoring_explanation | LongText | | KI-generiert |
| status | SingleSelect | | 🆕 Neu, 👀 Angesehen, ⭐ Favorit, 📝 Bewerbung vorbereitet, 📩 Beworben, … |
| priority | SingleSelect | | 🔴 Sofort, 🟡 Diese Woche, 🟢 Kann warten, ⚪ Niedrig |
| notes | LongText | | |
| matched_at | DateTime | | Default: now() |
| last_updated | DateTime | | |
