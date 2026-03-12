# Runbook - Betriebshandbuch

## Zugangsdaten

| Zugang | Methode |
|--------|---------|
| Hetzner Server | `ssh deploy@46.224.145.109` |
| Coolify Dashboard | [coolify.automation-plus-ki.de](https://coolify.automation-plus-ki.de) |
| n8n | [n8n.automation-plus-ki.de](https://n8n.automation-plus-ki.de) |

## Haeufige Operationen

### Service neustarten

```bash
# Via MCP (empfohlen)
# -> Claude Code: "restart die n8n-App in Coolify"

# Via Coolify UI
# -> coolify.automation-plus-ki.de -> Stacks -> Service -> Restart

# Via SSH (Notfall)
ssh deploy@46.224.145.109
docker restart <container-name>
```

### Logs pruefen

```bash
# Via MCP
# -> Claude Code: "zeig mir die Logs von n8n"

# Via SSH
ssh deploy@46.224.145.109
docker logs n8n --tail 100 -f
```

### Datenbank-Backup

```bash
# PostgreSQL Backup (n8n)
ssh deploy@46.224.145.109
docker exec n8n-db pg_dump -U n8n n8n > /tmp/n8n_backup_$(date +%Y%m%d).sql

# PostgreSQL Backup (saas_production)
docker exec saas-postgres pg_dump -U postgres saas_production > /tmp/saas_backup_$(date +%Y%m%d).sql
```

### Neuen Stack deployen

1. Docker Compose File in `stacks/` anlegen
2. `.env.example` erstellen
3. DNS-Record in `terraform/main.tf` hinzufuegen
4. `terraform apply`
5. Stack in Coolify importieren oder `scripts/deploy-to-coolify.sh` nutzen

### Terraform-Aenderung anwenden

```bash
cd terraform
terraform plan     # Aenderungen pruefen
terraform apply    # Anwenden (mit Bestaetigung)
```

## Troubleshooting

### Service nicht erreichbar

1. DNS pruefen: `dig <subdomain>.automation-plus-ki.de`
2. Server erreichbar? `ping 46.224.145.109`
3. Container laeuft? `ssh deploy@46.224.145.109 "docker ps"`
4. Traefik-Logs: `ssh deploy@46.224.145.109 "docker logs coolify-proxy --tail 50"`
5. SSL-Zertifikat? `curl -vI https://<subdomain>.automation-plus-ki.de`

### Datenbank-Verbindung fehlgeschlagen

1. Container-Status: `docker ps | grep postgres`
2. Healthcheck: `docker inspect --format='{{.State.Health.Status}}' n8n-db`
3. Logs: `docker logs n8n-db --tail 20`
4. Verbindungstest: `docker exec n8n-db pg_isready -U n8n`

### Disk voll

```bash
# Speicher pruefen
df -h

# Docker aufraemen
docker system prune -f
docker volume prune -f  # VORSICHT: nur nicht genutzte Volumes

# Grosse Dateien finden
du -sh /var/lib/docker/volumes/* | sort -rh | head -10
```

### MCP Server antwortet nicht

1. Health-Endpoint: `curl https://mcp-coolify.automation-plus-ki.de/health`
2. Container-Logs: `docker logs mcp-coolify --tail 20`
3. Neustart: `docker restart mcp-coolify`
4. Env-Vars pruefen: `docker exec mcp-coolify env | grep -v PASSWORD`

## Wartungsfenster

### Monatliche Wartung

- [ ] Docker Images aktualisieren (`docker compose pull`)
- [ ] Datenbank-Backups pruefen
- [ ] SSL-Zertifikate pruefen (automatisch via Let's Encrypt)
- [ ] Disk-Auslastung pruefen
- [ ] Hetzner Snapshot erstellen (`terraform` oder MCP)
- [ ] Uptime Kuma Alerts pruefen

### Vor groesseren Aenderungen

1. Hetzner Snapshot erstellen
2. Datenbank-Backup machen
3. `terraform plan` ausfuehren
4. Aenderung in Testumgebung validieren (falls moeglich)
5. Aenderung anwenden
6. Monitoring pruefen (Uptime Kuma)
