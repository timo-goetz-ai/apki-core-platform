# n8n: Fabrik-Index & Qdrant-Purge (Phase 3)

## Voraussetzungen

- Admin-Dashboard erreichbar (intern z. B. `https://admin.automation-plus-ki.de` oder Service-DNS in Docker).
- Env **`FABRIK_INTERNAL_WEBHOOK_TOKEN`** im Dashboard-Container gesetzt (langer Zufallswert).
- `NOCODB_*`, `QDRANT_*`, Embedding-Keys wie für `/fabrik` dokumentiert.

## Token-Header

Alle Hooks erwarten **eines** von:

- `x-fabrik-webhook-token: <FABRIK_INTERNAL_WEBHOOK_TOKEN>`
- `Authorization: Bearer <FABRIK_INTERNAL_WEBHOOK_TOKEN>`

Ohne gesetzte Variable antworten die Routen mit **503** (Absicherung gegen versehentliches Offenlassen).

## Route: Index (nach neuer Zeile / manuell)

**POST** `https://<admin-host>/api/fabrik/hooks/index`

**Body (JSON):**

```json
{
  "title": "Mein Snapshot",
  "snapshot_key": "slug-eindeutig",
  "owner": "n8n",
  "description": "Kurztext",
  "notes": "Zusatz fürs Embedding"
}
```

Gleiche Semantik wie `POST /api/fabrik/index`, aber nur mit Token.

## Route: Qdrant-Purge (nach Löschen in NocoDB)

Wenn eine NocoDB-Zeile entfernt wurde und der Qdrant-Punkt noch existiert:

**POST** `https://<admin-host>/api/fabrik/hooks/purge`

**Body (eines von beiden):**

```json
{ "qdrant_point_id": "uuid-des-punktes" }
```

oder

```json
{ "snapshot_key": "slug-eindeutig" }
```

Optional: `"actor": "n8n-workflow-name"` für Audit.

## n8n-Knoten (HTTP Request)

1. **Method:** POST  
2. **URL:** wie oben  
3. **Authentication:** None (Token manuell)  
4. **Send Headers:** `x-fabrik-webhook-token` = Expression `{{ $env.FABRIK_INTERNAL_WEBHOOK_TOKEN }}` oder fest aus Coolify-Secret  
5. **Body:** JSON aus vorherigem Schritt / aus NocoDB-Trigger-Feldern (`qdrant_point_id` aus Spalte bei Extended-Modus)

## Embedding-Nutzung / Quotas

Jeder erfolgreiche Embed schreibt einen Audit-Eintrag **`fabrik_embedding`** (Char-Länge, Modell, Collection). Auswertung z. B. in NocoDB-Tabelle `audit_trail` filtern nach `action`.

---

## Import-Workflow (wenn API durch CDN blockiert)

Datei: `infrastructure/n8n/workflows/aios-fabrik-index-http-hook.json` im Repo **Import** in n8n (Workflow → ⋮ → Import from File).

**n8n-Container (Coolify):** dieselbe Variable wie im Admin-Dashboard setzen:

`FABRIK_INTERNAL_WEBHOOK_TOKEN=<gleicher Wert wie im Dashboard>`

Der HTTP-Knoten liest den Header per Expression `{{ $env.FABRIK_INTERNAL_WEBHOOK_TOKEN }}`.

Manuell ausführen: Test-Daten im Manual-Trigger als JSON z. B. `{ "title": "Test", "snapshot_key": "slug-1" }`.

## n8n-Workflow: `FABRIK_INDEX_HOOK_URL`

Der Export `infrastructure/n8n/workflows/aios-fabrik-index-http-hook.json` nutzt für den HTTP-Request-Node:

`url` = `={{ $env.FABRIK_INDEX_HOOK_URL }}`

Setze im **n8n-Container** (Homestack `.env` + `docker-compose`):

- **`FABRIK_INDEX_HOOK_URL`**: Ziel-URL des Hooks, z. B. öffentlich `https://aios.automation-plus-ki.de/api/fabrik/hooks/index`, sofern Traefik/Authentik diesen Pfad ohne Session durchlässt.
- Alternativ **intern** (typisch, um Authentik zu umgehen): `http://<admin-container-ip>:3000/api/fabrik/hooks/index` — IP aus dem Docker-Netz des Admin-Services (Beispiel Coolify: `10.0.1.41`).

Zusätzlich weiterhin **`FABRIK_INTERNAL_WEBHOOK_TOKEN`** (identisch zum Dashboard).
