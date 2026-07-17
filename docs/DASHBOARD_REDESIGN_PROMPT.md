# Dashboard Redesign — Prompt fuer naechste Session

Kopiere diesen Text als Startprompt in ein neues Claude-Fenster.

---

## Prompt Start

Ich arbeite am AIOS Admin Dashboard (`services/admin-dashboard`, Next.js 14 App Router). Das Dashboard soll fuer die Produktion vorbereitet werden. Es gibt 7 Sprints die nacheinander abgearbeitet werden. Der Plan liegt in `docs/DASHBOARD_ROADMAP.md`.

### Was heute passiert ist (2026-04-05):
- NocoDB komplett durch Directus ersetzt (alle Services, 24 n8n Workflows, APIs)
- Authentik SSO laeuft fuer alle Services (ausser n8n CE + Coolify)
- Postiz gefixt (Temporal Container hinzugefuegt)
- Voice Platform gestartet (voice.automation-plus-ki.de)
- Voice Debug Dashboard gebaut (`/monitoring/voice`) mit Deepgram STT + TTS
- Operations Center gebaut (`/workflows`) mit Live n8n Daten + Kategorie-System
- Sidebar aufgeraeumt (Technik-Gruppe zugeklappt)
- GitHub Actions CI gefixt (nur geaenderte Services bauen)
- Einheitliche Passwoerter gesetzt, 1Password aktualisiert

### Die 7 Sprints:

**Sprint 1: Aufraeumen (1-2h)**
- Suchen/Navigieren aus Header entfernen (AppHeader.tsx — das Cmd+K Feature)
- Service Status im Header: NocoDB + Coolify raus, nur aktive Services zeigen
- Einstellungen-Seite: veraltete NocoDB-Eintraege entfernen
- Build + Deploy

**Sprint 2: Live Dashboard & KPIs (2-3h)**
- Overview-Seite (`page.tsx`): 3-4 Prometheus-KPIs direkt einblenden (CPU, RAM, Disk, Uptime) als eigene Sparkline-Cards, KEIN Grafana-iframe
- Echtzeit-Feeling: Pulsing-Dots, Auto-Refresh 10s, letzte n8n-Ausfuehrungen live
- Grafana-Seite: iframe durch kuratierte Metriken ersetzen
- Build + Deploy

**Sprint 3: Agent Live Monitor Redesign (3-4h)**
- Farbschema: Bunt → Minimal (nur --accent-blue + --accent-green, Rest monochrom)
- 8er-Form (Infinity Loop) optimieren: diagonal/vertikal statt horizontal
- Agent-Cards: cleaner Business-Look (weniger Schatten, subtilere Animationen)
- Enterprise-Typografie: groessere Labels, klarere Hierarchie
- Agent-Workflows beibehalten — NUR visuelles Redesign
- WICHTIG: Website soll bald in Produktion, muss professionell aussehen
- Build + Deploy

**Sprint 4: Content Pipeline (2-3h)**
- Konzept: n8n produziert Content → Google Drive / Hetzner S3 → Dashboard zeigt an
- API Route: `/api/content/produced` → listet produzierte Inhalte mit Metadaten
- Content-Seite neu: Timeline-View (wann, was, wo, Status)
- Links zu Dateien (GDrive/S3 direkt)
- Build + Deploy

**Sprint 5: Einstellungen & Integrationen (1-2h)**
- Endpunkt-Uebersicht: alle Service-URLs + Live-Status im Operations Center
- Integrations-Karten: Git, Telegram Bot, Discord, Hetzner S3
- Health-Checks pro Integration (live Dots)
- Build + Deploy

**Sprint 6: Voice & KI-Influencerin (3-4h)**
- Fish Audio API Client erweitern (src/lib/fishaudio.ts existiert bereits, TTS + Voice Cloning)
- Voice-Seite erweitern: Fish Audio TTS + Voice Cloning neben Deepgram STT
- KI-Influencerin Demo: Webhook-Endpoint → AI Telefonassistentin
- Deepgram Latenz-Monitoring vertiefen (Voice Debug Page existiert unter /monitoring/voice)
- Build + Deploy

**Sprint 7: Final Polish (1-2h)**
- Sidebar finale Sortierung
- Mobile Responsive testen
- Alle Seiten durchklicken
- Performance/Bundle-Size
- Finaler Build + Deploy → Produktionsfreigabe

### Wichtige Dateien:
- Sidebar: `src/components/AppSidebar.tsx`
- Header: `src/components/AppHeader.tsx`
- Overview: `src/app/page.tsx`
- Monitoring: `src/app/monitoring/page.tsx`
- Agents Live: `src/app/agents/live/page.tsx`
- Workflows/Ops Center: `src/app/workflows/page.tsx`
- Voice Debug: `src/app/monitoring/voice/page.tsx`
- Content Factory: `src/app/content-factory/page.tsx`
- Settings: `src/app/settings/page.tsx`
- Kategorie-System: `src/lib/workflow-categories.ts`
- Deepgram Client: `src/lib/deepgram.ts`
- Fish Audio Client: `src/lib/fishaudio.ts`
- Design Tokens: `src/app/globals.css` (--layer-0 bis --layer-3, --accent-blue/green/red/amber, --text-primary/secondary/muted)

### Regeln:
- Vor jedem Push: `cd services/admin-dashboard && npm run build` fehlerfrei
- CSS: Nur CSS-Variablen, keine freien Hex-Werte
- Styling: Inline CSS-in-JS mit `var(--layer-2)` etc. (Pattern aus monitoring/page.tsx)
- Deploy: Push → GitHub Actions baut nur geaenderte Services → Coolify zieht Image
- Wenn Coolify-Deploy haengt: `ssh root@<HETZNER_HOST>` → `docker pull` + `docker restart`

### Starte mit Sprint [NUMMER HIER EINSETZEN].

---

## Prompt Ende
