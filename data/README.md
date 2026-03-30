# Daten-Seeds (AIOS)

| Datei | Zweck |
|--------|--------|
| `agents-seed-100.csv` | Kanonische **100 Agenten**: Name, Kategorie, Phase (10/20/30), Beschreibung, Register_Layer |

Synchronisation nach NocoDB:

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/nocodb-agents-sync-from-csv.py --dry-run   # Vorschau
python3 scripts/nocodb-agents-sync-from-csv.py             # PATCH/POST
```

Benötigt `services/admin-dashboard/.env.local` mit `NOCODB_URL` und `NOCODB_API_TOKEN`. Bei Cloudflare-Fehlern setzt das Skript einen expliziten `User-Agent`.
