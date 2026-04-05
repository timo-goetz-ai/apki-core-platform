#!/usr/bin/env python3
"""
Import updated n8n workflow JSON files (Directus migration) into live n8n instance.

Reads local repo JSON files, maps them to live n8n workflow IDs by fuzzy name matching,
and PUTs the updated nodes/connections/settings via SSH -> curl to the n8n API.
"""

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

# --- Configuration ---
SSH_HOST = "root@46.224.145.109"
N8N_API_BASE = "http://10.0.11.5:5678/api/v1"
N8N_API_KEY = "n8n_api_4ed4f888ccff51c643056ab462f87b5d905546ffbab01bec"
REPO_ROOT = Path(__file__).resolve().parent.parent

# Live n8n workflows: id -> name
LIVE_WORKFLOWS = {
    "fEYWN4pWhRcG2tLg": "30_TREND_MONITOR",
    "I6LcxlyMM8TU7A7V": "31_CONTENT_OPPORTUNITY",
    "Vx1Aea5glbogJxg6": "320_SENTIMENT_TRACKER",
    "lAu959jDE7Y7HkH1": "300_NISCHEN_SCANNER",
    "4jCqinBKiFKJmdor": "40_CONTENT_PIPELINE",
    "OrnQY2MvsHEvxkKq": "44_FISH_AUDIO_TTS",
    "xptdJvE2eiTNTtK0": "42_MULTI_HOOK_GENERATOR",
    "01c513e059034263": "43_TEMPLATE_ENGINE",
    "xxBJQVAd3CSB8ytc": "61_WEEKLY_SUMMARY",
    "pi9udl8hSY0Lo94q": "450_CONTENT_MASTER_FLOW",
    "s9QO3zVWQQCdeWIY": "530_STATUS_REPORT",
    "r9SjBZvHXrxK2xA2": "560_RESEARCH_DATA",
    "zb9g2zj7SKptuBRq": "60_DAILY_DIGEST",
}

# Repo JSON files to import (relative to REPO_ROOT)
REPO_FILES = [
    "automations/n8n-workflows/research/30_310_TREND_MONITOR.json",
    "automations/n8n-workflows/research/30_340_NICHE_RESEARCH.json",
    "automations/n8n-workflows/research/30_350_CONTENT_FORECAST.json",
    "automations/n8n-workflows/research/30_360_DEEP_INSIGHTS.json",
    "automations/n8n-workflows/content-pipeline/40_450_CONTENT_MASTER_FLOW_v2.json",
    "automations/n8n-workflows/content-pipeline/40_30_CONTENT_IMAGE.json",
    "automations/n8n-workflows/content-pipeline/40_32_CONTENT_VOICE.json",
    "automations/n8n-workflows/content-pipeline/40_40_PUBLISH_SOCIAL.json",
    "automations/n8n-workflows/content-pipeline/40_41_PUBLISH_BLOG.json",
    "automations/n8n-workflows/content-pipeline/40_410_PIXART_IMAGE.json",
    "automations/n8n-workflows/content-pipeline/40_420_FISH_AUDIO.json",
    "automations/n8n-workflows/content-pipeline/40_435_WEEKLY_SUMMARY.json",
    "automations/n8n-workflows/content-pipeline/40_460_GDRIVE_SYNC.json",
    "automations/n8n-workflows/content-pipeline/40_480_BATCH_TRIGGER.json",
    "automations/n8n-workflows/telegram/50_542_STATUS_REPORT.json",
    "automations/n8n-workflows/telegram/50_543_RESEARCH_DATA.json",
    "automations/n8n-workflows/job-monitor/50_560_JOB_MONITOR.json",
    "automations/n8n-workflows/scheduled-jobs/10_50_NOCODB_BACKUP.json",
]


def normalize_name(name: str) -> str:
    """
    Normalize workflow name for fuzzy matching.
    Strips layer prefix numbers and middle detail numbers to get the core name.
    Examples:
        30_310_TREND_MONITOR      -> TREND_MONITOR
        40_450_CONTENT_MASTER_FLOW_v2 -> CONTENT_MASTER_FLOW
        50_542_STATUS_REPORT      -> STATUS_REPORT
        30_TREND_MONITOR          -> TREND_MONITOR
        320_SENTIMENT_TRACKER     -> SENTIMENT_TRACKER
        44_FISH_AUDIO_TTS         -> FISH_AUDIO
        61_WEEKLY_SUMMARY         -> WEEKLY_SUMMARY
        40_420_FISH_AUDIO         -> FISH_AUDIO
        530_STATUS_REPORT         -> STATUS_REPORT
        560_RESEARCH_DATA         -> RESEARCH_DATA
    """
    # Remove _v2, _v3 etc. suffixes
    name = re.sub(r'_v\d+$', '', name)
    # Remove leading number groups: e.g. "30_310_" or "40_" or "320_"
    # Strategy: strip all leading numeric_underscore segments
    parts = name.split('_')
    # Drop leading parts that are purely numeric
    while parts and parts[0].isdigit():
        parts.pop(0)
    return '_'.join(parts).upper()


def build_name_to_id_map() -> dict:
    """Build normalized_name -> workflow_id map from live workflows."""
    mapping = {}
    for wf_id, wf_name in LIVE_WORKFLOWS.items():
        normalized = normalize_name(wf_name)
        mapping[normalized] = (wf_id, wf_name)
    return mapping


