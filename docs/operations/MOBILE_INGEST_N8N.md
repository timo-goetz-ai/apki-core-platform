# n8n Webhook: Mobile-Ingest

Redigierte Referenz — **keine** Tokens oder API-Keys in dieser Datei ablegen.

## Endpoint

| Umgebung | URL |
|----------|-----|
| Öffentlich (Traefik) | `https://n8n.automation-plus-ki.de/webhook/mobile-ingest` |
| Intern (Homestack) | `http://<n8n-host>:5678/webhook/mobile-ingest` |

Skripte/API von außen: wo möglich **interne** Basis-URL oder Tailscale nutzen; die öffentliche n8n-URL kann durch Cloudflare/UA-Regeln unzuverlässig für Automatisierung sein.

## Authentifizierung

- HTTP-Header: **`x-aios-token`**
- Wert: nur in **Coolify** (n8n-Workflow / Umgebung) oder **1Password** — nicht in Git, nicht in Chat-Logs.

Siehe auch: `docs/NEXUS_CORE_ZUGRIFF.md` (gleicher Header-Name für Nexus Core; je Route können unterschiedliche Geheimnisse gelten).

## Beispiel `curl` (Platzhalter)

```bash
curl -X POST "https://n8n.automation-plus-ki.de/webhook/mobile-ingest" \
  -H "Content-Type: application/json" \
  -H "x-aios-token: <TOKEN_AUS_1PASSWORD_ODER_COOLIFY>" \
  -d '{"type":"text","content":"Deine Idee hier","tags":["tag1"],"source":"mobile","priority":"hoch"}'
```

## Downstream

- NocoDB-Tabelle **`mobile_ingest`** (ID siehe `CLAUDE.md` → NocoDB Table-IDs).

## Bei Leak

Token sofort **rotieren** (n8n/Coolify), alte Werte in 1Password verwerfen, Zugriffslogs prüfen.
