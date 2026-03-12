# CLAUDE.md – Salon Stack Kontext

## Projekt: KI-Flow Salon Automatisierung

### Übersicht
Multi-Tenant Salon-Management + KI-Automatisierung.
Kernprodukt: Terminbuchung, CRM, Reminder, Voicebot, Marketing-Flows.
Zielgruppe: Friseursalons (1–10 Mitarbeiter) in DACH.

### Infrastruktur
- **Server:** Hetzner CPX32 (46.224.145.109)
- **Domain:** automation-plus-ki.de
- **n8n:** n8n.automation-plus-ki.de (Automations-Engine)
- **Monitoring:** status.automation-plus-ki.de (Uptime Kuma)
- **Management:** portainer.automation-plus-ki.de

### Datenbanken (gleicher PostgreSQL Container)
- `n8n` — n8n interne Daten (NICHT anfassen)
- `salon_db` — Salon-Stack Daten (unser Schema)

### Projektstruktur
```
salon-stack/
├── CLAUDE.md                          # Diese Datei
├── db/
│   ├── migrations/
│   │   └── 001_initial_schema.sql     # Salon DB Schema
│   └── seeds/
│       └── demo_salon.sql             # Testdaten "Haarwerk Berlin"
├── n8n-workflows/
│   ├── 01-terminbuchung-webhook.json  # POST /webhook/salon-book
│   ├── 02-reminder-flow.json          # Cron: 08:00 (24h) + alle 15min (1h)
│   ├── 03-no-show-handling.json       # POST /webhook/salon-noshow
│   ├── 04-kpi-daily-snapshot.json     # Cron: 22:00
│   └── 05-reactivation-campaign.json  # Cron: Montag 10:00
├── scripts/
│   └── deploy-db.sh                   # Schema auf Server deployen
└── docs/
```

### n8n Webhook Endpoints
| Endpoint                  | Methode | Beschreibung                |
|---------------------------|---------|-----------------------------|
| `/webhook/salon-book`     | POST    | Termin buchen               |
| `/webhook/salon-noshow`   | POST    | No-Show melden              |

### n8n Credential Setup
Alle Workflows brauchen eine PostgreSQL Credential in n8n:
- **Name:** `Salon DB`
- **Host:** `postgres` (Docker-interner Hostname)
- **Port:** `5432`
- **Database:** `salon_db`
- **User/Password:** Aus der .env Datei

Die Credential-ID in den Workflow-JSONs muss nach Import angepasst werden
(Platzhalter: `SALON_DB_CREDENTIAL_ID`).

### Demo-Salon (Testdaten)
- **Salon:** Haarwerk Berlin (ID: `a0000000-...0001`)
- **Staff:** Lisa Müller (Owner), Anna Schmidt, Tom Weber
- **Services:** 7 Services (Schnitt, Farbe, Pflege)
- **Kunden:** 4 Testkunden
- **Buchungen:** 3 Testbuchungen (morgen + übermorgen)

### Wichtige Konventionen
- Alle Preise in **Cents** (€55.00 = 5500)
- Alle Zeiten in **UTC** mit Timezone `Europe/Berlin`
- Multi-Tenant via `salon_id` auf jeder Tabelle
- Telefonnummern im Format `+49170...`
- DSGVO: `gdpr_consent` + `marketing_consent` müssen true sein vor Messaging
- WhatsApp Templates müssen bei Meta approved werden bevor Versand

### Nächste Schritte
1. DB Schema deployen: `./scripts/deploy-db.sh --seed`
2. n8n Credential "Salon DB" anlegen
3. Workflows importieren (n8n UI → Import from File)
4. Credential-ID in jedem Workflow korrigieren
5. Workflows aktivieren und testen
