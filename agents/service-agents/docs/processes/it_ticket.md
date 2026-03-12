# Prozess: IT-Ticket-Bearbeitung

**Abteilung:** IT & Infrastruktur  
**Agent:** ITAgent  
**Trigger:** Neues Support-Ticket eingeht

## Ablauf

```
Trigger: Ticket eingeht
  ↓
[ITAgent] klassifiziert und priorisiert (P1–P4)
  ↓
  ├─ P1 (Kritisch): Sofortige Eskalation + Self-Healing-Versuch
  ├─ P2 (Hoch): Zuweisung an Fach-Ingenieur innerhalb 1 h
  ├─ P3 (Mittel): Automatische Lösung oder Warteschlange
  └─ P4 (Niedrig): FAQ-Antwort oder Knowledge-Base-Link
  ↓
[ITAgent → Monitoring] prüft Systemzustand kontinuierlich
  ↓
[ITAgent → Deployment] führt Patches/Fixes automatisch aus
  ↓
[ITAgent] schließt Ticket und dokumentiert Lösung
```

## Beteiligte Skills

- `ticket-classifier` – Kategorisiert und priorisiert Support-Tickets
- `self-healer` – Führt automatische Korrekturen bei bekannten Problemen durch
- `deployment-manager` – Orchestriert CI/CD-Pipelines
- `security-scanner` – Prüft auf Sicherheitslücken

## Erfolgskriterien

- First-Response-Zeit P1: < 5 min
- Automatische Lösung: ≥ 60 % aller P3/P4-Tickets
