---
title: "Code-Generierung GPT Template"
version: "1.0.0"
tags: [gpt, code-generation, template, ai]
difficulty: beginner
last_updated: "2026-03-03"
---

# Code-Generierung GPT Template

Vorlagen für präzise Code-Generierungsanfragen an GPT/Claude.

## Neue Funktion erstellen

```
Schreibe eine [Python/JavaScript/TypeScript]-Funktion, die folgendes tut:
[Genaue Beschreibung der Funktion]

Anforderungen:
- Eingabe: [Parameter und Typen]
- Ausgabe: [Return-Wert und Typ]
- Edge Cases behandeln: [z.B. leere Liste, None, negative Zahlen]
- Fehlerbehandlung: [z.B. ValueError wenn ...]
- Mit Type Hints / JSDoc
- Mit Docstring / Kommentaren

Beispiel:
- Input: [Beispiel-Eingabe]
- Expected Output: [Erwartete Ausgabe]
```

## API-Endpunkt erstellen

```
Erstelle einen REST API Endpunkt mit [FastAPI/Express/...]:

Endpunkt: [HTTP-Methode] [Pfad]
Zweck: [Was macht der Endpunkt?]

Request Body / Query Params:
[Beschreibung der Parameter]

Response:
- Erfolg (200): [Struktur]
- Fehler (4xx): [Fehlerfälle]

Zusätzlich:
- Input-Validierung
- Fehlerbehandlung
- Docstring / OpenAPI-Beschreibung
```

## Klasse / Datenmodell

```
Erstelle eine [Python-Klasse / TypeScript-Interface / Pydantic-Model] für:
[Beschreibung der Entität]

Felder:
- [feldname]: [Typ] – [Beschreibung]
- [feldname]: [Typ] – optional

Methoden (falls Klasse):
- [Methode]: [Beschreibung]

Validierungen:
- [Validierungsregel]
```
