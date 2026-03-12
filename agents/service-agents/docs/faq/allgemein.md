# FAQ: Allgemeine Fragen

**Ziel-Agent:** CentralAgent  
**Aktualisiert:** automatisch

---

## Was macht das Automatisierungssystem?

Das System orchestriert spezialisierte KI-Agenten für verschiedene Unternehmensbereiche. Jeder Agent kann eigenständig Aufgaben ausführen, Entscheidungen treffen und bei Bedarf Menschen einbeziehen.

## Wie werden Anfragen verteilt?

Der CentralAgent klassifiziert eingehende Anfragen und leitet sie an den zuständigen Abteilungs-Agenten weiter. Die Klassifizierung erfolgt anhand von Schlüsselwörtern, Kontext und Historiedaten.

## Was passiert, wenn ein Agent unsicher ist?

Bei einer Konfidenz unter 70 % fordert der Agent automatisch eine menschliche Überprüfung an (Stufe-1-Eskalation gemäß [Eskalationsrichtlinie](../policies/eskalation.md)).

## Wie werden Datenschutzanforderungen eingehalten?

Alle Agenten folgen der [Datenschutzrichtlinie](../policies/datenschutz.md). Personenbezogene Daten werden nicht in Logs geschrieben und externe APIs erhalten keine unverschlüsselten Personendaten.

## Kann ich Agenten-Entscheidungen nachvollziehen?

Ja. Jede Agenten-Aktion wird im Audit-Log mit Zeitstempel, Begründung und Ergebnis erfasst.