def find_match(repo_name: str, live_map: dict) -> tuple:
    """
    Find the matching live workflow for a repo workflow name.
    Returns (workflow_id, live_name) or (None, None).
    """
    norm = normalize_name(repo_name)
    if norm in live_map:
        return live_map[norm]

    # Try partial matching: check if any live normalized name is contained in repo normalized name or vice versa
    for live_norm, (wf_id, wf_name) in live_map.items():
        if live_norm in norm or norm in live_norm:
            return (wf_id, wf_name)

    return (None, None)


def ssh_curl_put(workflow_id: str, payload_json: str) -> tuple:
    """
    PUT workflow update via SSH -> curl.
    Writes payload to a temp file, SCPs it to the server, then curls from there.
    Returns (success: bool, response_text: str).
    """
    # Write payload to a temp file locally
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        f.write(payload_json)
        tmp_path = f.name

    remote_tmp = f"/tmp/n8n_wf_{workflow_id}.json"
    try:
        # SCP the file to the server
        scp_cmd = ["scp", "-o", "StrictHostKeyChecking=no", tmp_path, f"{SSH_HOST}:{remote_tmp}"]
        result = subprocess.run(scp_cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return False, f"SCP failed: {result.stderr}"

        # Execute curl on the remote server
        curl_cmd = (
            f"curl -s -w '\\n%{{http_code}}' -X PUT "
            f"'{N8N_API_BASE}/workflows/{workflow_id}' "
            f"-H 'Content-Type: application/json' "
            f"-H 'X-N8N-API-KEY: {N8N_API_KEY}' "
            f"-d @{remote_tmp}"
        )
        ssh_cmd = ["ssh", "-o", "StrictHostKeyChecking=no", SSH_HOST, curl_cmd]
        result = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=60)

        if result.returncode != 0:
            return False, f"SSH/curl failed: {result.stderr}"

        # Parse response: last line is HTTP status code
        lines = result.stdout.strip().rsplit('\n', 1)
        if len(lines) == 2:
            body, status_code = lines
        else:
            body = result.stdout.strip()
            status_code = "???"

        if status_code.strip() == "200":
            return True, f"HTTP {status_code}"
        else:
            # Try to extract error message
            try:
                err = json.loads(body)
                msg = err.get("message", body[:200])
            except Exception:
                msg = body[:300]
            return False, f"HTTP {status_code}: {msg}"

    finally:
        os.unlink(tmp_path)
        # Clean up remote temp file
        subprocess.run(
            ["ssh", "-o", "StrictHostKeyChecking=no", SSH_HOST, f"rm -f {remote_tmp}"],
            capture_output=True, timeout=10
        )


def main():
    live_map = build_name_to_id_map()

    print("=" * 70)
    print("n8n Workflow Import — Directus Migration")
    print("=" * 70)
    print()

    # Debug: show normalized live names
    print("Live workflow name mapping:")
    for norm, (wf_id, wf_name) in sorted(live_map.items()):
        print(f"  {wf_name:35s} -> {norm:30s} [{wf_id}]")
    print()

    results = {"updated": [], "no_match": [], "failed": []}

    for repo_file in REPO_FILES:
        full_path = REPO_ROOT / repo_file
        filename = Path(repo_file).stem  # e.g. 30_310_TREND_MONITOR

        if not full_path.exists():
            print(f"[SKIP] File not found: {repo_file}")
            results["failed"].append((filename, "File not found"))
            continue

        # Load repo JSON
        with open(full_path, 'r') as f:
            repo_data = json.load(f)

        repo_name = repo_data.get("name", filename)

        # Find matching live workflow
        wf_id, live_name = find_match(repo_name, live_map)

        if not wf_id:
            print(f"[NO MATCH] {filename} (normalized: {normalize_name(repo_name)}) — no live workflow found")
            results["no_match"].append(filename)
            continue

        print(f"[MATCH] {filename} -> {live_name} [{wf_id}]")

        # Build PUT payload: name is required by the API, use the live workflow name
        payload = {"name": live_name}
        if "nodes" in repo_data:
            payload["nodes"] = repo_data["nodes"]
        if "connections" in repo_data:
            payload["connections"] = repo_data["connections"]
        if "settings" in repo_data:
            payload["settings"] = repo_data["settings"]

        if not payload.get("nodes"):
            print(f"  [SKIP] No nodes in repo JSON")
            results["failed"].append((filename, "No nodes in JSON"))
            continue

        payload_json = json.dumps(payload, ensure_ascii=False)
        node_count = len(payload.get("nodes", []))
        print(f"  Uploading {node_count} nodes, {len(payload.get('connections', {}))} connection groups...")

        success, msg = ssh_curl_put(wf_id, payload_json)
        if success:
            print(f"  [OK] {msg}")
            results["updated"].append((filename, live_name, wf_id, node_count))
        else:
            print(f"  [FAIL] {msg}")
            results["failed"].append((filename, msg))

    # --- Report ---
    print()
    print("=" * 70)
    print("REPORT")
    print("=" * 70)

    print(f"\nUpdated successfully: {len(results['updated'])}")
    for fname, lname, wid, nc in results["updated"]:
        print(f"  {fname:45s} -> {lname} ({nc} nodes)")

    print(f"\nNo matching live workflow: {len(results['no_match'])}")
    for fname in results["no_match"]:
        print(f"  {fname}")

    print(f"\nFailed: {len(results['failed'])}")
    for item in results["failed"]:
        if isinstance(item, tuple):
            print(f"  {item[0]:45s} — {item[1]}")
        else:
            print(f"  {item}")

    print()
    total = len(REPO_FILES)
    ok = len(results["updated"])
    print(f"Total: {total} | Updated: {ok} | No match: {len(results['no_match'])} | Failed: {len(results['failed'])}")

    return 0 if not results["failed"] else 1


if __name__ == "__main__":
    sys.exit(main())
