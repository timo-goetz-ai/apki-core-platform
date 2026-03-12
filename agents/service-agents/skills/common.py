"""Gemeinsame Skills, die von mehreren Agenten genutzt werden."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any


def render_template(template_path: Path, variables: dict[str, Any]) -> str:
    """Füllt eine Markdown-Vorlage mit den angegebenen Variablen."""
    if not template_path.exists():
        raise FileNotFoundError(f"Vorlage nicht gefunden: {template_path}")

    content = template_path.read_text(encoding="utf-8")
    for key, value in variables.items():
        content = content.replace(f"{{{key}}}", str(value))
    return content


def classify_text(text: str, keyword_map: dict[str, list[str]]) -> str | None:
    """Klassifiziert einen Text anhand von Schlüsselwörtern.

    Gibt den ersten passenden Schlüssel zurück oder None, wenn kein Treffer.
    """
    lowered = text.lower()
    for category, keywords in keyword_map.items():
        if any(kw.lower() in lowered for kw in keywords):
            return category
    return None


def extract_amount(text: str) -> float | None:
    """Extrahiert einen Geldbetrag aus einem Text (z.B. '1.234,56 €' oder '500.00 EUR')."""
    pattern = r"(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:€|EUR|eur)"
    match = re.search(pattern, text)
    if not match:
        return None
    raw = match.group(1).replace(".", "").replace(",", ".")
    return float(raw)


def score_to_priority(score: float, high: float = 70.0, medium: float = 40.0) -> str:
    """Wandelt einen numerischen Score in eine Prioritätsstufe um."""
    if score >= high:
        return "hoch"
    if score >= medium:
        return "mittel"
    return "niedrig"
