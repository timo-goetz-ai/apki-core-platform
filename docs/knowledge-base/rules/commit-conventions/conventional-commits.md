---
title: "Conventional Commits"
version: "1.0.0"
tags: [git, commits, conventions, conventional-commits]
difficulty: beginner
last_updated: "2026-03-03"
---

# Conventional Commits

Standard für strukturierte, maschinell lesbare Commit Messages.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Verwendung |
|------|-----------|
| `feat` | Neues Feature |
| `fix` | Bug Fix |
| `docs` | Nur Dokumentationsänderungen |
| `style` | Formatierung, fehlende Semikolons, etc. (kein Logik-Change) |
| `refactor` | Weder Feature noch Bug Fix |
| `perf` | Performance-Verbesserung |
| `test` | Tests hinzufügen oder korrigieren |
| `chore` | Build-Prozess, Tools, Konfiguration |
| `ci` | CI/CD-Konfiguration |
| `revert` | Vorherigen Commit rückgängig machen |

## Beispiele

```bash
# Feature
git commit -m "feat(auth): add JWT refresh token endpoint"

# Bug Fix mit Scope
git commit -m "fix(api): handle null response from external service"

# Breaking Change (! oder BREAKING CHANGE im Footer)
git commit -m "feat(api)!: rename /users endpoint to /v2/users"

# Docs
git commit -m "docs: update README with Docker setup instructions"

# Mit Body für komplexere Changes
git commit -m "refactor(db): replace raw SQL with ORM queries

Replace all raw SQL strings with SQLAlchemy ORM queries for better
type safety and maintainability. No behavior changes.

Affects: users.py, posts.py, comments.py"

# Mit Ticket-Referenz
git commit -m "fix(checkout): prevent double-charge on payment retry

Closes #142"
```

## Scope-Konventionen (Beispiel)

```
auth      – Authentifizierung/Autorisierung
api       – API-Endpunkte
db        – Datenbankschicht
ui        – Frontend-Komponenten
config    – Konfigurationsdateien
deps      – Abhängigkeiten
tests     – Test-Setup
```

## Vorteile

- Automatisches Changelog generierbar (`standard-version`, `semantic-release`)
- Semantische Versionierung ableitbar (feat → Minor, fix → Patch, ! → Major)
- Einfaches Durchsuchen der Commit-Historie
- Klarheit über den Zweck jeder Änderung

## Tools

```bash
# Commitlint: prüft Commit Messages
npm install --save-dev @commitlint/config-conventional @commitlint/cli

# commitizen: interaktiver Commit-Wizard
npm install -g commitizen
git cz  # statt git commit
```
