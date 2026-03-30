#!/usr/bin/env python3
"""
Befüllt docs/operations/n8n-workflow-test-log-2026-03-30.md mit Inventar-Zeilen.
Optional: POST /api/v1/workflows/{id}/execute für ausgewählte IDs (siehe --execute-ids).

Env: N8N_BASE_URL, N8N_API_KEY (optional bei --from-exports-only)
Lädt optional services/admin-dashboard/.env.local.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV = ROOT / "services" / "admin-dashboard" / ".env.local"
LOG_PATH = ROOT / "docs" / "operations" / "n8n-workflow-test-log-2026-03-30.md"


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


def load_from_exports() -> list[dict]:
    root = ROOT / "automations" / "n8n-workflows"
    out: list[dict] = []
    for path in sorted(root.rglob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if not isinstance(data, dict):
            continue
        name = data.get("name")
        if not isinstance(name, str) or not name.strip():
            continue
        out.append(
            {
                "id": str(data.get("id") or ""),
                "name": name.strip(),
                "active": data.get("active"),
                "nodes": data.get("nodes") or [],
                "_note": f"export:{path.relative_to(ROOT)}",
            }
        )
    return out


def n8n_req(method: str, url: str, key: str, body: dict | None = None) -> tuple[int, object]:
    data = None
    headers = {"X-N8N-API-KEY": key, "Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
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
            return e.code, json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            return e.code, {"_non_json": raw[:2500]}


def list_workflows(base: str, key: str) -> list[dict]:
    code, data = n8n_req("GET", f"{base}/api/v1/workflows", key)
    if code != 200:
        raise RuntimeError(f"list HTTP {code}: {data!r}")
    if isinstance(data, dict) and "_non_json" in data:
        raise RuntimeError("n8n lieferte kein JSON (öffentliche URL/Authentik? interne N8N_BASE_URL).")
    rows = data.get("data") if isinstance(data, dict) else data
    if not isinstance(rows, list):
        raise RuntimeError("bad list")
    return [w for w in rows if isinstance(w, dict)]


def get_workflow(base: str, key: str, wf_id: str) -> dict:
    if not wf_id:
        return {}
    code, data = n8n_req("GET", f"{base}/api/v1/workflows/{wf_id}", key)
    if code != 200:
        return {}
    return data if isinstance(data, dict) else {}


def classify(nodes: list) -> tuple[str, str]:
    triggers: list[str] = []
    for n in nodes:
        if not isinstance(n, dict):
            continue
        t = str(n.get("type") or "")
        if "trigger" in t.lower() or "webhook" in t.lower():
            triggers.append(t)
    if any("webhook" in t.lower() for t in triggers):
        trig = "webhook"
    elif any("schedule" in t.lower() or "cron" in t.lower() for t in triggers):
        trig = "schedule"
    elif any("manual" in t.lower() for t in triggers):
        trig = "manual"
    else:
        trig = "other"
    blob = json.dumps(nodes).lower()
    if any(x in blob for x in ("nocodb", "telegram", "googlesheets", "slack")):
        return trig, "side-effect"
    return trig, "safe"


def try_execute(base: str, key: str, wf_id: str) -> tuple[str, str]:
    for suffix in ("/execute", "/run"):
        url = f"{base}/api/v1/workflows/{wf_id}{suffix}"
        code, data = n8n_req("POST", url, key, {})
        if code in (200, 201):
            if isinstance(data, dict):
                ex = (
                    data.get("executionId")
                    or data.get("data", {}).get("executionId")
                    or data.get("id")
                )
                return "success", str(ex or "")
            return "success", ""
        if code != 404:
            return f"http_{code}", str(data)[:200]
    return "no_execute_endpoint", ""


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--execute-ids", default="", help="Kommaseparierte n8n Workflow-UUIDs")
    p.add_argument("--execute-safe-only", action="store_true")
    p.add_argument("--from-exports-only", action="store_true")
    args = p.parse_args()

    load_dotenv(DEFAULT_ENV)
    base = os.environ.get("N8N_BASE_URL", "").rstrip("/")
    key = os.environ.get("N8N_API_KEY", "").strip()

    rows: list[dict] = []
    if args.from_exports_only:
        rows = load_from_exports()
        print(f"[info] Modus Exporte: {len(rows)} Workflows", file=sys.stderr)
    else:
        if not base or not key:
            print("N8N_BASE_URL/N8N_API_KEY fehlen → Fallback Exporte.", file=sys.stderr)
            rows = load_from_exports()
        else:
            try:
                rows = list_workflows(base, key)
            except Exception as e:
                print(f"[warn] live API: {e}", file=sys.stderr)
                rows = load_from_exports()
                print(f"[info] Fallback Exporte: {len(rows)} Workflows", file=sys.stderr)

    utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    execute_set = {x.strip() for x in args.execute_ids.split(",") if x.strip()}

    table_lines: list[str] = []
    for w in sorted(rows, key=lambda x: str(x.get("name") or "")):
        wf_id = str(w.get("id") or "")
        name = str(w.get("name") or "")
        nodes = w.get("nodes") or []
        if not nodes and wf_id and base and key:
            detail = get_workflow(base, key, wf_id)
            nodes = detail.get("nodes") or []
        trig, klass = classify(nodes)
        result = "pending"
        ex_id = ""
        note = str(w.get("_note") or "live API / Inventar")
        do_run = bool(base and key and wf_id) and (
            wf_id in execute_set or (args.execute_safe_only and klass == "safe")
        )
        if do_run and klass == "side-effect" and wf_id not in execute_set:
            do_run = False
            note = "Übersprungen (side-effect)"
        if do_run:
            st, eid = try_execute(base, key, wf_id)
            result = st
            ex_id = eid
            note = "API execute"
        table_lines.append(
            "| "
            + " | ".join(
                [
                    name.replace("|", "\\|"),
                    wf_id or "—",
                    trig,
                    klass,
                    utc if result != "pending" else "—",
                    result,
                    ex_id or "—",
                    note.replace("|", "\\|"),
                ]
            )
            + " |"
        )

    header = """# n8n Workflow Test Log

