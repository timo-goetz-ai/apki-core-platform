# Prozess: Kundenanfrage-Routing

**Abteilung:** Kundenservice  
**Agent:** CustomerServiceAgent  
**Trigger:** Eingehende Kundenanfrage (E-Mail, Chat, Telefon)

## Ablauf

```
Trigger: Kundenanfrage eingeht
  ↓
[CustomerServiceAgent] analysiert Sprache & Sentiment
  ↓
[CustomerServiceAgent → FAQ-Responder] prüft Knowledge-Base
  ↓
  ├─ Antwort gefunden: sofortige automatische Antwort
  └─ Keine Antwort: Routing an zuständiges Team
  ↓
  ├─ Negatives Sentiment (hohe Dringlichkeit): Eskalation
  └─ Neutral/Positiv: Standard-Bearbeitung
  ↓
[CustomerServiceAgent] sendet Follow-up nach 24 h
```

## Beteiligte Skills

- `sentiment-analyzer` – Erkennt Kundenstimmung und Dringlichkeit
- `faq-responder` – Beantwortet häufige Fragen automatisch
- `ticket-router` – Leitet Anfragen an das richtige Team weiter
- `multilingual-support` – Verarbeitet Anfragen in mehreren Sprachen

## Erfolgskriterien

- Automatische Beantwortung: ≥ 70 % aller Anfragen
- Kundenzufriedenheit (CSAT): ≥ 4,5 / 5,0
- Erste Reaktionszeit: < 2 min
