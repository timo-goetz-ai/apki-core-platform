# Dashboard Roadmap — Admin Dashboard Redesign

Stand: 2026-04-05

---

## Umsetzungsplan (sequenziell abarbeiten)

### Sprint 1: Aufraeumen (1-2h)
```
[ ] 1.1  Suchen/Navigieren aus Header entfernen (AppHeader.tsx)
[ ] 1.2  Service Status: NocoDB + Coolify raus, nur aktive Services
[ ] 1.3  Einstellungen-Seite: veraltete NocoDB-Eintraege entfernen
[ ] 1.4  Build + Deploy
```

### Sprint 2: Live Dashboard & KPIs (2-3h)
```
[ ] 2.1  Overview-Seite: 3-4 Prometheus-KPIs direkt einblenden (CPU, RAM, Disk, Uptime)
         → Kein Grafana-iframe, sondern eigene Sparkline-Cards
[ ] 2.2  Echtzeit-Feeling: Pulsing-Dots, Auto-Refresh 10s, letzte Ausfuehrungen live
[ ] 2.3  Grafana-Seite: iframe durch kuratierte Metriken ersetzen
[ ] 2.4  Build + Deploy
```

### Sprint 3: Agent Live Monitor Redesign (3-4h)
```
[ ] 3.1  Farbschema: Bunt → Minimal (nur --accent-blue + --accent-green, Rest monochrom)
[ ] 3.2  8er-Form optimieren: diagonal/vertikal statt horizontal
[ ] 3.3  Agent-Cards: cleaner Business-Look (weniger Schatten, subtilere Animationen)
[ ] 3.4  Enterprise-Typografie: groessere Labels, klarere Hierarchie
[ ] 3.5  Agent-Workflows von Q AI beibehalten — nur visuelles Redesign
[ ] 3.6  Build + Deploy
```

### Sprint 4: Content Pipeline (2-3h)
```
[ ] 4.1  Konzept: n8n produziert → Google Drive / Hetzner S3 → Dashboard zeigt an
[ ] 4.2  API Route: /api/content/produced → listet produzierte Inhalte mit Metadaten
[ ] 4.3  Content-Seite neu: Timeline-View (wann, was, wo, Status)
[ ] 4.4  Links zu Dateien (GDrive/S3 direkt)
[ ] 4.5  Build + Deploy
```

### Sprint 5: Einstellungen & Integrationen (1-2h)
```
[ ] 5.1  Endpunkt-Uebersicht: alle Service-URLs + Status im Operations Center
[ ] 5.2  Integrations-Karten: Git, Telegram Bot, Discord, Hetzner S3
[ ] 5.3  Health-Checks pro Integration (live Dots)
[ ] 5.4  Build + Deploy
```

### Sprint 6: Voice & KI-Influencerin (3-4h)
```
[ ] 6.1  Fish Audio API Client erweitern (src/lib/fishaudio.ts — existiert bereits)
[ ] 6.2  Voice-Seite erweitern: Fish Audio TTS + Voice Cloning neben Deepgram STT
[ ] 6.3  KI-Influencerin Demo: Webhook-Endpoint → AI Telefonassistentin
[ ] 6.4  Deepgram Latenz-Monitoring vertiefen (bestehendes Voice Debug ausbauen)
[ ] 6.5  Build + Deploy
```

### Sprint 7: Final Polish (1-2h)
```
[ ] 7.1  Sidebar finale Sortierung pruefen
[ ] 7.2  Mobile Responsive testen
[ ] 7.3  Alle Seiten einmal durchklicken
[ ] 7.4  Performance: Bundle-Size pruefen
[ ] 7.5  Finaler Build + Deploy → Produktionsfreigabe
```

**Geschaetzter Gesamtaufwand: 13-20h**
**Empfehlung: 1 Sprint pro Session**

---

## Prioritat ROT — Sofort

