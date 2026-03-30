# n8n: Strategische Phasen (10 / 20 / 30) ↔ Technische Layer (100er)

Dieses Dokument **verbindet zwei Achsen**, die parallel genutzt werden:

| Achse | Zweck | Wo sichtbar |
|--------|--------|-------------|
| **Phase 10 / 20 / 30** | Roadmap, Priorisierung, Agenten-Buckets, Management-Sicht | Doku, NocoDB (`agents.Phase` optional), Tickets |
| **Layer 100–599** | Technische n8n-Namenskonvention (Zahl im Namen) | **Workflow-Name** in n8n: `{Zehner}_{NNN}_…` (z. B. `30_310_TREND_MONITOR`) |

**Regel (2026-03-30):** Der **sichtbare Workflow-Name** setzt sich aus **Zehner-Layer** (`floor(NNN/100)*10`) und dem **bisherigen technischen Namen** zusammen: dreistellige Jobs wie `310_FOO` werden zu `30_310_FOO`. Sonderfälle (z. B. `40_PUBLISH_SOCIAL` → `40_40_PUBLISH_SOCIAL`, `50_NOCODB_BACKUP` → `10_50_NOCODB_BACKUP`) stehen in `docs/operations/N8N_WORKFLOW_RENAME_MAP.md`. Die strategischen Phasen **10 / 20 / 30** (NocoDB/Roadmap) bleiben **eigenständig** und ersetzen dieses Präfix nicht.

---

## 1. Technische Layer (Zahl im Namen, kanonisch)

| Layer | Präfix (Zahl im Namen) | Zweck |
|--------|-------------------------|--------|
| INGEST | `100–199` | Daten-Eingang (Webhook, Mobile, Obsidian) |
| BRAIN | `200–299` | KI-Kern, Routing, Logging, Discovery |
| RESEARCH | `300–399` | Trend, Sentiment, Content-Chancen |
| CONTENT | `400–499` | Pipeline, TTS, Templates, Digest |
| HUMAN | `500–599` | Telegram, Approvals, Trigger, Reports |

---

## 2. Strategische Phasen (Roadmap)

### Phase 10 — Foundation (Stabilität & Eingang)

**Ziel:** Warteschlangen, Zeitplan, zentrale Register, Zugriff, Bulk — alles, was ohne „intelligente“ Entscheidungen laufen muss.

| Thema | Typische technische Layer | Beispiel-Workflows (Muster) |
|--------|---------------------------|-----------------------------|
| Queue / Ingest | INGEST | `1xx_*` Webhooks, Mobile-Ingest-Pfade |
| Schedule / CRON | überall (Trigger) | bestehende Schedule-Workflows |
| Repository / Register | BRAIN + NocoDB | `workflows`-Tabelle, `agents`-Tabelle |
| Access / Logging-Basis | BRAIN | Routing, System-Logger-Subflows (`24x`-Bereich wenn vergeben) |

**Hinweis:** Coolify/Deploy-Steuerung ist **kein** n8n-Präfix — in Phase-10-Doku als „Plattform“ vermerken.

### Phase 20 — Intelligence (Datenfluss & Entscheidungen)

**Ziel:** Filtern, Routing, Metriken, tägliche/wöchentliche Reports, KI-gestützte Zwischenentscheidungen.

| Thema | Typische technische Layer | Beispiel-Workflows (Ist-System) |
|--------|---------------------------|--------------------------------|
| Query / Filter | BRAIN + NocoDB Views | IF/SWITCH, NocoDB-Nodes |
| Logic / Brain | BRAIN | Sub-Workflows „AI Brain Core“ |
| Research-Outputs | RESEARCH | `30_310_TREND_MONITOR`, `30_320_SENTIMENT_TRACKER`, `30_330_CONTENT_OPPORTUNITY` |
| Status / Digest | CONTENT (+ Ausgabe HUMAN) | `40_430_DAILY_DIGEST`, `40_435_WEEKLY_SUMMARY` |
| Metriken | extern Grafana/Prometheus | n8n ruft Webhooks/APIs an, kein eigener Layer |

**Korrektur älterer Entwürfe:** Nicht `11_`/`12_`/`60_` als Namen — das waren Abkürzungen. Kanonisch: **310 / 320 / 330 / 430**.

### Phase 30 — Autonomy (Selbstoptimierung & Human-in-the-Loop)

**Ziel:** Anomalien, Recovery-Ideen, Content-Master, Discovery neuer Workflows, Telegram/Discord als Steuerung.

| Thema | Typische technische Layer | Beispiel-Workflows (Ist/Muster) |
|--------|---------------------------|--------------------------------|
| Content-Pipeline | CONTENT | `40_450_CONTENT_MASTER_FLOW_v2` |
| Human / Approvals | HUMAN | `50_540_TELEGRAM_ASSISTANT` |
| Discovery / Index | BRAIN | `20_240_AIOS_DISCOVERY` (wenn aktiv), Workflow-Index-Sync |
| „Signal / Recovery“ | BRAIN + CONTENT | als **neue** Workflows im `2xx`/`4xx`-Bereich anlegen — Namen einhalten |

---

## 3. Matrix: Phase ↔ Layer (Überlappung ist Absicht)

```
Phase 10  ████ INGEST (Schwerpunkt)
          ███  BRAIN (Basis: Logger, Register, Routing-Grundlage)

Phase 20  ███  BRAIN (Schwerpunkt: Routing, Logik)
          ████ RESEARCH
          ██   CONTENT (Digest)

Phase 30  ██   RESEARCH (optional: erweiterte Jobs)
          ████ CONTENT
          ████ HUMAN
          ███  BRAIN (Discovery, Sync)
```

Eine Phase **spannt mehrere Layer**; ein Layer kann **mehreren Phasen** dienen (z. B. BRAIN in 10 und 20).

---

## 4. NocoDB `agents`-Tabelle (Empfehlung)

Zwei Felder ergänzen oder nutzen, ohne n8n umzubenennen:

| Feld | Werte | Bedeutung |
|------|--------|-----------|
| `Layer` | `INGEST` / `BRAIN` / … oder numerisch `100`–`599` | technische Zuordnung (bereits im Dashboard-Sort gedacht) |
| `Phase` | `10` / `20` / `30` | strategische Roadmap |

Optional: `workflow_id` (n8n-ID) + `workflow_name` (exakter String inkl. Präfix, z. B. `30_310_TREND_MONITOR`).

**Umsetzung (2026-03-30):** Spalte **Phase** in NocoDB-Tabelle `agents` als SingleSelect **10 / 20 / 30** angelegt. Wiederholbar/idempotent: `scripts/nocodb-agents-ensure-phase-column.sh` (nutzt `NOCODB_URL` + `NOCODB_API_TOKEN`). Admin-Dashboard: `NocoAgent.Phase`, Sortierung `getAgents()` nach `Phase`.

---

## 5. Agenten-Liste (100) — Arbeitsteilung

- **Kategorisierung** nach Agenten-Typ → zuerst **Phase** (10/20/30), dann **Layer** (100er).
- **Implementierung** mit **eindeutigem n8n-Namen** nach Rename-Map; Duplikat-Namen vermeiden.

---

## 6. Changelog

| Datum | Änderung |
|--------|----------|
| 2026-03-30 | Erstversion: duale Führung Phase 10/20/30 + Layer 100–599 |
| 2026-03-30 | Breaking: Workflow-Namen mit Zehner-Präfix (`30_310_*` …); siehe `N8N_WORKFLOW_RENAME_MAP.md` |
