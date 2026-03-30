#!/usr/bin/env python3
"""
Listet letzte Coolify-Deployments (JSON) — für Beobachtung nach Git Push.

Env:
  COOLIFY_URL   z. B. https://coolify.automation-plus-ki.de
  COOLIFY_TOKEN Bearer (nicht committen)

Optional: COOLIFY_PER_PAGE (default 8)
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_ENV_PATHS = [
    Path(__file__).resolve().parents[1] / "services" / "admin-dashboard" / ".env.local",
]


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


def main() -> int:
    for p in DEFAULT_ENV_PATHS:
        load_dotenv(p)

    base = os.environ.get("COOLIFY_URL", "").strip().rstrip("/")
    token = os.environ.get("COOLIFY_TOKEN", "").strip()
    n = int(os.environ.get("COOLIFY_PER_PAGE", "8"))

    if not base or not token:
        print(
            "COOLIFY_URL und COOLIFY_TOKEN erforderlich (z. B. in Shell exportieren).",
            file=sys.stderr,
        )
        return 1

    url = f"{base}/api/v1/deployments?per_page={n}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        print(e.read().decode("utf-8", errors="replace")[:2000], file=sys.stderr)
        return e.code

    print(json.dumps(data, indent=2, ensure_ascii=False)[:12000])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
