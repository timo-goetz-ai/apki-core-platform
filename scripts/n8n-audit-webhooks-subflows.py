#!/usr/bin/env python3
"""
Liest alle Workflows von n8n, meldet Webhook-Pfade und Execute-Workflow-Referenzen.

Env: N8N_BASE_URL, N8N_API_KEY
Output: docs/operations/n8n-webhook-subflow-audit-OUT.md (Standard OUT=heute)

Lädt optional services/admin-dashboard/.env.local.
"""
from __future__ import annotations

import json
import argparse
import os
import sys
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
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


def n8n_get(url: str, api_key: str) -> tuple[int, object]:
    req = urllib.request.Request(
        url,
        headers={"X-N8N-API-KEY": api_key, "Accept": "application/json"},
        method="GET",
    )
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
            return e.code, json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            return e.code, {"_non_json": raw[:2500]}


def list_workflows(base: str, key: str) -> list[dict]:
    code, data = n8n_get(f"{base}/api/v1/workflows", key)
    if code != 200:
        raise RuntimeError(f"list HTTP {code}: {data!r}")
    if isinstance(data, dict) and "_non_json" in data:
        raise RuntimeError("n8n lieferte kein JSON — N8N_BASE_URL intern setzen.")
    rows = data.get("data") if isinstance(data, dict) else data
    if not isinstance(rows, list):
        raise RuntimeError("bad list")
    return [w for w in rows if isinstance(w, dict)]


def get_workflow(base: str, key: str, wf_id: str) -> dict:
    code, data = n8n_get(f"{base}/api/v1/workflows/{wf_id}", key)
    if code != 200:
        raise RuntimeError(f"get {wf_id} HTTP {code}: {data!r}")
    if isinstance(data, dict) and "_non_json" in data:
        raise RuntimeError("Workflow-Detail kein JSON (Proxy/Auth).")
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
    low = json.dumps(nodes).lower()
    if "nocodb" in low or "telegram" in low or "httprequest" in low:
        return trig, "side-effect"
    return trig, "safe"




def audit_from_exports() -> str:
    root = ROOT / "automations" / "n8n-workflows"
    lines: list[str] = [
        f"# n8n Webhook- & Subflow-Audit (Exporte, {date.today().isoformat()})",
        "",
        "Quelle: Repo-JSON unter `automations/n8n-workflows/` (kein Live-n8n).",
        "",
        "| Name | Datei | aktiv | Trigger | Klasse | Webhook-Pfade | Execute-Workflow-Refs |",
        "|------|-------|-------|---------|--------|---------------|----------------------|",
    ]
    for path in sorted(root.rglob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if not isinstance(data, dict):
            continue
        name = str(data.get("name") or "")
        if not name:
            continue
        nodes = data.get("nodes") or []
        trig, klass = classify(nodes)
        web_paths: list[str] = []
        exec_refs: list[str] = []
        for n in nodes:
            if not isinstance(n, dict):
                continue
            tt = str(n.get("type") or "")
            p = n.get("parameters") or {}
            if not isinstance(p, dict):
                p = {}
            if "webhook" in tt.lower():
                pathv = p.get("path") or p.get("pathSuffix") or ""
                if pathv:
                    web_paths.append(str(pathv))
            if "executeworkflow" in tt.replace("_", "").lower():
                wid = p.get("workflowId") or p.get("source") or ""
                if wid:
                    exec_refs.append(str(wid))
        rel = path.relative_to(ROOT)
        lines.append(
            "| "
            + " | ".join(
                [
                    name.replace("|", "\\|"),
                    str(rel).replace("|", "\\|"),
                    str(bool(data.get("active"))),
                    trig,
                    klass,
                    ", ".join(sorted(set(web_paths))) or "—",
                    ", ".join(sorted(set(exec_refs)))[:500] or "—",
                ]
            )
            + " |"
        )
    lines.append("")
    return "\n".join(lines)

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from-exports", action="store_true", help="Nur Repo-JSON, kein n8n API")
    args = ap.parse_args()

    out_name = os.environ.get("AUDIT_OUT", f"n8n-webhook-subflow-audit-{date.today().isoformat()}.md")
    out_path = ROOT / "docs" / "operations" / out_name

    if args.from_exports:
        out_path.write_text(audit_from_exports(), encoding="utf-8")
        print(f"Wrote {out_path.relative_to(ROOT)} (exports)")
        return 0

    load_dotenv(DEFAULT_ENV)
    base = os.environ.get("N8N_BASE_URL", "").rstrip("/")
    key = os.environ.get("N8N_API_KEY", "").strip()
    if not base or not key:
        print("N8N_BASE_URL und N8N_API_KEY erforderlich.", file=sys.stderr)
        return 1

    summaries = list_workflows(base, key)
    lines: list[str] = [
        f"# n8n Webhook- & Subflow-Audit ({date.today().isoformat()})",
        "",
        "Automatisch erzeugt durch `scripts/n8n-audit-webhooks-subflows.py`.",
        "",
        "## Workflows",
        "",
        "| Name | ID | aktiv | Trigger (Kurz) | Klasse | Webhook-Pfade | Execute-Workflow-Refs |",
        "|------|----|-------|----------------|--------|---------------|----------------------|",
    ]

    for s in sorted(summaries, key=lambda x: str(x.get("name") or "")):
        wf_id = str(s.get("id") or "")
        name = str(s.get("name") or "")
        active = s.get("active")
        detail = get_workflow(base, key, wf_id)
        nodes = detail.get("nodes") or []
        trig, klass = classify(nodes)
        web_paths: list[str] = []
        exec_refs: list[str] = []
        for n in nodes:
            if not isinstance(n, dict):
                continue
            t = str(n.get("type") or "")
            p = n.get("parameters") or {}
            if not isinstance(p, dict):
                p = {}
            if "webhook" in t.lower():
                path = p.get("path") or p.get("pathSuffix") or ""
                if path:
                    web_paths.append(str(path))
            if t.endswith("executeWorkflow") or "executeworkflow" in t.replace("_", "").lower():
                wid = p.get("workflowId") or p.get("source") or ""
                if wid:
                    exec_refs.append(str(wid))
        lines.append(
            "| "
            + " | ".join(
                [
                    name.replace("|", "\\|"),
                    wf_id,
                    str(bool(active)),
                    trig,
                    klass,
                    ", ".join(sorted(set(web_paths))) or "—",
                    ", ".join(sorted(set(exec_refs)))[:500] or "—",
                ]
            )
            + " |"
        )

    lines.append("")
    lines.append("## Hinweis")
    lines.append("")
    lines.append("- Nach Workflow-Umbenennung: Execute-Workflow-Knoten prüfen (ID vs. Name).")
    lines.append("- Webhook-URLs in Coolify/Traefik ändern sich nur, wenn der **Pfad** im Knoten geändert wurde (nicht der Anzeigename).")
    lines.append("")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {out_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
