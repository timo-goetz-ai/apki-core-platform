---
title: "Python Style Guide"
version: "1.0.0"
tags: [python, pep8, style, linting, ruff]
difficulty: beginner
last_updated: "2026-03-03"
---

# Python Style Guide

Coding-Standards für Python-Code basierend auf PEP 8.

## Grundregeln

- Einrückung: **4 Leerzeichen** (kein Tab)
- Maximale Zeilenlänge: **88 Zeichen** (Black/Ruff Standard)
- Encoding: **UTF-8**
- Eine Leerzeile am Dateiende

## Namenskonventionen

```python
# Variablen und Funktionen: snake_case
user_name = "Alice"
def calculate_total_price(): ...

# Klassen: PascalCase
class UserProfile: ...
class HTTPClient: ...

# Konstanten: UPPER_SNAKE_CASE
MAX_RETRY_COUNT = 3
DEFAULT_TIMEOUT = 30

# Private: führender Underscore
def _internal_helper(): ...
self._private_attr = value

# "Dunder" / Magic Methods
def __init__(self): ...
def __str__(self): ...
```

## Type Hints (ab Python 3.10+)

```python
from typing import Optional

# ✅ Moderne Syntax
def greet(name: str, times: int = 1) -> str:
    return f"Hello {name}! " * times

def find_user(user_id: int) -> dict | None:
    ...

def process(items: list[str]) -> dict[str, int]:
    ...
```

## Imports

```python
# Reihenfolge: stdlib → third-party → local
import os
import sys
from pathlib import Path

import requests
from fastapi import FastAPI

from myapp.models import User
from myapp.utils import format_date

# Keine Wildcard-Imports
from os import *  # ❌
```

## Docstrings

```python
def calculate_discount(price: float, discount_pct: float) -> float:
    """
    Berechnet den Preisnachlass.

    Args:
        price: Originalpreis in Euro.
        discount_pct: Nachlass in Prozent (0-100).

    Returns:
        Preis nach Abzug des Nachlasses.

    Raises:
        ValueError: Wenn discount_pct nicht zwischen 0 und 100 liegt.
    """
    if not 0 <= discount_pct <= 100:
        raise ValueError(f"discount_pct must be 0-100, got {discount_pct}")
    return price * (1 - discount_pct / 100)
```

## Linting mit Ruff

```toml
# pyproject.toml
[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "W", "I", "N", "UP"]
ignore = ["E501"]
```

```bash
# Prüfen
ruff check .

# Automatisch fixen
ruff check --fix .
```
