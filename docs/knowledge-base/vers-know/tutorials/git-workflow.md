---
title: "Git Workflow Tutorial"
version: "1.0.0"
tags: [git, workflow, branching, tutorial]
difficulty: beginner
last_updated: "2026-03-03"
---

# Git Workflow Tutorial

Schritt-für-Schritt Anleitung für einen professionellen Git-Workflow.

## Setup

```bash
# Globale Konfiguration
git config --global user.name "Dein Name"
git config --global user.email "deine@email.de"
git config --global core.editor "code --wait"
git config --global init.defaultBranch main
```

## Feature-Workflow

### 1. Aktuellen Stand holen

```bash
git checkout main
git pull origin main
```

### 2. Feature-Branch erstellen

```bash
git checkout -b feature/user-authentication
# oder
git switch -c feature/user-authentication
```

### 3. Änderungen committen

```bash
# Status überprüfen
git status

# Gezielt stagen (kein git add .)
git add src/auth/login.py
git add src/auth/models.py

# Commit mit aussagekräftiger Message
git commit -m "feat(auth): add JWT-based login endpoint"
```

### 4. Regelmäßig pushen

```bash
git push origin feature/user-authentication
```

### 5. Aktuell bleiben (Merge-Konflikte früh auflösen)

```bash
git fetch origin
git rebase origin/main
# oder
git merge origin/main
```

### 6. Pull Request öffnen

- PR-Titel klar und beschreibend
- Beschreibung: Was wurde geändert? Warum?
- Screenshots bei UI-Änderungen
- Code Review anfordern

### 7. Nach Merge: aufräumen

```bash
git checkout main
git pull origin main
git branch -d feature/user-authentication
```

## Wichtige Befehle

```bash
# Änderungen stashen (temporär beiseitelegen)
git stash
git stash pop

# Letzten Commit rückgängig (Änderungen behalten)
git reset HEAD~1

# Datei auf Stand des letzten Commits zurücksetzen
git checkout -- datei.py

# Branch-Übersicht
git branch -a

# Commit-Historie (kompakt)
git log --oneline --graph --decorate

# Unterschiede zwischen Branches
git diff main..feature/my-branch
```

## Commit Message Konvention

```
<type>(<scope>): <beschreibung>

[optionaler Body]

[optionaler Footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
