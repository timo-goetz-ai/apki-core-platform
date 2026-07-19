# Observability: Prometheus, Loki, Grafana Explore

Ziel: reproduzierbare Queries und Sprungmarken für den Homestack (Coolify, Traefik, Authentik). **Labels** (`job`, `container`, `namespace`) an eure echten Scrape-/Promtail-Werte anpassen — einmal in Explore verifizieren.

## Prometheus (PromQL)

**Ziel erreicht?** Metrik `up` und HTTP-Fehlerquoten pro Service.

```promql
# Erreichbarkeit (job-Namen anpassen)
up{job=~".*crew-api.*|.*nexus-core.*|.*admin.*"}

# Request-Rate crew-api (falls vorhanden)
rate(http_requests_total{job=~".*crew-api.*"}[5m])

# 5xx-Anteil
sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
  /
sum(rate(http_requests_total[5m])) by (job)
```

n8n als Prozess/Container wird oft über **cadvisor** oder **node_exporter** nicht als `job=n8n` geführt — stattdessen nach `container` oder `instance` filtern, falls euer Stack das so labelt.

## Loki (LogQL)

**n8n**

```logql
{container="homestack-n8n"} |= "error"
```

**crew-api** (nach Rollout der JSON-Zeilen aus `crew_manager`)

```logql
{container=~".*crew.*"} | json | event_type != ""
{container=~".*crew.*"} | json | event_type = "crew_execution_error"
```

**admin-dashboard / Next**

```logql
{container=~".*admin.*|.*infra-dashboard.*"} |= "error"
```

## Grafana Explore (Deep Links)

Die Overview-Sidebar baut URLs mit `left=` JSON (Datasource `prometheus` / `loki`). **Öffentliche Basis-URL:** per `NEXT_PUBLIC_GRAFANA_URL` setzen (Standard-Fallback im Code: `https://grafana.automation-plus-ki.de`).

Wenn Explore-Links leer laden: in Grafana unter **Connections → Data Sources** prüfen, ob UID/Name `prometheus` bzw. `loki` heißt; sonst `datasource` im JSON anpassen.

## Verwandte Dateien

- Admin-Dashboard: `src/components/overview/ObservabilityPanel.tsx`
- Grafana-API (intern): `src/app/api/monitoring/grafana/route.ts`
- n8n-Rename / Betrieb: `docs/operations/N8N_WORKFLOW_RENAME_MAP.md`
