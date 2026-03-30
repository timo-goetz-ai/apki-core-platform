#!/usr/bin/env python3
"""
Liest alle op://-Referenzen aus .github/workflows/*.yml und prüft sie mit `op read`.
Keine Secret-Werte in stdout.

Exit 0: alle Referenzen lesbar.
Exit 1: mindestens eine Referenz fehlt oder op nicht angemeldet.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
PAT = re.compile(r"op://[^\s'\"]+")


def main() -> int:
    if not WORKFLOWS.is_dir():
        print("Kein .github/workflows", file=sys.stderr)
        return 1
    seen: set[str] = set()
    for yml in sorted(WORKFLOWS.glob("*.yml")):
        text = yml.read_text(encoding="utf-8", errors="replace")
        for m in PAT.findall(text):
            seen.add(m.rstrip(",);"))
    if not seen:
        print("Keine op://-Referenzen gefunden.")
        return 0
    bad = 0
    for uri in sorted(seen):
        r = subprocess.run(
            ["op", "read", uri],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if r.returncode != 0:
            bad += 1
            err = (r.stderr or r.stdout or "").strip().splitlines()
            hint = err[0] if err else "unknown"
            print(f"FEHLT {uri}\n      {hint[:200]}")
        else:
            print(f"OK    {uri}")
    print(f"\nGesamt: {len(seen)} Referenzen, {bad} fehlerhaft.")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
