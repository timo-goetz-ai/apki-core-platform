---
title: "REST API Best Practices"
version: "1.0.0"
tags: [api, rest, best-practices, http, design]
difficulty: intermediate
last_updated: "2026-03-03"
---

# REST API Best Practices

Empfehlungen für das Design und die Implementierung von REST APIs.

## URL-Design

```
# ✅ Ressourcen-orientiert, Nomen, Plural
GET    /api/v1/users          # Liste aller User
GET    /api/v1/users/42       # Einzelner User
POST   /api/v1/users          # Neuen User erstellen
PUT    /api/v1/users/42       # User vollständig ersetzen
PATCH  /api/v1/users/42       # User partiell aktualisieren
DELETE /api/v1/users/42       # User löschen

# Verschachtelte Ressourcen
GET    /api/v1/users/42/posts        # Posts von User 42
GET    /api/v1/users/42/posts/7      # Post 7 von User 42

# ❌ Vermeiden
GET    /api/v1/getUsers
POST   /api/v1/deleteUser/42
GET    /api/v1/user_list
```

## HTTP Status Codes

| Code | Bedeutung | Verwendung |
|------|-----------|------------|
| 200 | OK | Erfolgreicher GET/PUT/PATCH |
| 201 | Created | Erfolgreicher POST |
| 204 | No Content | Erfolgreicher DELETE |
| 400 | Bad Request | Validierungsfehler |
| 401 | Unauthorized | Nicht authentifiziert |
| 403 | Forbidden | Nicht autorisiert |
| 404 | Not Found | Ressource nicht gefunden |
| 409 | Conflict | Konflikt (z.B. Email bereits vergeben) |
| 422 | Unprocessable Entity | Semantischer Validierungsfehler |
| 429 | Too Many Requests | Rate Limit überschritten |
| 500 | Internal Server Error | Serverfehler |

## Konsistente Fehlerantworten

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request data is invalid.",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

## Versionierung

```
# URL-basiert (empfohlen für große Änderungen)
/api/v1/users
/api/v2/users

# Header-basiert
Accept: application/vnd.myapi.v2+json
```

## Pagination

```
# Cursor-basiert (empfohlen für große Datensätze)
GET /api/v1/posts?cursor=eyJpZCI6MTAwfQ&limit=20

# Offset-basiert (einfacher, aber weniger performant)
GET /api/v1/posts?page=3&per_page=20

# Response
{
  "data": [...],
  "pagination": {
    "total": 500,
    "page": 3,
    "per_page": 20,
    "next_cursor": "eyJpZCI6MTQwfQ"
  }
}
```

## Sicherheit

- HTTPS immer erzwingen
- API-Keys / JWT in `Authorization`-Header, nicht in URL
- Rate Limiting implementieren
- Eingaben validieren und sanitisieren
- Sensitive Daten nicht in Responses zurückgeben
- CORS korrekt konfigurieren
