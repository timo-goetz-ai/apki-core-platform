#!/usr/bin/env python3
"""
Listet Coolify-Deployments plus Kontext (Version, Applications-Kurzliste).

`/api/v1/deployments` kann leer sein (Scope/Token); dann liefert das Skript
trotzdem `version` und eine kompakte `applications_preview` (Status, SHA).

Env:
  COOLIFY_URL   z. B. https://coolify.automation-plus-ki.de
  COOLIFY_TOKEN Bearer (nicht committen)

Optional: COOLIFY_PER_PAGE (default 8), COOLIFY_APPS_PREVIEW (default 16)
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


def _get_json(base: str, token: str, path: str) -> object:
    url = f"{base}{path}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8").strip()
        if not raw:
            return {}
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"_plain": raw}


def main() -> int:
    for p in DEFAULT_ENV_PATHS:
        load_dotenv(p)

    base = os.environ.get("COOLIFY_URL", "").strip().rstrip("/")
    token = os.environ.get("COOLIFY_TOKEN", "").strip()
    n = int(os.environ.get("COOLIFY_PER_PAGE", "8"))
    apps_n = int(os.environ.get("COOLIFY_APPS_PREVIEW", "16"))

    if not base or not token:
        print(
            "COOLIFY_URL und COOLIFY_TOKEN erforderlich (z. B. in Shell exportieren).",
            file=sys.stderr,
        )
        return 1

    out: dict[str, object] = {}

    try:
        ver = _get_json(base, token, "/api/v1/version")
        if isinstance(ver, dict) and "_plain" in ver:
            out["coolify_version"] = ver["_plain"]
        elif isinstance(ver, str):
            out["coolify_version"] = ver
        elif isinstance(ver, dict) and "version" in ver:
            out["coolify_version"] = ver.get("version")
        else:
            out["coolify_version"] = ver

        dep = _get_json(base, token, f"/api/v1/deployments?per_page={n}")
        out["deployments"] = dep if isinstance(dep, list) else dep

        apps_raw = _get_json(base, token, f"/api/v1/applications?per_page={apps_n}")
        apps_list = apps_raw if isinstance(apps_raw, list) else []
        preview: list[dict[str, object]] = []
        for a in apps_list:
            if not isinstance(a, dict):
                continue
            preview.append(
                {
                    "name": a.get("name"),
                    "uuid": a.get("uuid"),
                    "status": a.get("status"),
                    "git_commit_sha": (a.get("git_commit_sha") or "")[:12] or None,
                    "last_online_at": a.get("last_online_at"),
                    "fqdn": a.get("fqdn"),
                }
            )
        out["applications_preview"] = preview
    except urllib.error.HTTPError as e:
        print(e.read().decode("utf-8", errors="replace")[:2000], file=sys.stderr)
        return e.code
    except Exception as e:
        print(f"Coolify API: {e}", file=sys.stderr)
        return 1

    text = json.dumps(out, indent=2, ensure_ascii=False)
    print(text[:20000])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
