---
title: "Clean Code Prinzipien"
version: "1.0.0"
tags: [clean-code, best-practices, readability, maintainability]
difficulty: beginner
last_updated: "2026-03-03"
---

# Clean Code Prinzipien

Grundlegende Prinzipien für gut lesbaren, wartbaren Code.

## Aussagekräftige Namen

```python
# ❌ Schlecht
def calc(a, b, t):
    return a + b * t

# ✅ Gut
def calculate_total_price(base_price: float, tax_rate: float, quantity: int) -> float:
    return base_price * quantity * (1 + tax_rate)
```

## Kleine, fokussierte Funktionen

```python
# ❌ Eine Funktion macht zu viel
def process_order(order):
    # Validierung
    if not order.items:
        raise ValueError("Order is empty")
    # Preisberechnung
    total = sum(item.price * item.qty for item in order.items)
    total *= 1.19  # MwSt
    # E-Mail versenden
    send_email(order.user.email, f"Total: {total}")
    # Datenbank speichern
    db.save(order)

# ✅ Aufgeteilt
def validate_order(order: Order) -> None:
    if not order.items:
        raise ValueError("Order is empty")

def calculate_order_total(order: Order) -> float:
    subtotal = sum(item.price * item.quantity for item in order.items)
    return subtotal * 1.19

def process_order(order: Order) -> None:
    validate_order(order)
    order.total = calculate_order_total(order)
    db.save(order)
    send_confirmation_email(order)
```

## DRY – Don't Repeat Yourself

```python
# ❌ Duplikation
def get_user_name(user_id):
    user = db.query(f"SELECT * FROM users WHERE id = {user_id}")
    return user["name"]

def get_user_email(user_id):
    user = db.query(f"SELECT * FROM users WHERE id = {user_id}")
    return user["email"]

# ✅ Extrahiert
def get_user(user_id: int) -> dict:
    return db.query("SELECT * FROM users WHERE id = ?", user_id)

def get_user_name(user_id: int) -> str:
    return get_user(user_id)["name"]

def get_user_email(user_id: int) -> str:
    return get_user(user_id)["email"]
```

## Kommentare sparsam einsetzen

```python
# ❌ Kommentar erklärt, WAS der Code tut (offensichtlich)
# Erhöhe i um 1
i += 1

# ✅ Kommentar erklärt WARUM
# Bypass rate limiter for internal health check endpoints
if request.path.startswith("/internal/"):
    return handler(request)
```

## SOLID-Prinzipien (Kurzübersicht)

| Prinzip | Bedeutung |
|---------|-----------|
| **S** – Single Responsibility | Eine Klasse hat einen Grund zur Änderung |
| **O** – Open/Closed | Offen für Erweiterung, geschlossen für Änderung |
| **L** – Liskov Substitution | Subklassen müssen Elternklassen ersetzen können |
| **I** – Interface Segregation | Kleine, spezifische Interfaces statt großer |
| **D** – Dependency Inversion | Abhängigkeiten von Abstraktionen, nicht Implementierungen |

## Boy Scout Rule

> Hinterlasse den Code immer ein bisschen besser, als du ihn vorgefunden hast.

- Variable umbenennen wenn Name unklar
- Langen Kommentar durch selbsterklärenden Code ersetzen
- Kleine Funktion extrahieren
- Test für ungetestete Logik hinzufügen
