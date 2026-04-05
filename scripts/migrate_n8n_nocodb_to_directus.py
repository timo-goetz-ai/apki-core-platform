#!/usr/bin/env python3
from __future__ import annotations

"""
migrate_n8n_nocodb_to_directus.py

Migrates n8n workflow JSON files from NocoDB API calls to Directus API calls.

Transformations:
  1. URLs: NocoDB table endpoints -> Directus /items/{collection} endpoints
  2. Auth: xc-token headers -> Authorization: Bearer with DIRECTUS_TOKEN
  3. Query params: NocoDB where=(field,op,value) -> Directus filter[field][_op]=value
  4. Response mapping: flags .list references that need manual change to .data

Usage:
  python scripts/migrate_n8n_nocodb_to_directus.py                  # dry-run (default)
  python scripts/migrate_n8n_nocodb_to_directus.py --apply          # write changes
  python scripts/migrate_n8n_nocodb_to_directus.py --report-only    # report without changes
"""

import argparse
import copy
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Table ID -> Directus collection mapping
# ---------------------------------------------------------------------------

TABLE_MAP: dict[str, str] = {
    # Known mappings from CLAUDE.md
    "m91y1ifz2aop1ef": "300_trends",
    "moigzpvd4yw1d0a": "310_sentiment",
    "m7ehbmbi5t2w0dw": "320_content_opportunities",
    "m48nvpornrxuba9": "400_content_pipeline",
    "mnwlsxsm0q1k2d2": "100_workflows",
    "mijlvsujsgqa92m": "200_prompts",
    "m2u6y7ibyxt9tzp": "420_media_assets",
    "mpe25xaikbpr0wj": "440_publish_log",
    "mxfirejid6z3h5g": "500_clients",
    "mrt4iah96z7za7t": "510_tasks",
    "m6e0i80gmudaerl": "520_mobile_ingest",
    "mjdp54ldeoxlb8s": "110_agents",
    "m6kwm1cedzeou6w": "120_subagents",
    "m0245soubmzha5r": "130_agent_runs",
    "mcn1qpaapk5x849": "210_rules",
    "mdkwfxgjg80tgjd": "220_skills",
    "mgnxselg5bkglr8": "230_hooks",
    "m128afvs767oxqa": "240_mcp_configs",
    "mbt77n1toqpa094": "250_plugins",
    "mzzgzfzgatrauwy": "260_cursor_configs",
    "m9hgs3y3iz9xtgl": "330_knowledge_items",
    "mzed73lf80jgygt": "340_regulatory",
    "m1dtcwceeejaupb": "350_tools",
    "mvbndkze3r4yce5": "360_social_proof",
    "mlmvyh28wyf9zxu": "410_templates",
    "me37a6o966k1dnr": "430_brand_identity",
    # Additional IDs found in workflows with best-guess mapping
    "m5abfrtfyr2j912": "320_content_opportunities",  # detailed/alt table
    "mrdi13quucpnps4": "300_trends",                  # research output (v1 API)
    "mgeh1epw96tgx3u": "audit_log",                   # audit log (may need creation in Directus)
    "mgjsuwl4jwlyhdc": "400_content_pipeline",         # pipeline jobs
    "mm1ssn0luruhzyx": "330_knowledge_items",           # knowledge/insights alt
    "mvb46y3ncw21m1g": "310_sentiment",                 # sentiment alt
    # Resolved from workflow context (2026-04-05)
    "mjq8palk78za2sz": "510_tasks",                     # coder-agent task status
    "msxl4hvogh62u4u": "420_media_assets",              # pixart/fish-audio media assets
    "mg4p0eux8onz3nq": "400_content_pipeline",          # batch jobs
    "mvozxyyz21oaz3z": "130_agent_runs",                # job monitor logs
}

# Table IDs that are UNMAPPED / uncertain -- flagged for manual review
UNMAPPED_TABLE_IDS: dict[str, str] = {
    # All resolved as of 2026-04-05
}

DIRECTUS_BASE = "https://directus.automation-plus-ki.de"

# NocoDB URL patterns to match
NOCODB_URL_PATTERNS = [
    # v2: https://nocodb.../api/v2/tables/{id}/records[/...]
    re.compile(
        r'https?://(?:nocodb\.automation-plus-ki\.de|homestack-nocodb:8080)'
        r'/api/v2/tables/([a-z0-9]+)/records(/[^"?]*)?(\?[^"]*)?'
    ),
    # v1: https://nocodb.../api/v1/db/data/noco/{baseId}/{tableId}[/...]
    re.compile(
        r'https?://(?:nocodb\.automation-plus-ki\.de|homestack-nocodb:8080)'
        r'/api/v1/db/data/noco/[a-z0-9]+/([a-z0-9]+)(/[^"?]*)?(\?[^"]*)?'
    ),
]