**Zweck:** Sequenzielle Tests jedes Workflows mit nachvollziehbarem Ergebnis (kein blindes Massentriggering in Produktion).

## Vorgehen

1. Inventar: `python3 scripts/n8n-workflow-inventory.py` (interne `N8N_BASE_URL` empfohlen)
2. Matrix: `python3 scripts/n8n-workflow-test-matrix-refresh.py` (optional `--from-exports-only`, `--execute-ids`)
3. Live-Umbenennung: `DRY_RUN=1 python3 scripts/n8n-rename-via-api.py` dann ohne `DRY_RUN` (interne URL)

## Testmatrix (Spalten)

| Workflow-Name (neu) | n8n-ID | Trigger-Typ | Klasse (safe / side-effect) | Getestet am (UTC) | Ergebnis | Execution-ID | Anmerkung |
|---------------------|--------|-------------|----------------------------|-------------------|----------|--------------|-----------|
"""

    footer = """
## Klassen

- **safe:** manueller Testlauf oder Execute mit Testdaten erlaubt.
- **side-effect:** nur nach expliziter Freigabe; dokumentieren, was geschrieben/gesendet wird.

## Hinweis Namensmigration

Siehe [N8N_WORKFLOW_RENAME_MAP.md](./N8N_WORKFLOW_RENAME_MAP.md). Audit: `docs/operations/n8n-webhook-subflow-audit-*.md`.
"""

    LOG_PATH.write_text(header + "\n".join(table_lines) + "\n" + footer, encoding="utf-8")
    print(f"Updated {LOG_PATH.relative_to(ROOT)} ({len(table_lines)} Zeilen)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
