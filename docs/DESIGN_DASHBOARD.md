# Automation + KI Admin Dashboard
# DESIGN-DOC – Automation + KI Admin Dashboard

## 1. Überblick

Das **Automation + KI Admin Dashboard** ist die zentrale Steuereinheit für die Plattform
rund um:

- Nexus-Core API (`api.automation-plus-ki.de`)
- AIOS Admin Dashboard (`admin.automation-plus-ki.de`)
- Agents Platform, n8n, NocoDB, Monitoring (Grafana, Prometheus)
- SSO (Authentik) und Infrastruktur (Coolify, Homestack)

Ziel: Eine **klare, visuell hochwertige Oberfläche im Apple-Stil**, die
auch Außenstehende ohne Vorwissen bedienen und verstehen können.

**Technologie-Stack:**
- **Frontend**: Next.js 14 (App Router), TypeScript
- **UI**: Tailwind CSS, Framer Motion
- **Icons**: lucide-react
- **Charts** (nächste Phase): Chart.js oder Tremor
- **Backend-Datenquellen**:
  - `https://api.automation-plus-ki.de` (REST)
  - `wss://api.automation-plus-ki.de/ws/dashboard` (WebSocket)
  - `https://api.automation-plus-ki.de/metrics` (Prometheus)

---

## 2. Design-Guidelines

### Farben (Apple System Colors)

| Token          | Hex       | Verwendung                     |
|----------------|-----------|--------------------------------|
| Background     | `#06070f` | Seitenhintergrund              |
| Surface        | `rgba(255,255,255,0.03)` | Karten            |
| Border         | `rgba(255,255,255,0.07)` | Karten-Rahmen     |
| Text Primary   | `#f5f5f7` | Überschriften, Labels          |
| Text Secondary | `#86868b` | Beschreibungen                 |
| Text Muted     | `#48484a` | Timestamps, Monospace-URLs     |
| Apple Blue     | `#0a84ff` | Links, HTTP GET, Akzente       |
| Apple Green    | `#30d158` | Online-Status, POST            |
| Apple Yellow   | `#ffd60a` | Degraded-Status, Warnungen     |
| Apple Red      | `#ff453a` | Fehler, Offline                |
| Apple Purple   | `#bf5af2` | Auth, Monitoring               |
| Apple Teal     | `#5ac8fa` | WebSocket, Qdrant              |
| Apple Orange   | `#ff9f0a` | Agents-Platform                |

### Typografie

- Font-Family: `-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui`
- H1: `clamp(40px, 6vw, 62px)`, weight 700, letter-spacing -0.03em
- Section Title: 15px, weight 600
- Body: 17px, line-height 1.65
- Labels/Mono: 11–12px

### Animationen (Framer Motion)

- `fadeUp`: opacity 0→1, y +18→0, duration 0.5s, ease [0.25, 0.1, 0.25, 1]
- `stagger`: staggerChildren 0.07s
- Card hover: scale 1.025, duration 0.14s
- Platform tile hover: scale 1.04, duration 0.14s

---

## 3. Informationsarchitektur

### Heute implementiert (Overview `/`)

1. **TopBar** — Sticky Navigation
   - Logo + Gradient-Icon
   - Nav: Overview, Services, API, Metrics
   - Rechts: Live-Uhr + Production-Badge (API-Status)

2. **Hero-Bereich**
   - Environment-Chip (Production, Hetzner, IP)
   - Titel `Automation + KI / Control Center`
   - Subtitle (plattform-erklärender Text)
   - Status-Chips (API, Services, TLS, CDN, Docker)

3. **Letzte Aktivitäten** (Activity Feed)
   - Reale Ereignisse: DNS-Records, Container-Deploys, DB-Setup, CI-Fix
   - Icon + Farbe nach Typ (deploy/dns/database/build)

4. **Kern-Services** (4 Kacheln)
   - Admin Dashboard, Nexus-Core API, Infra Monitor, Agents Platform
   - Icon, Status-Dot, Beschreibung, URL (monospace), Latenz

5. **API & Endpoints**
   - Gruppiert: Status, Agents, Tasks, Data, Docs
   - Method-Badge (GET/POST/WS) mit Farbkodierung
   - Swagger UI + ReDoc Quick-Links

6. **Plattform-Übersicht** (Icon-Grid)
   - Alle 12 Subdomains
   - Icon + Name + Rolle + Subdomain-Kurzform
   - Hover: subtiler Farb-Glow nach Service-Farbe

7. **Footer**
   - Plattform-Info + letzter API-Timestamp

---

## 4. URLs & Zugangspunkte

| Service              | URL                                           |
|----------------------|-----------------------------------------------|
| **Admin Dashboard**  | https://admin.automation-plus-ki.de           |
| **Nexus-Core API**   | https://api.automation-plus-ki.de             |
| **API Docs**         | https://api.automation-plus-ki.de/docs        |
| **API Health**       | https://api.automation-plus-ki.de/health      |
| **Infra Monitor**    | https://infra.automation-plus-ki.de           |
| **Agents Platform**  | https://agents.automation-plus-ki.de          |
| **n8n**              | https://n8n.automation-plus-ki.de             |
| **NocoDB**           | https://nocodb.automation-plus-ki.de          |
| **Grafana**          | https://grafana.automation-plus-ki.de         |
| **Prometheus**       | https://prometheus.automation-plus-ki.de      |
| **AppFlowy**         | https://appflowy.automation-plus-ki.de        |
| **Authentik SSO**    | https://auth.automation-plus-ki.de            |
| **Coolify**          | https://coolify.automation-plus-ki.de         |
| **Qdrant**           | https://qdrant.automation-plus-ki.de          |

---

## 5. Nächste Ausbaustufen

- **`/services`** — Detailansichten mit Health-Status, Logs-Link, Grafana-Link
- **`/metrics`** — Prometheus-Charts (Chart.js/Tremor)
- **`/agents`** — Live-Agents + Tasks über WebSocket
- **`/activity`** — vollständiger Deployment-Zeitstrahl
- **Authentik SSO** — Login-Protection für das Dashboard
- **shadcn/ui** — Komponenten-Bibliothek für komplexere UI-Elemente
