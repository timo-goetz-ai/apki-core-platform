# Prozess: Bewerberprozess

**Abteilung:** Human Resources  
**Agent:** HRAgent  
**Trigger:** Neue Bewerbung eingeht

## Ablauf

```
Trigger: Bewerbung eingeht
  ↓
[HRAgent → CV-Analyzer] analysiert Lebenslauf & Qualifikationen
  ↓
[HRAgent → Compliance-Checker] prüft rechtliche Anforderungen
  ↓
  ├─ Geeignet: Interview-Einladung per Calendar-MCP
  └─ Nicht geeignet: automatische Absage mit Feedback
  ↓
[HRAgent → Interviewer] führt strukturiertes Assessment durch
  ↓
[HRAgent → Contract-Generator] erstellt Vertragsangebot
  ↓
[HRAgent → Onboarder] startet Onboarding-Prozess
```

## Beteiligte Skills

- `interview-analysis` – Wertet Gesprächsnotizen und Assessment-Ergebnisse aus
- `contract-generation` – Erstellt Arbeitsverträge aus Templates
- `compliance-checker` – Prüft AGG, DSGVO und interne Richtlinien
- `payroll-processor` – Richtet Gehaltsabrechnung ein

## Erfolgskriterien

- Rückmeldung an Bewerber innerhalb von 48 h
- Gesamtprozessdauer ≤ 14 Werktage
