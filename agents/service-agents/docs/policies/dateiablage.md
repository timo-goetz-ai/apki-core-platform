# Dateiablage-Richtlinie

**Geltungsbereich:** Datei-Organizer, alle Agenten  
**Zweck:** Einheitliche Ablagestruktur für alle generierten und eingehenden Dateien.

## Namenskonvention

```
{YYYY-MM-DD}_{Abteilung}_{Dokumenttyp}_{Kurzbezeichnung}.{Endung}
```

**Beispiele:**
- `2025-06-15_Finance_Rechnung_Lieferant-XY.pdf`
- `2025-06-15_HR_Vertrag_Max-Mustermann.docx`
- `2025-06-15_Sales_Angebot_Kunde-ABC.pdf`

## Ablagestruktur

```
data/output/
├── {Abteilung}/
│   ├── {Dokumenttyp}/
│   │   └── {Jahr}/{Monat}/
│   │       └── Dateien...
```

## Aufbewahrungsfristen

| Dokumenttyp | Aufbewahrung | Verantwortlich |
|---|---|---|
| Rechnungen | 10 Jahre | FinanceAgent |
| Verträge | 10 Jahre | FinanceAgent / HRAgent |
| Korrespondenz | 6 Jahre | CentralAgent |
| Personalakten | Beschäftigungsdauer + 3 Jahre | HRAgent |
| Logs | 1 Jahr | ITAgent |

## Automatische Archivierung

Der `OrganizerAgent` verschiebt Dateien nach Ablauf der aktiven Phase automatisch in das Archiv-Verzeichnis.
