#!/usr/bin/env python3
"""n8n Workflow-Inventar. Env: N8N_BASE_URL, N8N_API_KEY."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request


def main() -> int:
    base = os.environ.get("N8N_BASE_URL", "").rstrip("/")
    key = os.environ.get("N8N_API_KEY", "").strip()
    if not base or not key:
        print("Setze N8N_BASE_URL und N8N_API_KEY", file=sys.stderr)
        return 1

    url = f"{base}/api/v1/workflows"
    req = urllib.request.Request(
        url,
        headers={"X-N8N-API-KEY": key, "Accept": "application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                data = json.loads(raw) if raw.strip() else {}
            except json.JSONDecodeError:
                print("Antwort ist kein JSON (Authentik/HTML?). Interne N8N_BASE_URL nutzen.", file=sys.stderr)
                print(raw[:1500], file=sys.stderr)
                return 1
    except urllib.error.HTTPError as e:
        print(e.read().decode()[:2000], file=sys.stderr)
        return e.code

    rows = data.get("data") if isinstance(data, dict) else data
    if not isinstance(rows, list):
        print(json.dumps(data, indent=2)[:4000])
        return 0

    out = []
    for w in rows:
        if not isinstance(w, dict):
            continue
        nodes = w.get("nodes") or []
        triggers = []
        for n in nodes:
            t = n.get("type") or ""
            if "trigger" in t.lower() or "webhook" in t.lower():
                triggers.append(t)
        out.append(
            {
                "id": w.get("id"),
                "name": w.get("name"),
                "active": w.get("active"),
                "trigger_types": triggers[:12],
            }
        )

    if os.environ.get("OUTPUT", "json") == "tsv":
        print("id\tname\tactive\ttriggers")
        for r in out:
            print(f"{r['id']}\t{r['name']}\t{r['active']}\t{','.join(r['trigger_types'])}")
    else:
        print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
