# Operations Runbook

Kurzreferenz für Betrieb von **apki-core-platform** auf Hetzner/Coolify.

## Postgres Backups

**Self-hosted (aktuell)**
- Täglich: Cron auf Host mit `pg_dump` → gzip → externes Volume/S3
- Retention: 7 Tage rolling
- Restore: `gunzip -c backup.sql.gz | psql -U aios_user -d aios_db`
- **Monatlich:** Test-Restore auf Staging durchführen

**Managed (optional)**
- Hetzner Managed Postgres: Daily backups, 7-day retention

## Health Checks

```bash
# nexus-core
curl -sf https://api.aios.automation-plus-ki.de/health

# admin-dashboard
curl -sf -o /dev/null -w "%{http_code}" https://admin.automation-plus-ki.de

# crew-api (intern)
curl -sf http://localhost:8002/health

# Postgres
docker exec aios-db psql -U aios_user -d aios_db -c "SELECT 1"
```

## Monitoring

| Signal | Threshold | Action |
|--------|-----------|--------|
| CPU | > 80% sustained | VPS upgraden oder Services limitieren |
| Disk | > 90% | Logs rotieren, Docker prune, Volumes prüfen |
| DB connections | > 50 | Connection leaks prüfen, Pool-Size anpassen |
| Uptime Kuma | Down | Siehe Incident Response |

Tools: Prometheus, Grafana, Uptime Kuma (`status.automation-plus-ki.de`)

## Incident Response

1. **Logs:** `docker compose logs nexus-core --tail=100`
2. **Disk:** `df -h` auf Host
3. **Prozesse:** `docker stats` / `top`
4. **Restart:** `docker compose restart nexus-core` oder Coolify Redeploy
5. **Rollback:** GitHub Actions `deploy-prod` Rollback-Job oder `infra/rollback.md`

## Deploy

```
Push main → GitHub Actions → GHCR → Coolify API → Health Check
Prod: git tag v* && git push origin v*
```

Siehe auch: [infrastructure/RUNBOOK.md](../infrastructure/RUNBOOK.md)
