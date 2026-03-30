#!/usr/bin/env python3
"""
Synchronisiert Spalte `name` in NocoDB-Tabelle `workflows` mit N8N_WORKFLOW_RENAME_MAP.md.

Env:
  NOCODB_URL, NOCODB_API_TOKEN
Optional:
  NOCODB_WORKFLOWS_TABLE_ID  (Default: mfz43ghxesvn1yy)
  DRY_RUN=1

Lädt optional services/admin-dashboard/.env.local.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV = ROOT / "services" / "admin-dashboard" / ".env.local"
DEFAULT_MAP = ROOT / "docs" / "operations" / "N8N_WORKFLOW_RENAME_MAP.md"
DEFAULT_TABLE = "mfz43ghxesvn1yy"


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


def parse_map(md_path: Path) -> dict[str, str]:
    text = md_path.read_text(encoding="utf-8")
    m: dict[str, str] = {}
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 4:
            continue
        alt, neu = parts[1], parts[2]
        if alt in ("Alt", "---", ""):
            continue
        if "`" in alt:
            alt = alt.strip("`")
        if "`" in neu:
            neu = neu.strip("`")
        if alt and neu and alt != neu:
            m[alt] = neu
    return m


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
        "User-Agent": "aios-nocodb-workflows-rename/1.0",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"raw": raw[:2000]}
        return e.code, parsed


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


def row_name(row: dict) -> str:
    for k in ("name", "Name", "workflow_name", "Workflow_Name"):
        v = row.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def row_id(row: dict) -> int | None:
    for k in ("Id", "id"):
        v = row.get(k)
        if isinstance(v, int):
            return v
        if isinstance(v, str) and v.isdigit():
            return int(v)
    return None


def main() -> int:
    load_dotenv(DEFAULT_ENV)
    base = os.environ.get("NOCODB_URL", "").rstrip("/")
    token = os.environ.get("NOCODB_API_TOKEN", "").strip()
    table_id = os.environ.get("NOCODB_WORKFLOWS_TABLE_ID", DEFAULT_TABLE).strip()
    dry = os.environ.get("DRY_RUN", "").strip().lower() in ("1", "true", "yes")
    map_path = Path(os.environ.get("NOCODB_RENAME_MAP", str(DEFAULT_MAP)))

    if not base or not token:
        print("NOCODB_URL und NOCODB_API_TOKEN erforderlich.", file=sys.stderr)
        return 1
    if not map_path.is_file():
        print(f"Map fehlt: {map_path}", file=sys.stderr)
        return 1

    alt_to_neu = parse_map(map_path)
    rows = fetch_all_records(base, table_id, token)
    patched = 0
    missing = 0
    for row in rows:
        old = row_name(row)
        if not old or old not in alt_to_neu:
            continue
        new = alt_to_neu[old]
        if old == new:
            continue
        rid = row_id(row)
        if rid is None:
            print(f"[skip] kein Id für Zeile name={old!r}", file=sys.stderr)
            missing += 1
            continue
        name_key = "name" if "name" in row else "Name"
        if name_key not in row:
            name_key = "name"
        body = {"Id": rid, name_key: new}
        if dry:
            print(f"[dry-run] Id={rid} {old!r} -> {new!r}")
            patched += 1
            continue
        url = f"{base}/api/v2/tables/{table_id}/records"
        code, resp = noco_request("PATCH", url, token, body)
        if code != 200:
            print(f"[err] PATCH Id={rid} HTTP {code}: {resp!r}", file=sys.stderr)
            return 1
        print(f"[patched] Id={rid} {old!r} -> {new!r}")
        patched += 1

    print(f"\nFertig. patched={patched} dry_run={dry}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
