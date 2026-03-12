from __future__ import annotations

from pathlib import Path
from typing import Dict


def parse_kv_pairs(pairs: list[str]) -> Dict[str, str]:
    values: Dict[str, str] = {}
    for pair in pairs:
        if "=" not in pair:
            raise ValueError(f"Invalid --var value: {pair!r}. Expected key=value")
        key, val = pair.split("=", 1)
        key = key.strip()
        if not key:
            raise ValueError(f"Invalid --var key in value: {pair!r}")
        values[key] = val
    return values


def is_text_file(path: Path) -> bool:
    # Keep rendering simple and safe: skip binary-looking files.
    try:
        data = path.read_bytes()[:1024]
    except OSError:
        return False
    return b"\x00" not in data
