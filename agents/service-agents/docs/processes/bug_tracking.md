# Prozess: Bug-Tracking & Code-Review

**Abteilung:** Produktentwicklung & Innovation  
**Agent:** EngineeringAgent  
**Trigger:** Neuer Bug-Report oder Pull-Request

## Ablauf

```
Trigger: Bug-Report / PR eingeht
  ↓
[EngineeringAgent → Code-Analyzer] analysiert betroffenen Code
  ↓
  ├─ Bug: Schweregrad-Klassifizierung (Critical/Major/Minor)
  └─ PR: Automatisches Code-Review (Style, Sicherheit, Tests)
  ↓
[EngineeringAgent → Test-Runner] führt Regressionstests durch
  ↓
[EngineeringAgent → Doc-Generator] aktualisiert Dokumentation
  ↓
[CentralAgent] benachrichtigt zuständige Entwickler
```

## Beteiligte Skills

- `code-analyzer` – Analysiert Code auf Bugs, Sicherheitslücken und Style-Verstöße
- `test-runner` – Führt automatische Tests aus und wertet Ergebnisse aus
- `doc-generator` – Generiert und aktualisiert technische Dokumentation
- `dependency-checker` – Prüft Abhängigkeiten auf bekannte Schwachstellen

## Erfolgskriterien

- Code-Review-Zeit: < 30 min für PRs
- Automatische Test-Abdeckung: ≥ 80 %
- Critical Bugs behoben: < 4 h nach Meldung