### 1. Suchen & Navigieren entfernen
- **Problem:** Playground/Raycast-Integration veraltet, nicht mehr relevant
- **Aktion:** Feature entfernen oder sinnvoll umnutzen
- **Aufwand:** Gering

### 2. Service Status bereinigen
- **Problem:** Coolify permanent offline, NocoDB noch drin
- **Aktion:** NocoDB raus, nur aktive Services (n8n, Grafana, Authentik, Prometheus, LLM)
- **Aufwand:** Gering

### 3. Agent Live Monitor redesignen
- **Problem:** Zu futuristisch/bunt, nicht enterprise-tauglich
- **Aktion:**
  - Minimalistisches, professionelles Design
  - 8er-Form beibehalten aber diagonal/vertikal optimieren
  - Weniger Farben, mehr Business-Look
  - Agent-Workflows von Q AI beibehalten (sind gut)
- **Aufwand:** Hoch
- **Wichtig:** Website soll bald in Produktion

### 4. Grafana-KPIs kuratieren
- **Problem:** Stumpfes Grafana-Embed (iframe) mit zu vielen Balken
- **Aktion:** Nur 3-4 wichtigste Metriken extrahiert und kuratiert anzeigen
- **Aufwand:** Mittel

### 5. Live Dashboard Echtzeit-Feeling
- **Problem:** Dashboard fuehlt sich nicht "live" an
- **Aktion:** Echtzeit-Feeling + 3-4 wichtige Grafana-KPIs visuell eingeblendet
- **Aufwand:** Mittel

---

## Prioritat GELB — Naechste Phase

### 6. Content Pipeline Konzept
- **Problem:** Unklar wie es genutzt werden soll
- **Aktion:**
  - Content wird in n8n ueber Workflows produziert
  - Endet in Google Drive oder Hetzner Object Storage
  - Anzeige: Wann produziert, wo liegt es, wie nutzbar
  - Planung ueber separates Tool
- **Aufwand:** Mittel

### 7. Einstellungen aktualisieren
- **Problem:** Veraltete Eintraege (NocoDB etc.)
- **Aktion:**
  - Endpunkt-Uebersicht im Operations Center
  - Integrationen: Git, Telegram Bot, Discord Server, Hetzner Object Storage
- **Aufwand:** Gering

### 8. Integrationen einbinden
- **Aktion:** Git, Telegram, Discord, Hetzner Object Storage als Integrations-Karten
- **Aufwand:** Mittel

### 9. ElevenLabs Voice / KI-Influencerin
- **Problem:** Feature noch nicht integriert
- **Aktion:**
  - ElevenLabs (Jahresabo + API) fuer Content-Erstellung und Stimmenklonen
  - KI-Influencerin als Telefon-Assistentin (Webhook/Anruf -> AI geht ran)
  - Vermarktungszwecke: "Hier ist meine AI, sprich mit ihr"
- **Aufwand:** Hoch

### 10. DeepGram Latenz-Monitoring
- **Problem:** Real-time API hat Latenz-Probleme in Produktion
- **Aktion:** Uebersicht zum Einstellen und Live-Debuggen der Latenz (Voice Debug Page existiert bereits)
- **Aufwand:** Hoch

---

## Tool-Glossar

| Sprechweise | Tool | Funktion |
|-------------|------|----------|
| NN | n8n | Workflow-Automation |
| Kify | Coolify | Self-Hosting PaaS |
| no DB / noko B | NocoDB | Airtable-Alternative (durch Directus ersetzt) |
| CI Authentic | Authentik | Identity Provider / SSO |
| Graffana | Grafana | Monitoring Dashboards |
| Promethous | Prometheus | Metrics Collection |
| Deep Cram | Deepgram | Real-time STT API |
| Audio/Stimmen klonen | ElevenLabs | TTS / Voice Cloning |
| Blaground | Playground | LLM-Testumgebung |
| Recast | Raycast | Productivity Launcher |
| Hetzner/Hermann | Hetzner Cloud | Server / Object Storage |
| Q AI / T-AI | AIOS | AI Agent Platform |
