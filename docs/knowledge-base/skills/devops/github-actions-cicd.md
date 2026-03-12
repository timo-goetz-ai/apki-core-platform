---
title: "GitHub Actions CI/CD"
version: "1.0.0"
tags: [github-actions, ci-cd, devops, automation, yaml]
difficulty: intermediate
last_updated: "2026-03-03"
---

# GitHub Actions CI/CD

GitHub Actions ermöglicht automatisierte Workflows direkt im GitHub-Repository.

## Grundstruktur eines Workflows

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
```

## Python CI Beispiel

```yaml
name: Python CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.11", "3.12"]

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest ruff

      - name: Lint with ruff
        run: ruff check .

      - name: Test with pytest
        run: pytest --tb=short
```

## Docker Build & Push

```yaml
name: Docker Build & Push

on:
  push:
    tags: ["v*"]

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: myuser/myapp:${{ github.ref_name }}
```

## Wichtige Konzepte

| Konzept | Beschreibung |
|---------|--------------|
| `on` | Trigger-Ereignis (push, PR, schedule, etc.) |
| `jobs` | Parallel oder sequenziell laufende Jobs |
| `steps` | Einzelne Schritte innerhalb eines Jobs |
| `uses` | Wiederverwendbare Action aus Marketplace |
| `run` | Shell-Befehl |
| `secrets` | Verschlüsselte Umgebungsvariablen |
| `env` | Umgebungsvariablen |
| `matrix` | Parallele Ausführung mit verschiedenen Werten |

## Nützliche Actions

- `actions/checkout@v4` – Repository auschecken
- `actions/setup-node@v4` – Node.js einrichten
- `actions/setup-python@v5` – Python einrichten
- `actions/cache@v4` – Abhängigkeiten cachen
- `actions/upload-artifact@v4` – Build-Artefakte speichern
