# MCP-Server: Payment

**Zweck:** Sichere Verarbeitung finanzieller Transaktionen  
**Protokoll:** MCP (Model Context Protocol)

## Verfügbare Operationen

| Operation | Beschreibung | Berechtigte Agenten |
|---|---|---|
| `initiate_payment` | Zahlung auslösen | FinanceAgent |
| `check_status` | Zahlungsstatus prüfen | FinanceAgent |
| `cancel_payment` | Zahlung stornieren | FinanceAgent (mit GF-Bestätigung bei > 5.000 €) |
| `get_history` | Zahlungshistorie abrufen | FinanceAgent |

## Konfiguration

```yaml
payment_mcp:
  provider: "${PAYMENT_PROVIDER}"     # z.B. "sepa", "stripe", "sap"
  api_key: "${PAYMENT_API_KEY}"
  auto_approve_limit: 500.00          # EUR – über diesem Betrag: menschliche Genehmigung
  currency: "EUR"
  sandbox_mode: "${PAYMENT_SANDBOX}"  # true in development
```

## Sicherheit

- Jede Transaktion erfordert eine doppelte Signatur (Vier-Augen-Prinzip) ab 5.000 €.
- Alle Transaktionen werden im Audit-Log erfasst.
- Sandbox-Modus ist in Entwicklungsumgebungen immer aktiviert.
- PCI-DSS-konformer Betrieb.