# Hostnames that indicate NocoDB
NOCODB_HOSTS = [
    "nocodb.automation-plus-ki.de",
    "homestack-nocodb:8080",
    "homestack-nocodb",
]

# Directus auth token expression (n8n variable reference)
DIRECTUS_AUTH_HEADER = "Bearer ={{ $vars.DIRECTUS_TOKEN }}"

# ---------------------------------------------------------------------------
# Scan paths
# ---------------------------------------------------------------------------

SCAN_DIRS = [
    "automations/n8n-workflows",
    "agents/coder-agent",
    "services/admin-dashboard/docs",
    "infrastructure/n8n/workflows",
    "automations/n8n-workflows/scheduled-jobs",
]


# ---------------------------------------------------------------------------
# NocoDB where-clause to Directus filter conversion
# ---------------------------------------------------------------------------

NOCODB_OP_MAP = {
    "eq": "_eq",
    "neq": "_neq",
    "gt": "_gt",
    "ge": "_gte",
    "lt": "_lt",
    "le": "_lte",
    "like": "_contains",
    "nlike": "_ncontains",
    "is": "_eq",
    "isnot": "_neq",
    "in": "_in",
    "notin": "_nin",
    "null": "_null",
    "notnull": "_nnull",
}


def convert_nocodb_where(where_str: str) -> str:
    """Convert NocoDB where=(field,op,value) to Directus filter[field][_op]=value.

    Handles simple single-condition where clauses. Complex AND/OR clauses
    are flagged for manual review.
    """
    # Strip outer parens if present
    s = where_str.strip()
    if s.startswith("(") and s.endswith(")"):
        s = s[1:-1]

    # Check for compound conditions (~ means OR, AND in NocoDB)
    if "~" in s or ")(" in where_str:
        return None  # too complex, flag for manual

    parts = s.split(",", 2)
    if len(parts) != 3:
        return None

    field, op, value = parts[0].strip(), parts[1].strip(), parts[2].strip()
    directus_op = NOCODB_OP_MAP.get(op)
    if not directus_op:
        return None

    return f"filter[{field}][{directus_op}]={value}"


def convert_url_query_params(query_string: str) -> tuple[str, list[str]]:
    """Convert NocoDB query params in a URL to Directus equivalents.

    Returns (new_query_string, list_of_manual_flags).
    """
    if not query_string:
        return ("", [])

    # Parse params
    params = []
    manual_flags = []
    for part in query_string.lstrip("?").split("&"):
        if "=" not in part:
            params.append(part)
            continue
        key, value = part.split("=", 1)

        if key == "where":
            converted = convert_nocodb_where(value)
            if converted:
                params.append(converted)
            else:
                manual_flags.append(f"Complex where clause: {value}")
                params.append(f"where={value}")  # keep as-is, flagged
        elif key == "fields":
            # NocoDB fields=a,b -> Directus fields=a,b (same syntax)
            params.append(f"fields={value}")
        elif key in ("sort", "limit", "offset"):
            # Same syntax in Directus
            params.append(f"{key}={value}")
        else:
            params.append(f"{key}={value}")

    result = "?" + "&".join(params) if params else ""
    return (result, manual_flags)


# ---------------------------------------------------------------------------
# Core transformation logic
# ---------------------------------------------------------------------------

