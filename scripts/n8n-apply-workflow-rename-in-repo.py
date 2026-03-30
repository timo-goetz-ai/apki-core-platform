#!/usr/bin/env python3
"""
Einmalige Migration: Original-Workflow-IDs → Phasen-Präfix (siehe docs/operations/N8N_WORKFLOW_RENAME_MAP.md).

- Ersetzt in Textdateien nur ganze Tokens (Wortgrenze vor führender Ziffer).
- Überspringt diese Datei und die Rename-Map (keine Selbstkorruption).
- JSON unter automations/n8n-workflows: setzt top-level \"name\" = Dateiname ohne .json (idempotent).

Dry-Run: DRY_RUN=1 python3 scripts/n8n-apply-workflow-rename-in-repo.py
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SELF = Path(__file__).resolve()
MAPFILE = ROOT / "docs" / "operations" / "N8N_WORKFLOW_RENAME_MAP.md"

# (alt, neu) — längere alte Strings zuerst (spezifischer)
PAIRS: list[tuple[str, str]] = [
    ("450_CONTENT_MASTER_FLOW_v2", "40_450_CONTENT_MASTER_FLOW_v2"),
    ("435_WEEKLY_SUMMARY", "40_435_WEEKLY_SUMMARY"),
    ("430_DAILY_DIGEST", "40_430_DAILY_DIGEST"),
    ("330_CONTENT_OPPORTUNITY", "30_330_CONTENT_OPPORTUNITY"),
    ("320_SENTIMENT_TRACKER", "30_320_SENTIMENT_TRACKER"),
    ("310_TREND_MONITOR", "30_310_TREND_MONITOR"),
    ("550_JARVIS_APPROVAL_FLOW", "50_550_JARVIS_APPROVAL_FLOW"),
    ("360_DEEP_INSIGHTS", "30_360_DEEP_INSIGHTS"),
    ("350_CONTENT_FORECAST", "30_350_CONTENT_FORECAST"),
    ("340_NICHE_RESEARCH", "30_340_NICHE_RESEARCH"),
    ("240_AIOS_DISCOVERY", "20_240_AIOS_DISCOVERY"),
    ("543_RESEARCH_DATA", "50_543_RESEARCH_DATA"),
    ("542_STATUS_REPORT", "50_542_STATUS_REPORT"),
    ("541_WORKFLOW_CONTROL", "50_541_WORKFLOW_CONTROL"),
    ("540_TELEGRAM_ASSISTANT", "50_540_TELEGRAM_ASSISTANT"),
    ("480_BATCH_TRIGGER", "40_480_BATCH_TRIGGER"),
    ("460_GDRIVE_SYNC", "40_460_GDRIVE_SYNC"),
    ("420_FISH_AUDIO", "40_420_FISH_AUDIO"),
    ("410_PIXART_IMAGE", "40_410_PIXART_IMAGE"),
    ("551_JARVIS_CALLBACK", "50_551_JARVIS_CALLBACK"),
    ("560_JOB_MONITOR", "50_560_JOB_MONITOR"),
    ("50_NOCODB_BACKUP", "10_50_NOCODB_BACKUP"),
    ("41_PUBLISH_BLOG", "40_41_PUBLISH_BLOG"),
    ("40_PUBLISH_SOCIAL", "40_40_PUBLISH_SOCIAL"),
    ("32_CONTENT_VOICE", "40_32_CONTENT_VOICE"),
    ("30_CONTENT_IMAGE", "40_30_CONTENT_IMAGE"),
]

SKIP_DIR = {".git", "node_modules", ".next", "dist", "build", ".ruff_cache", "__pycache__"}

TEXT_EXT = {
    ".md",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".yml",
    ".yaml",
    ".json",
    ".toml",
    ".sh",
    ".sql",
}


def should_skip_dir(name: str) -> bool:
    return name in SKIP_DIR


def token_pattern(old: str) -> re.Pattern[str]:
    # Wortgrenze vor erster Ziffer des Tokens, damit 30_310_* nicht erneut 310_* trifft
    return re.compile(r"(?<!\w)" + re.escape(old) + r"(?!\w)")


def apply_pairs(content: str) -> tuple[str, int]:
    n = 0
    for old, new in PAIRS:
        pat = token_pattern(old)
        c = len(pat.findall(content))
        if c:
            content = pat.sub(new, content)
            n += c
    return content, n


def main() -> int:
    dry = os.environ.get("DRY_RUN", "").strip().lower() in ("1", "true", "yes")
    total = 0

    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if not should_skip_dir(d)]
        for fn in filenames:
            path = Path(dirpath) / fn
            if path.resolve() in (SELF.resolve(), MAPFILE.resolve()):
                continue
            if path.suffix.lower() not in TEXT_EXT and path.name not in ("Dockerfile", "CLAUDE.md"):
                continue
            rel = path.relative_to(ROOT)
            if str(rel).startswith("automations/n8n-workflows/") and fn.endswith(".json"):
                continue  # Namen kommen aus Dateiname (separater Lauf)

            try:
                text = path.read_text(encoding="utf-8")
            except OSError:
                continue
            new_text, subs = apply_pairs(text)
            if subs and new_text != text:
                total += subs
                if dry:
                    print(f"[dry] {subs} -> {rel}")
                else:
                    path.write_text(new_text, encoding="utf-8")
                    print(f"wrote {rel} ({subs} replacements)")

    n8n = ROOT / "automations" / "n8n-workflows"
    if n8n.is_dir():
        for p in n8n.rglob("*.json"):
            if p.name == "file-sort-webhook.json":
                continue
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                print("skip invalid json", p)
                continue
            if not isinstance(data, dict) or "name" not in data:
                continue
            stem = p.stem
            if data.get("name") == stem:
                continue
            if dry:
                print(f"[dry] JSON name {p.name}: -> {stem}")
            else:
                data["name"] = stem
                p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
                print(f"sync JSON name {p.name} -> {stem}")

    print("done." + (f" token replacements: {total}" if total else " (no text changes)") + (" [DRY_RUN]" if dry else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
