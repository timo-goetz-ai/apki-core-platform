# MCP-Server: Document

**Zweck:** Automatische Dokumentengenerierung und -verwaltung  
**Protokoll:** MCP (Model Context Protocol)

## Verfügbare Operationen

| Operation | Beschreibung | Berechtigte Agenten |
|---|---|---|
| `generate` | Dokument aus Template erstellen | Alle Agenten |
| `store` | Dokument ablegen | Alle Agenten |
| `retrieve` | Dokument abrufen | Alle Agenten |
| `sign` | Digitale Unterschrift hinzufügen | FinanceAgent, HRAgent |
| `archive` | Dokument archivieren | CentralAgent |

## Konfiguration

```yaml
document_mcp:
  storage_backend: "${DOC_STORAGE}"    # z.B. "s3", "sharepoint", "local"
  storage_path: "${DOC_STORAGE_PATH}"
  template_dir: "docs/templates"
  default_format: "pdf"
  signing_provider: "${SIGNING_PROVIDER}"
```

## Template-Integration

Templates aus [`/docs/templates/`](../templates/README.md) werden automatisch mit Variablen befüllt.

## Sicherheit

- Alle gespeicherten Dokumente sind AES-256-verschlüsselt.
- Zugriff ist über Rollen geregelt (RBAC).
- Versionierung ist aktiviert – jede Änderung wird protokolliert.
