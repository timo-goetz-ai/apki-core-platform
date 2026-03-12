# MCP-Server: Calendar

**Zweck:** Intelligente Terminkoordination für alle Abteilungen  
**Protokoll:** MCP (Model Context Protocol)

## Verfügbare Operationen

| Operation | Beschreibung | Berechtigte Agenten |
|---|---|---|
| `get_availability` | Verfügbare Zeitfenster abrufen | HRAgent, SalesAgent |
| `create_event` | Termin erstellen | HRAgent, SalesAgent, CentralAgent |
| `update_event` | Termin ändern | HRAgent, SalesAgent |
| `cancel_event` | Termin absagen | HRAgent, SalesAgent, CentralAgent |
| `send_invite` | Einladung versenden | HRAgent, SalesAgent |

## Konfiguration

```yaml
calendar_mcp:
  provider: "${CALENDAR_PROVIDER}"   # z.B. "google", "microsoft365"
  api_key: "${CALENDAR_API_KEY}"
  default_timezone: "Europe/Berlin"
  working_hours_start: "08:00"
  working_hours_end: "18:00"
  buffer_minutes: 15
```

## Planungsregeln

- Meetings werden bevorzugt am Vormittag eingeplant.
- Mindestvorlaufzeit für externe Meetings: 24 h.
- Back-to-back-Meetings werden automatisch verhindert (15 min Puffer).
