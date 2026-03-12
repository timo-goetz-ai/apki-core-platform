# MCP-Server: Email

**Zweck:** Automatische Verarbeitung eingehender und ausgehender E-Mails  
**Protokoll:** MCP (Model Context Protocol)

## Verfügbare Operationen

| Operation | Beschreibung | Berechtigte Agenten |
|---|---|---|
| `send` | E-Mail versenden | Alle Agenten |
| `read` | Posteingang lesen | CentralAgent, SalesAgent, CustomerServiceAgent |
| `classify` | E-Mail klassifizieren | CentralAgent |
| `archive` | E-Mail archivieren | Alle Agenten |

## Konfiguration

```yaml
email_mcp:
  imap_host: "${EMAIL_IMAP_HOST}"
  smtp_host: "${EMAIL_SMTP_HOST}"
  port_imap: 993
  port_smtp: 587
  user: "${EMAIL_USER}"
  password: "${EMAIL_PASSWORD}"
  ssl: true
  check_interval_seconds: 60
```

## Verwendete Templates

Alle ausgehenden E-Mails nutzen Vorlagen aus [`/docs/templates/`](../templates/README.md).

## Sicherheit

- Eingehende E-Mails werden auf Phishing und Malware geprüft.
- Anhänge werden vor der Weiterverarbeitung durch den `ITAgent` gescannt.
