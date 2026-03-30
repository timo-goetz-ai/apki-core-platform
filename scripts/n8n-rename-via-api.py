#!/usr/bin/env python3
"""
Benennt Workflows in der laufenden n8n-Instanz um (Map → PATCH via GET+PUT).

Env:
  N8N_BASE_URL, N8N_API_KEY
Optional:
  N8N_RENAME_MAP  Pfad zur Markdown-Map (Default: docs/operations/N8N_WORKFLOW_RENAME_MAP.md)
  DRY_RUN=1       nur anzeigen

Lädt optional services/admin-dashboard/.env.local (keine Ausgabe von Secrets).
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV = ROOT / "services" / "admin-dashboard" / ".env.local"
DEFAULT_MAP = ROOT / "docs" / "operations" / "N8N_WORKFLOW_RENAME_MAP.md"


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


def parse_map(md_path: Path) -> list[tuple[str, str]]:
    text = md_path.read_text(encoding="utf-8")
    pairs: list[tuple[str, str]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 4:
            continue
        # | Alt | Neu | Hinweis |
        alt, neu = parts[1], parts[2]
        if alt in ("Alt", "---", ""):
            continue
        if "`" in alt:
            alt = alt.strip("`")
        if "`" in neu:
            neu = neu.strip("`")
        if not alt or not neu or alt == neu:
            continue
        pairs.append((alt, neu))
    # längere alte Namen zuerst
    pairs.sort(key=lambda x: -len(x[0]))
    return pairs


def n8n_request(
    method: str,
    url: str,
    api_key: str,
    body: dict | None = None,
) -> tuple[int, object]:
    data = None
    headers = {
        "X-N8N-API-KEY": api_key,
        "Accept": "application/json",
        "User-Agent": "aios-n8n-rename/1.0",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            if not raw.strip():
                return resp.status, {}
            try:
                return resp.status, json.loads(raw)
            except json.JSONDecodeError:
                return resp.status, {"_non_json": raw[:2500]}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            parsed = {"_non_json": raw[:2500]}
        return e.code, parsed


def list_workflows(base: str, api_key: str) -> list[dict]:
    url = f"{base}/api/v1/workflows"
    code, data = n8n_request("GET", url, api_key)
    if code != 200:
        raise RuntimeError(f"list workflows HTTP {code}: {data!r}")
    if isinstance(data, dict) and "_non_json" in data:
        raise RuntimeError(
            "n8n-Antwort ist kein JSON (Login/Authentik?). Erwartet: interne URL oder API-Key mit Zugriff."
        )
    rows = data.get("data") if isinstance(data, dict) else data
    if not isinstance(rows, list):
        raise RuntimeError(f"unexpected list payload: {type(data)}")
    return [w for w in rows if isinstance(w, dict)]


def get_workflow(base: str, api_key: str, wf_id: str) -> dict:
    url = f"{base}/api/v1/workflows/{wf_id}"
    code, data = n8n_request("GET", url, api_key)
    if code != 200:
        raise RuntimeError(f"get workflow {wf_id} HTTP {code}: {data!r}")
    if not isinstance(data, dict):
        raise RuntimeError("workflow detail not dict")
    return data


def put_workflow(base: str, api_key: str, wf: dict) -> tuple[int, object]:
    wf_id = wf.get("id")
    if not wf_id:
        raise RuntimeError("workflow ohne id")
    url = f"{base}/api/v1/workflows/{wf_id}"
    return n8n_request("PUT", url, api_key, wf)


def main() -> int:
    load_dotenv(DEFAULT_ENV)
    base = os.environ.get("N8N_BASE_URL", "").rstrip("/")
    key = os.environ.get("N8N_API_KEY", "").strip()
    dry = os.environ.get("DRY_RUN", "").strip().lower() in ("1", "true", "yes")
    map_path = Path(os.environ.get("N8N_RENAME_MAP", str(DEFAULT_MAP)))

    if not base or not key:
        print("N8N_BASE_URL und N8N_API_KEY erforderlich.", file=sys.stderr)
        return 1
    if not map_path.is_file():
        print(f"Map fehlt: {map_path}", file=sys.stderr)
        return 1

    pairs = parse_map(map_path)
    if not pairs:
        print("Keine Paare in der Map.", file=sys.stderr)
        return 1

    workflows = list_workflows(base, key)
    by_name: dict[str, list[str]] = {}
    for w in workflows:
        n = str(w.get("name") or "")
        i = str(w.get("id") or "")
        if not n or not i:
            continue
        by_name.setdefault(n, []).append(i)

    renamed = 0
    skipped = 0
    for old_name, new_name in pairs:
        ids = by_name.get(old_name)
        if not ids:
            # schon neu oder nicht vorhanden
            if by_name.get(new_name):
                print(f"[skip] bereits neu: {new_name!r}")
            else:
                print(f"[skip] nicht gefunden (alt): {old_name!r}")
            skipped += 1
            continue
        if len(ids) > 1:
            print(f"[warn] mehrere IDs für {old_name!r}: {ids}", file=sys.stderr)
        wf_id = ids[0]
        detail = get_workflow(base, key, wf_id)
        if detail.get("name") == new_name:
            print(f"[ok] schon {new_name!r} id={wf_id}")
            continue
        detail["name"] = new_name
        for k in ("createdAt", "updatedAt", "versionId", "meta", "pinData"):
            detail.pop(k, None)
        if dry:
            print(f"[dry-run] {old_name!r} -> {new_name!r} id={wf_id}")
            renamed += 1
            continue
        code, resp = put_workflow(base, key, detail)
        if code not in (200, 201):
            print(f"[err] PUT {old_name!r} HTTP {code}: {resp!r}", file=sys.stderr)
            return 1
        print(f"[renamed] {old_name!r} -> {new_name!r} id={wf_id}")
        renamed += 1
        by_name.pop(old_name, None)
        by_name.setdefault(new_name, []).append(wf_id)

    print(f"\nFertig. renamed={renamed} skipped_or_missing={skipped} dry_run={dry}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