class MigrationReport:
    def __init__(self):
        self.files_scanned = 0
        self.files_with_changes = 0
        self.url_transforms = []        # (file, node_name, old_url, new_url)
        self.header_transforms = []     # (file, node_name, description)
        self.list_references = []       # (file, node_name, context) - need manual .list -> .data
        self.unmapped_tables = []       # (file, node_name, table_id, description)
        self.query_transforms = []      # (file, node_name, old_query, new_query)
        self.manual_review = []         # (file, node_name, reason)
        self.errors = []                # (file, error_msg)

    def print_report(self):
        print("\n" + "=" * 80)
        print("  n8n NocoDB -> Directus Migration Report")
        print("=" * 80)

        print(f"\n  Files scanned:      {self.files_scanned}")
        print(f"  Files with changes: {self.files_with_changes}")
        print(f"  URL transforms:     {len(self.url_transforms)}")
        print(f"  Header transforms:  {len(self.header_transforms)}")
        print(f"  Query transforms:   {len(self.query_transforms)}")

        if self.url_transforms:
            print("\n--- URL Transforms ---")
            for file, node, old, new in self.url_transforms:
                rel = os.path.basename(file)
                print(f"  [{rel}] {node}")
                print(f"    - {old}")
                print(f"    + {new}")

        if self.header_transforms:
            print("\n--- Header Transforms ---")
            for file, node, desc in self.header_transforms:
                rel = os.path.basename(file)
                print(f"  [{rel}] {node}: {desc}")

        if self.query_transforms:
            print("\n--- Query Param Transforms ---")
            for file, node, old, new in self.query_transforms:
                rel = os.path.basename(file)
                print(f"  [{rel}] {node}")
                print(f"    - {old}")
                print(f"    + {new}")

        # Warnings section
        has_warnings = (self.list_references or self.unmapped_tables
                        or self.manual_review or self.errors)
        if has_warnings:
            print("\n" + "=" * 80)
            print("  MANUAL REVIEW REQUIRED")
            print("=" * 80)

        if self.unmapped_tables:
            print("\n--- Unmapped Table IDs (need manual mapping) ---")
            for file, node, tid, desc in self.unmapped_tables:
                rel = os.path.basename(file)
                print(f"  [{rel}] {node}: table={tid}")
                print(f"    {desc}")

        if self.list_references:
            print("\n--- .list References (change to .data for Directus) ---")
            for file, node, ctx in self.list_references:
                rel = os.path.basename(file)
                print(f"  [{rel}] {node}")
                print(f"    Context: ...{ctx}...")

        if self.manual_review:
            print("\n--- Other Manual Review Items ---")
            for file, node, reason in self.manual_review:
                rel = os.path.basename(file)
                print(f"  [{rel}] {node}: {reason}")

        if self.errors:
            print("\n--- Errors ---")
            for file, msg in self.errors:
                rel = os.path.basename(file)
                print(f"  [{rel}] {msg}")

        print("\n" + "=" * 80)
        print()


def transform_url(url: str, file_path: str, node_name: str, report: MigrationReport) -> str | None:
    """Transform a NocoDB URL to Directus. Returns new URL or None if no match."""
    for pattern in NOCODB_URL_PATTERNS:
        m = pattern.search(url)
        if not m:
            continue

        table_id = m.group(1)
        suffix = m.group(2) or ""      # e.g. /{{$json.id}} for single-record ops
        query_str = m.group(3) or ""    # e.g. ?where=...&limit=5

        # Check if table is mapped
        collection = TABLE_MAP.get(table_id)
        if not collection:
            desc = UNMAPPED_TABLE_IDS.get(table_id, "UNKNOWN - not in any mapping")
            report.unmapped_tables.append((file_path, node_name, table_id, desc))
            # Still transform the URL structure but use a placeholder
            collection = f"__UNMAPPED_{table_id}__"

        # Build Directus URL
        new_url = f"{DIRECTUS_BASE}/items/{collection}{suffix}"

        # Convert query params
        if query_str:
            new_query, manual_flags = convert_url_query_params(query_str)
            if manual_flags:
                for flag in manual_flags:
                    report.manual_review.append((file_path, node_name, flag))
            new_url += new_query

        report.url_transforms.append((file_path, node_name, url, new_url))
        return new_url

    return None


def is_nocodb_url(url: str) -> bool:
    """Check if a URL string references NocoDB."""
    for host in NOCODB_HOSTS:
        if host in url:
            return True
    return False


def transform_node(node: dict, file_path: str, report: MigrationReport) -> bool:
    """Transform a single n8n node. Returns True if any changes were made."""
    changed = False
    node_name = node.get("name", "unnamed")
    params = node.get("parameters", {})

    # 1. Transform URL
    url = params.get("url", "")
    if isinstance(url, str) and is_nocodb_url(url):
        new_url = transform_url(url, file_path, node_name, report)
        if new_url:
            params["url"] = new_url
            changed = True

    # 2. Transform headers: remove xc-token, add Authorization: Bearer
    if params.get("sendHeaders"):
        header_params = params.get("headerParameters", {}).get("parameters", [])
        new_headers = []
        had_xc_token = False

        for h in header_params:
            if isinstance(h, dict) and h.get("name", "").lower() == "xc-token":
                had_xc_token = True
                continue  # drop xc-token
            new_headers.append(h)

        if had_xc_token:
            # Add Directus auth header
            new_headers.append({
                "name": "Authorization",
                "value": DIRECTUS_AUTH_HEADER,
            })
            params["headerParameters"]["parameters"] = new_headers
            report.header_transforms.append(
                (file_path, node_name, "Replaced xc-token with Authorization: Bearer DIRECTUS_TOKEN")
            )
            changed = True

    # Also check for authentication field (some nodes use credentials instead)
    auth = params.get("authentication")
    if auth and "nocodb" in str(auth).lower():
        report.manual_review.append(
            (file_path, node_name, f"Node uses NocoDB credential auth: {auth}")
        )

    # 3. Check for query parameters with NocoDB where syntax
    if params.get("sendQuery"):
        query_params = params.get("queryParameters", {}).get("parameters", [])
        for i, qp in enumerate(query_params):
            if isinstance(qp, dict) and qp.get("name") == "where":
                old_val = qp.get("value", "")
                converted = convert_nocodb_where(old_val)
                if converted:
                    # Replace the where param with Directus filter
                    key, val = converted.split("=", 1)
                    query_params[i] = {"name": key, "value": val}
                    report.query_transforms.append(
                        (file_path, node_name, f"where={old_val}", converted)
                    )
                    changed = True
                else:
                    report.manual_review.append(
                        (file_path, node_name, f"Complex where clause needs manual conversion: {old_val}")
                    )

    return changed


