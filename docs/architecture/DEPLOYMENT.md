# Agent Control Center — Deployment

## Authentik OIDC einrichten

1. **Authentik:** Applications → Providers → OIDC Provider anlegen
2. **Redirect URI:** `https://dashboard.automation-plus-ki.de/oauth2callback`
3. **Client ID** und **Client Secret** kopieren

## Coolify: Umgebungsvariablen

| Variable | Beschreibung |
|----------|--------------|
| `OIDC_CLIENT_ID` | Aus Authentik Provider |
| `OIDC_CLIENT_SECRET` | Aus Authentik Provider |
| `COOKIE_SECRET` | Zufälliger String (min. 32 Zeichen) |
| `BASE_DOMAIN` | Optional, Default: `automation-plus-ki.de` |
| `AUTHENTIK_PROVIDER_SLUG` | Optional, Default: `agent-dashboard` (muss mit Authentik-Provider-Slug übereinstimmen) |
| `DASHBOARD_DEV_MODE` | `1` = Auth umgehen (nur für lokale Entwicklung) |

## Lokal starten (ohne Authentik)

```bash
DASHBOARD_DEV_MODE=1 streamlit run dashboard.py
```

## Docker / Coolify

- Port: `8501`
- Subdomain: `dashboard.automation-plus-ki.de` in Traefik/Authentik konfigurieren
