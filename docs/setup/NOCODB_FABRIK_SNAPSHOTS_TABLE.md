# NocoDB: Tabelle „Fabrik-Snapshots“ (Phase 2)

## Ziel

Eigene Tabelle statt Projekt-Fallback; optional **dedizierte Spalten** für Qdrant/Embedding, damit `beschreibung` nur menschenlesbar bleibt.

## Schritte in NocoDB

1. Content-Base öffnen (z. B. `pmox01979j55xbd`).
2. **Neue Tabelle** anlegen, z. B. `fabrik_snapshots`.
3. Spalten anlegen (Namen **exakt** wie unten — API-Body im Dashboard nutzt dieselben Keys):

| Spalte (API-Name)     | Typ            | Pflicht | Hinweis |
|-----------------------|----------------|---------|---------|
| `name`                | SingleLineText | ja      | Titel / Projektname |
| `beschreibung`        | LongText       | nein    | Beschreibung + Notizen |
| `emoji`               | SingleLineText | nein    | z. B. 🏭 |
| `status`              | SingleLineText | nein    | z. B. `entwurf` |
| `owner`               | SingleLineText | nein    | |
| `qdrant_point_id`     | SingleLineText | nein*   | *bei Extended-Modus empfohlen |
| `qdrant_collection`   | SingleLineText | nein*   | |
| `embed_model`         | SingleLineText | nein*   | |
| `snapshot_key`        | SingleLineText | nein*   | Idempotenz-Schlüssel |

> **Hinweis:** Wenn Noco andere interne Feldnamen erzeugt (z. B. `Qdrant_Point_Id`), entweder Spalten in Noco umbenennen oder die Keys im Code in `fabrik-index.ts` (`buildNocoRowPayload`) anpassen.

4. Tabellen-ID kopieren → in Coolify / `.env.local`:

```bash
NOCODB_FABRIK_TABLE_ID=<tabellen-id>
```

5. Optional **Extended-Spalten** aktivieren (dedizierte Qdrant-Felder, **kein** `---meta---`-Block in `beschreibung`):

```bash
FABRIK_NOCODB_EXTENDED_COLUMNS=true
```

Ohne `FABRIK_NOCODB_EXTENDED_COLUMNS`: Verhalten wie bisher — Meta-JSON steckt in `beschreibung` unter `---meta---`.

## Abnahme

- `POST /api/fabrik/index` mit Testtitel → Zeile sichtbar, bei Extended alle Spalten gefüllt.
- Re-Index mit gleichem `snapshot_key` → **eine** Zeile, Werte aktualisiert.


> **Stand Live-Base:** Tabelle `fabrik_snapshots` wurde angelegt; Tabellen-ID: `mx6wt60oh2050du` (Content-Base). In Coolify `NOCODB_FABRIK_TABLE_ID=mx6wt60oh2050du` und `FABRIK_NOCODB_EXTENDED_COLUMNS=true` setzen (lokal bereits in `services/admin-dashboard/.env.local`).
