#!/usr/bin/env python3
"""
NocoDB Setup für Bewerbungs-Automation
- Erstellt Base "Bewerbungs-Automation" (falls nicht vorhanden)
- Erstellt Tabellen: platforms, keywords, jobs, matches, applications, activity_log, insights
- Seeded platforms

Nutzung:
  export NOCODB_URL="https://nocodb.deine-domain.de"
  export NOCODB_TOKEN="dein-api-token"
  python scripts/setup_nocodb.py

Oder:
  python scripts/setup_nocodb.py --url https://... --token xxx
"""

import os
import sys
import json
import argparse
import csv
from pathlib import Path

try:
    import requests
except ImportError:
    print("Bitte installieren: pip install requests")
    sys.exit(1)

# NocoDB API Base
def get_headers(token):
    return {
        "xc-token": token,
        "Content-Type": "application/json",
    }

def api_get(base_url, token, path):
    r = requests.get(f"{base_url.rstrip('/')}/api/v2{path}", headers=get_headers(token), timeout=30)
    r.raise_for_status()
    return r.json()

def api_post(base_url, token, path, data=None):
    r = requests.post(f"{base_url.rstrip('/')}/api/v2{path}", headers=get_headers(token), json=data or {}, timeout=30)
    r.raise_for_status()
    return r.json()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=os.environ.get("NOCODB_URL"), help="NocoDB URL (z.B. https://nocodb.domain.de)")
    parser.add_argument("--token", default=os.environ.get("NOCODB_TOKEN"), help="NocoDB API Token")
    args = parser.parse_args()

    if not args.url or not args.token:
        print("Fehler: NOCODB_URL und NOCODB_TOKEN erforderlich.")
        print("  export NOCODB_URL='https://...' NOCODB_TOKEN='...'")
        print("  oder: --url ... --token ...")
        sys.exit(1)

    base_url = args.url
    token = args.token

    print("Verbinde mit NocoDB...")

    # 1. Bases auflisten
    try:
        bases = api_get(base_url, token, "/meta/bases")
    except requests.exceptions.RequestException as e:
        print(f"Fehler bei Verbindung: {e}")
        sys.exit(1)

    # 2. Base "Bewerbungs-Automation" finden oder erstellen
    base_id = None
    for b in bases.get("list", []):
        if b.get("title") == "Bewerbungs-Automation":
            base_id = b.get("id")
            print(f"Base gefunden: {base_id}")
            break

    if not base_id:
        print("Base 'Bewerbungs-Automation' erstellen...")
        try:
            created = api_post(base_url, token, "/meta/bases", {"title": "Bewerbungs-Automation"})
            base_id = created.get("id")
            print(f"Base erstellt: {base_id}")
        except requests.exceptions.RequestException as e:
            print(f"Fehler beim Erstellen der Base: {e}")
            sys.exit(1)

    # 3. Tabellen erstellen (vereinfachtes Schema)
    # Hinweis: API-Struktur kann je nach NocoDB-Version variieren
    tables_config = [
        ("platforms", [
            {"title": "name", "uidt": "SingleLineText"},
            {"title": "url", "uidt": "SingleLineText"},
            {"title": "type", "uidt": "SingleLineText"},
            {"title": "scrape_method", "uidt": "SingleLineText"},
            {"title": "frequency", "uidt": "SingleLineText"},
            {"title": "active", "uidt": "Checkbox"},
        ]),
        ("keywords", [
            {"title": "keyword", "uidt": "SingleLineText"},
            {"title": "category", "uidt": "SingleLineText"},
            {"title": "priority", "uidt": "SingleLineText"},
            {"title": "weight", "uidt": "Number"},
            {"title": "active", "uidt": "Checkbox"},
        ]),
        ("jobs", [
            {"title": "title", "uidt": "SingleLineText"},
            {"title": "company", "uidt": "SingleLineText"},
            {"title": "description", "uidt": "LongText"},
            {"title": "location", "uidt": "SingleLineText"},
            {"title": "url", "uidt": "SingleLineText"},
            {"title": "remote_policy", "uidt": "SingleLineText"},
        ]),
        ("matches", [
            {"title": "total_score", "uidt": "Number"},
            {"title": "match_category", "uidt": "SingleLineText"},
            {"title": "status", "uidt": "SingleLineText"},
        ]),
        ("applications", [
            {"title": "status", "uidt": "SingleLineText"},
            {"title": "applied_at", "uidt": "DateTime"},
        ]),
        ("activity_log", [
            {"title": "action", "uidt": "SingleLineText"},
            {"title": "details", "uidt": "LongText"},
        ]),
        ("insights", [
            {"title": "title", "uidt": "SingleLineText"},
            {"title": "category", "uidt": "SingleLineText"},
            {"title": "description", "uidt": "LongText"},
        ]),
    ]

    table_ids = {}
    for table_name, columns in tables_config:
        try:
            existing = api_get(base_url, token, f"/meta/bases/{base_id}/tables")
            for t in existing.get("list", []):
                if t.get("title") == table_name:
                    table_ids[table_name] = t.get("id")
                    print(f"  Tabelle {table_name} existiert: {table_ids[table_name]}")
                    break
            else:
                payload = {"title": table_name, "columns": [{"title": c["title"], "uidt": c["uidt"]} for c in columns]}
                created = api_post(base_url, token, f"/meta/bases/{base_id}/tables", payload)
                table_ids[table_name] = created.get("id")
                print(f"  Tabelle {table_name} erstellt: {table_ids[table_name]}")
        except requests.exceptions.RequestException as e:
            print(f"  Fehler bei {table_name}: {e}")
            if "404" in str(e) or "meta" in str(e).lower():
                print("    → Meta-API ggf. nicht verfügbar. Tabellen manuell in NocoDB-UI anlegen.")

    # 4. Platforms seeden (Data API: /api/v2/tables/{tableId}/records)
    if "platforms" in table_ids:
        script_dir = Path(__file__).parent
        csv_path = script_dir.parent / "nocodb" / "seed" / "platforms_initial.csv"
        if csv_path.exists():
            with open(csv_path, encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # active als Boolean
                    if "active" in row:
                        row["active"] = row["active"].lower() == "true"
                    try:
                        api_post(base_url, token, f"/tables/{table_ids['platforms']}/records", row)
                        print(f"  Platform eingefügt: {row.get('name')}")
                    except requests.exceptions.RequestException as e:
                        print(f"  Fehler bei {row.get('name')}: {e}")

    print("\nFertig. Base-ID:", base_id)
    print("Table-IDs:", json.dumps(table_ids, indent=2))
    print("\nDiese IDs in N8n eintragen (NocoDB-Node).")

if __name__ == "__main__":
    main()
