# Prozess: Automatisierte Kundenakquisition

**Abteilung:** Vertrieb & Marketing  
**Agent:** SalesAgent  
**Trigger:** Neue Anfrage eingeht (E-Mail, Formular, Chat)

## Ablauf

```
Trigger: Neue Anfrage eingeht
  ↓
[CentralAgent] klassifiziert die Anfrage
  ↓
[SalesAgent → LeadAnalyzer] bewertet den Lead (Score 0–100)
  ↓
[SalesAgent → EmailWriter] verfasst ein personalisiertes Angebot
  ↓
[FinanceAgent → ContractMCP] erstellt den Vertragsentwurf
  ↓
[HRAgent → CalendarMCP] plant das Kickoff-Meeting
  ↓
[CentralAgent] versendet alle Unterlagen & überwacht den Status
```

## Beteiligte Skills

- `lead-analyzer` – Bewertet Leads anhand von Firmengröße, Branche und Anfragequelle
- `email-writer` – Verfasst personalisierte Angebots-E-Mails
- `deal-tracker` – Verfolgt den Vertriebsstatus nach

## Erfolgskriterien

- Lead-Score ≥ 70: sofortige Bearbeitung (< 1 h)
- Lead-Score 40–69: Bearbeitung innerhalb von 4 h
- Lead-Score < 40: automatische Nachverfolgung nach 48 h
