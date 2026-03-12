---
title: "Architektur-Prinzipien"
version: "1.0.0"
tags: [architecture, principles, separation-of-concerns, layered]
difficulty: intermediate
last_updated: "2026-03-03"
---

# Architektur-Prinzipien

Grundlegende Architektur-Regeln für skalierbare, wartbare Anwendungen.

## Schichtenarchitektur (Layered Architecture)

```
┌──────────────────────────┐
│   Presentation Layer     │  → HTTP-Handler, CLI, WebSockets
│   (Controller/Router)    │
├──────────────────────────┤
│   Business Logic Layer   │  → Services, Use Cases, Domain Logic
│   (Service/Use Case)     │
├──────────────────────────┤
│   Data Access Layer      │  → Repositories, ORM, External APIs
│   (Repository/DAO)       │
├──────────────────────────┤
│   Database / External    │  → PostgreSQL, Redis, APIs
└──────────────────────────┘
```

**Regeln:**
- Jede Schicht kommuniziert nur mit der direkt darunter liegenden
- Business Logic kennt keine HTTP-Konzepte (Request/Response)
- Repositories kennen keine Business Logic

## Dependency Rule

```python
# ❌ Falsch: Business Logic kennt das Web-Framework
from fastapi import Request

class UserService:
    def create_user(self, request: Request):  # Web-Konzept in Service!
        data = request.json()
        ...

# ✅ Richtig: Service arbeitet mit DTOs/Primitives
from dataclasses import dataclass

@dataclass
class CreateUserInput:
    name: str
    email: str

class UserService:
    def create_user(self, input: CreateUserInput) -> User:
        ...
```

## Repository Pattern

```python
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    def find_by_id(self, user_id: int) -> User | None: ...

    @abstractmethod
    def save(self, user: User) -> User: ...

class PostgresUserRepository(UserRepository):
    def find_by_id(self, user_id: int) -> User | None:
        return db.query(User).filter(User.id == user_id).first()

    def save(self, user: User) -> User:
        db.add(user)
        db.commit()
        return user

# Testbar durch Austausch der Implementierung
class InMemoryUserRepository(UserRepository):
    def __init__(self):
        self._store: dict[int, User] = {}

    def find_by_id(self, user_id: int) -> User | None:
        return self._store.get(user_id)

    def save(self, user: User) -> User:
        self._store[user.id] = user
        return user
```

## Modularisierung

```
src/
├── users/
│   ├── router.py       # HTTP-Handler
│   ├── service.py      # Business Logic
│   ├── repository.py   # Datenbankzugriff
│   ├── models.py       # Domain-Entitäten
│   └── schemas.py      # Request/Response-DTOs
├── auth/
│   ├── router.py
│   ├── service.py
│   └── ...
└── shared/
    ├── database.py
    └── exceptions.py
```

**Ziel:** Feature-Ordner statt Layer-Ordner → Änderungen an einem Feature bleiben in einem Ordner.

## Grundsätze

- **Separation of Concerns** – Jedes Modul hat eine klare Aufgabe
- **High Cohesion** – Zusammengehöriges bleibt zusammen
- **Low Coupling** – Module sind lose gekoppelt, austauschbar
- **Testbarkeit** – Abhängigkeiten injizierbar (Dependency Injection)
