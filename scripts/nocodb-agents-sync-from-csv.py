#!/usr/bin/env python3
"""
Synchronisiert NocoDB-Tabelle `agents` aus data/agents-seed-100.csv.

Setzt (PATCH): Typ (= Kategorie), Beschreibung, Phase, Layer (= Register_Layer).
Legt fehlende Namen neu an (POST) mit Minimal-Feldern.

Env (z. B. services/admin-dashboard/.env.local):
  NOCODB_URL, NOCODB_API_TOKEN, NOCODB_AGENTS_TABLE_ID (optional)
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = ROOT / "data" / "agents-seed-100.csv"
DEFAULT_ENV = ROOT / "services" / "admin-dashboard" / ".env.local"


def load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def noco_request(
    method: str,
    url: str,
    token: str,
    body: dict | None = None,
) -> tuple[int, object]:
    data = None
    headers = {
        "xc-token": token,
        "Accept": "application/json",
        "User-Agent": "aios-nocodb-sync/1.0 (+https://github.com/TimoGoetz1988/aios)",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            code = resp.status
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        code = e.code
    try:
        parsed = json.loads(raw) if raw else {}
    except json.JSONDecodeError:
        parsed = raw
    return code, parsed


def fetch_all_records(base: str, table_id: str, token: str) -> list[dict]:
    out: list[dict] = []
    offset = 0
    page = 200
    while True:
        url = f"{base}/api/v2/tables/{table_id}/records?limit={page}&offset={offset}"
        code, data = noco_request("GET", url, token)
        if code != 200:
            raise RuntimeError(f"GET records failed {code}: {data!r}")
        rows = data.get("list", data) if isinstance(data, dict) else data
        if not isinstance(rows, list):
            raise RuntimeError(f"unexpected payload: {type(data)}")
        out.extend(rows)
        if len(rows) < page:
            break
        offset += page
    return out


def main() -> int:
    p = argparse.ArgumentParser(description="NocoDB agents sync from CSV seed")
    p.add_argument("--csv", type=Path, default=DEFAULT_CSV, help="Path to agents-seed-100.csv")
    p.add_argument("--env-file", type=Path, default=DEFAULT_ENV, help=".env.local to load")
    p.add_argument("--dry-run", action="store_true", help="Only print planned changes")
    p.add_argument("--skip-create", action="store_true", help="Do not POST missing agents")
    args = p.parse_args()

    load_dotenv(args.env_file)
    base = os.environ.get("NOCODB_URL", "").rstrip("/")
    token = os.environ.get("NOCODB_API_TOKEN", "")
    table_id = os.environ.get("NOCODB_AGENTS_TABLE_ID", "m8c0rpjwx5d4bu2")
    if not base or not token:
        print("NOCODB_URL und NOCODB_API_TOKEN erforderlich.", file=sys.stderr)
        return 1

    if not args.csv.is_file():
        print(f"CSV fehlt: {args.csv}", file=sys.stderr)
        return 1

    seed: list[dict[str, str]] = []
    with args.csv.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            seed.append({k: (row.get(k) or "").strip() for k in row})

    by_name: dict[str, dict] = {}
    for r in seed:
        name = r.get("Name", "")
        if not name:
            continue
        by_name[name] = r

    if len(by_name) != 100:
        print(f"Warnung: erwartet 100 Namen, CSV hat {len(by_name)} eindeutige Namen.", file=sys.stderr)

    records = fetch_all_records(base, table_id, token)
    id_by_name = {}
    for rec in records:
        n = rec.get("Name")
        if n:
            id_by_name[n] = rec.get("Id")

    patched = 0
    created = 0
    missing_in_db: list[str] = []

    for name, row in sorted(by_name.items(), key=lambda x: x[0].lower()):
        rid = id_by_name.get(name)
        patch = {
            "Typ": row["Kategorie"],
            "Beschreibung": row["Beschreibung"],
            "Phase": row["Phase"],
            "Layer": row["Register_Layer"],
        }
        if rid is None:
            missing_in_db.append(name)
            if args.dry_run:
                print(f"[dry-run] WOULD CREATE {name!r} -> {patch}")
                continue
            if args.skip_create:
                print(f"[skip] fehlt in NocoDB: {name!r}")
                continue
            body = {
                "Name": name,
                "Typ": patch["Typ"],
                "Model": "register",
                "Status": "active",
                "Beschreibung": patch["Beschreibung"],
                "Layer": patch["Layer"],
                "Phase": patch["Phase"],
            }
            url = f"{base}/api/v2/tables/{table_id}/records"
            code, data = noco_request("POST", url, token, body)
            if code not in (200, 201):
                print(f"POST fehlgeschlagen {name!r} HTTP {code}: {data!r}", file=sys.stderr)
                return 1
            created += 1
            print(f"created {name} (HTTP {code})")
            continue

        if args.dry_run:
            print(f"[dry-run] WOULD PATCH Id={rid} {name!r} -> {patch}")
            patched += 1
            continue

        body = {"Id": int(rid), **patch}
        url = f"{base}/api/v2/tables/{table_id}/records"
        code, data = noco_request("PATCH", url, token, body)
        if code != 200:
            print(f"PATCH fehlgeschlagen {name!r} Id={rid} HTTP {code}: {data!r}", file=sys.stderr)
            return 1
        patched += 1
        print(f"patched {name} (Id={rid})")

    extra_db = sorted(set(id_by_name) - set(by_name))
    if extra_db:
        print(f"\nHinweis: {len(extra_db)} Agenten in NocoDB ohne Eintrag in CSV (unverändert):", file=sys.stderr)
        for n in extra_db[:25]:
            print(f"  - {n}", file=sys.stderr)
        if len(extra_db) > 25:
            print(f"  ... +{len(extra_db) - 25} weitere", file=sys.stderr)

    print(f"\nFertig: patched={patched}, created={created}, dry_run={args.dry_run}")
    if missing_in_db and not args.skip_create and not args.dry_run:
        print(f"Neu angelegt: {len(missing_in_db)} (siehe created count)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
