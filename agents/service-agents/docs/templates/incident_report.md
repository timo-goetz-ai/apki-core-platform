# Vorlage: Incident-Report

**Verwendet von:** ITAgent  
**Variablen:** `{incident_id}`, `{datum}`, `{schweregrad}`, `{betroffene_systeme}`, `{beschreibung}`, `{massnahmen}`, `{status}`

---

# Incident-Report {incident_id}

**Datum:** {datum}  
**Schweregrad:** {schweregrad} (P1 / P2 / P3 / P4)  
**Status:** {status}

## Betroffene Systeme

{betroffene_systeme}

## Beschreibung

{beschreibung}

## Zeitlinie

| Zeit | Ereignis | Bearbeiter |
|---|---|---|
| - | Incident erkannt (automatisch durch ITAgent) | ITAgent |
| - | Eskalation ausgelöst | - |
| - | Problem behoben | - |

## Ursache

(Root-Cause-Analyse – wird nach Behebung ausgefüllt)

## Maßnahmen

{massnahmen}

## Präventionsmaßnahmen

- Maßnahmen zur Verhinderung ähnlicher Incidents in der Zukunft
