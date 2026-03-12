---
title: "Code Review Checkliste"
version: "1.0.0"
tags: [code-review, checklist, quality, best-practices]
difficulty: beginner
last_updated: "2026-03-03"
---

# Code Review Checkliste

Checkliste für gründliche Code Reviews.

## Allgemein

- [ ] Versteht man den Code ohne ausführliche Erklärung?
- [ ] Sind Funktions- und Variablennamen aussagekräftig?
- [ ] Ist die Logik korrekt (Edge Cases, Off-by-one, etc.)?
- [ ] Gibt es Duplikationen, die extrahiert werden könnten?
- [ ] Sind alle TODO/FIXME-Kommentare adressiert oder getrackt?

## Fehlerbehandlung

- [ ] Werden alle Fehlerfälle behandelt?
- [ ] Sind Fehlermeldungen aussagekräftig (kein "Something went wrong")?
- [ ] Werden Exceptions nicht "geschluckt" (leere catch-Blöcke)?
- [ ] Werden Ressourcen bei Fehlern korrekt freigegeben?

## Tests

- [ ] Sind neue Features mit Tests abgedeckt?
- [ ] Werden Edge Cases getestet (null, leer, Grenzwerte)?
- [ ] Sind Tests unabhängig voneinander (keine geteilte State)?
- [ ] Sind Test-Namen aussagekräftig?

## Sicherheit

- [ ] Werden User-Eingaben validiert und sanitisiert?
- [ ] Keine Secrets oder Credentials im Code?
- [ ] SQL Injection / XSS / CSRF berücksichtigt?
- [ ] Sind Berechtigungsprüfungen korrekt?

## Performance

- [ ] Gibt es offensichtliche N+1-Query-Probleme?
- [ ] Werden große Datenmengen paginiert?
- [ ] Wird gecacht wo sinnvoll?

## Dokumentation

- [ ] Sind öffentliche APIs/Funktionen dokumentiert?
- [ ] Ist die README aktuell?
- [ ] Sind Breaking Changes dokumentiert?

## Review-Etikette

- [ ] Konstruktives Feedback, nicht persönlich
- [ ] Konkrete Verbesserungsvorschläge mit Code-Beispielen
- [ ] Lob für gute Lösungen aussprechen
- [ ] Bei Unklarheiten fragen, nicht annahmen treffen