def scan_for_list_references(workflow: dict, file_path: str, report: MigrationReport):
    """Scan all nodes for .list references that need to become .data for Directus."""
    text = json.dumps(workflow)

    # Find .list in expression contexts (typical n8n patterns)
    # Patterns: $json.list, .list[0], $('Node').item.json.list, etc.
    for m in re.finditer(r'["\s]([^"]{0,60}\.list[^"]{0,40})', text):
        context = m.group(1).strip()
        # Skip false positives (e.g. "playlist", "blacklist", "list_of")
        if re.search(r'(?:play|black|white|check|drop|mail|wait|to)list', context, re.I):
            continue
        if ".list_" in context or "_list" in context:
            continue

        # Find which node this belongs to
        # Approximate: find the nearest "name" key before this position
        pos = m.start()
        name_pattern = re.compile(r'"name"\s*:\s*"([^"]+)"')
        node_name = "unknown"
        for nm in name_pattern.finditer(text[:pos]):
            node_name = nm.group(1)

        report.list_references.append((file_path, node_name, context[:80]))


def process_file(file_path: str, report: MigrationReport, apply: bool) -> dict | None:
    """Process a single workflow JSON file. Returns modified data if changes were made."""
    report.files_scanned += 1

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        report.errors.append((file_path, str(e)))
        return None

    # Must have nodes array (n8n workflow format)
    nodes = data.get("nodes")
    if not isinstance(nodes, list):
        return None

    original = json.dumps(data)
    any_changed = False

    for node in nodes:
        if not isinstance(node, dict):
            continue
        node_type = node.get("type", "")

        # Only process HTTP Request nodes and NocoDB-specific node types
        if "httpRequest" in node_type or "nocodb" in node_type.lower():
            if transform_node(node, file_path, report):
                any_changed = True

    # Scan for .list references (all node types, including Code/Set/Function)
    scan_for_list_references(data, file_path, report)

    if any_changed:
        report.files_with_changes += 1

        if apply:
            # Write back with same formatting
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")
            print(f"  WRITTEN: {file_path}")
        else:
            print(f"  WOULD WRITE: {file_path}")

        return data

    return None


def find_workflow_files(repo_root: str) -> list[str]:
    """Find all n8n workflow JSON files in the configured scan paths."""
    files = []
    for scan_dir in SCAN_DIRS:
        full_dir = os.path.join(repo_root, scan_dir)
        if not os.path.isdir(full_dir):
            continue
        for root, _dirs, filenames in os.walk(full_dir):
            for fname in filenames:
                if fname.endswith(".json"):
                    fpath = os.path.join(root, fname)
                    files.append(fpath)

    # Also add specific known files outside scan dirs
    extra_files = [
        os.path.join(repo_root, "agents/coder-agent/n8n_workflow.json"),
    ]
    for ef in extra_files:
        if os.path.isfile(ef):
            files.append(ef)

    return sorted(set(files))


def main():
    parser = argparse.ArgumentParser(
        description="Migrate n8n workflow JSONs from NocoDB to Directus"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually write changes to files (default: dry-run)",
    )
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="Only produce a report, don't show per-file diffs",
    )
    parser.add_argument(
        "--repo-root",
        default=None,
        help="Root of the aios repository (auto-detected if not set)",
    )
    args = parser.parse_args()

    # Auto-detect repo root
    if args.repo_root:
        repo_root = args.repo_root
    else:
        # Walk up from script location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        repo_root = os.path.dirname(script_dir)  # scripts/ -> repo root

    if not os.path.isdir(os.path.join(repo_root, "automations")):
        print(f"ERROR: Cannot find automations/ in repo root: {repo_root}")
        print("  Use --repo-root to specify the correct path.")
        sys.exit(1)

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"\n  Mode: {mode}")
    print(f"  Repo: {repo_root}")

    files = find_workflow_files(repo_root)
    print(f"  Found {len(files)} JSON files to scan\n")

    report = MigrationReport()

    for fpath in files:
        process_file(fpath, report, apply=args.apply)

    report.print_report()

    # Summary exit code
    if report.unmapped_tables or report.list_references or report.manual_review:
        print("  [!] Items require manual review. See report above.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
