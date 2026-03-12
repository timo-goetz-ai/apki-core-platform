# MCP-Server: Database

**Zweck:** Direkter Zugriff auf alle Unternehmensdatenbanken  
**Protokoll:** MCP (Model Context Protocol)

## Verfügbare Operationen

| Operation | Beschreibung | Berechtigte Agenten |
|---|---|---|
| `query` | Lesender Datenbankzugriff | Alle Agenten |
| `insert` | Neue Datensätze anlegen | HRAgent, FinanceAgent, SalesAgent |
| `update` | Datensätze aktualisieren | HRAgent, FinanceAgent, SalesAgent, OpsAgent |
| `delete` | Datensätze löschen (Soft-Delete) | CentralAgent (nur mit Audit-Log) |

## Konfiguration

```yaml
database_mcp:
  host: "${DB_HOST}"
  port: 5432
  database: "${DB_NAME}"
  user: "${DB_USER}"
  password: "${DB_PASSWORD}"
  ssl: true
  connection_pool_size: 10
  query_timeout_seconds: 30
```

## Sicherheit

- Alle Verbindungen sind TLS-verschlüsselt.
- Jeder Zugriff wird im Audit-Log erfasst.
- Agenten erhalten nur Zugriff auf die für sie vorgesehenen Tabellen (Row-Level-Security).
