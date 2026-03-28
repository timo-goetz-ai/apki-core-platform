# Fabrik: Vektordb (Qdrant) + NocoDB — Implementierungsplan

**Zweck:** Orientierung für Umsetzung und Kalkulation. **Truth:** NocoDB-Zeile; **Semantik:** Qdrant; **Einsteig:** `/fabrik` im Admin-Dashboard.

---

## Leitentscheidungen (vereinbart)

| Thema | Entscheidung |
|--------|----------------|
| System-of-Record | NocoDB (Metadaten, Status, Meta-JSON in `beschreibung`) |
| Vektoren | Qdrant-Collection `QDRANT_FABRIK_COLLECTION` (Default `aios_fabrik`) |
| Embeddings | OpenRouter bevorzugt, sonst Google `text-embedding-004` |
| Idempotenz | Optional `snapshot_key` → stabile Point-ID + Update derselben NocoDB-Zeile |
| Retrieval | Pflicht für Nutzen: API + UI „Ähnliche Snapshots“ |

---

## Phase 0 — Definition of Done (1 Checkliste)

- [ ] Coolify-Env gesetzt (siehe `.env.example` im Service `admin-dashboard`)
- [ ] NocoDB-Tabelle: Spalten passen zu Payload (`name`, `beschreibung`, `emoji`, `status`, optional `owner`)
- [ ] Ein manueller Lauf: Index → Zeile in NocoDB + Point in Qdrant
- [ ] Optional: gleicher `snapshot_key` erneut → **keine** zweite NocoDB-Zeile, Point überschrieben

---

## Phase 1 — Im Code umgesetzt (Referenz)

| Baustein | Ort |
|----------|-----|
| Embedding | `src/lib/embeddings.ts` |
| Qdrant Upsert / Search / Scroll | `src/lib/qdrant-rest.ts` |
| Index-Orchestrierung | `src/lib/fabrik-index.ts` |
| Semantische Suche | `src/lib/fabrik-search.ts` |
| Stabile IDs | `src/lib/fabrik-id.ts` |
| API Index | `POST /api/fabrik/index` |
| API Suche | `GET /api/fabrik/search?q=&limit=` |
| UI | `/fabrik` — Formular Index + Suche |

---

## Phase 2 — NocoDB produktiv sauber

- [ ] Eigene Tabelle **Fabrik-Snapshots** anlegen, `NOCODB_FABRIK_TABLE_ID` setzen (statt Projekt-Fallback)
- [ ] Spalten exakt benennen wie in NocoDB (Deutsch-Feldnamen beibehalten oder Mapping im Code)
- [ ] Optional: dedizierte Spalten `qdrant_point_id`, `embed_model` statt nur Meta in `beschreibung`

---

## Phase 3 — Automation & Betrieb

- [ ] n8n: nach Projekt-Anlage optional Webhook → `POST /api/fabrik/index` (intern)
- [ ] Kosten/Quotas: Embedding-Calls pro Tag loggen (Audit oder Metrics)
- [ ] Drift: Löschung NocoDB-Zeile → Qdrant-Bereinigung (geplanter Job oder manuell)

---

## Phase 4 — Crews / Agents (nur wenn priorisiert)

- [ ] Modell-Routing und Kosten je Rolle dokumentieren
- [ ] Fehlerpfade SSE → sichtbarer Status in UI / NocoDB

---

## Was bewusst nicht im Scope liegt

- Multi-Tenant-Isolation in Qdrant (erst bei echtem Bedarf Filter `tenant_id`)
- Vollständiges RAG über alle Dokumente (eigene Chunking-Pipeline)
- 12 Agenten-Personas ohne messbare Task-Trennung

---

## Env-Variablen (Namen)

Siehe `services/admin-dashboard/.env.example` — keine Secrets committen.

---

## Abnahme „Release Fabrik-Semantik“

1. Build `npm run build` grün  
2. Index mit und ohne `snapshot_key` getestet  
3. Suche liefert erwartete Treffer bei bekannten Titeln  
4. Runbook: wo Logs / Audit bei Fehler suchen  


---

## Umsetzungsstand (Code, 2026-03-28)

Erledigt im Repo:

- `src/lib/qdrant-rest.ts` — `qdrantRetrieveByIds`, `qdrantSearchSimilar`
- `src/lib/fabrik-id.ts` — deterministische Point-ID aus `snapshot_key`
- `src/lib/fabrik-search.ts` — semantische Suche mit Filter `kind=fabrik_snapshot`
- `src/lib/fabrik-index.ts` — optional `snapshot_key`, NocoDB **PATCH** bei bestehender Zeile, Audit `fabrik_reindex`
- `POST /api/fabrik/index` — Body-Feld `snapshot_key`, Antwort `reindexed`
- `GET /api/fabrik/search?q=&limit=` — JSON mit `hits`
- `/fabrik` — Felder Snapshot-Key, Ergebnis `reindexed`, Panel „Ähnliche Snapshots“
- `services/admin-dashboard/.env.example` — Variablennamen dokumentiert

Verifikation: `cd services/admin-dashboard && npm run build` grün.


---

## Phasen 2–4 umgesetzt (Code + Doku, 2026-03-28)

### Phase 2

- Anleitung: `docs/setup/NOCODB_FABRIK_SNAPSHOTS_TABLE.md`
- `FABRIK_NOCODB_EXTENDED_COLUMNS=true` → Spalten `qdrant_point_id`, `qdrant_collection`, `embed_model`, `snapshot_key`; `beschreibung` ohne `---meta---`
- API-Antwort `/api/fabrik/index`: `nocodb_extended`

### Phase 3

- `POST /api/fabrik/hooks/index` — gleicher Body wie Index, Header `x-fabrik-webhook-token` / Bearer
- `POST /api/fabrik/hooks/purge` — Body `qdrant_point_id` oder `snapshot_key`
- `FABRIK_INTERNAL_WEBHOOK_TOKEN` (ohne Token: Hooks 503/401)
- `qdrantDeletePoints` in `qdrant-rest.ts`; `fabrik-purge.ts`
- Audit-Aktion `fabrik_embedding` (Char-Count, Modell) + bestehende `fabrik_index` / `fabrik_reindex`
- n8n-Doku: `docs/n8n/FABRIK_WEBHOOKS.md`

### Phase 4

- `docs/architecture/CREW_MODEL_ROUTING.md` — Routing/Kosten/Checks
- `/agents`: SSE `onopen`/`onerror`, roter **Stream-Fault**-Banner, kein Auto-Close bei Transportfehler

