---
title: "Docker & Docker Compose Tutorial"
version: "1.0.0"
tags: [docker, tutorial, containers, devops]
difficulty: beginner
last_updated: "2026-03-03"
---

# Docker & Docker Compose Tutorial

Schritt-für-Schritt Anleitung für das Containerisieren einer Anwendung.

## Vorbereitung

```bash
# Docker Version prüfen
docker --version
docker compose version
```

## Schritt 1: Dockerfile erstellen

Erstelle eine Datei namens `Dockerfile` im Projekt-Root:

```dockerfile
FROM python:3.12-slim

# Arbeitsverzeichnis setzen
WORKDIR /app

# Dependencies zuerst kopieren (für Layer-Caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Anwendungscode kopieren
COPY . .

# Port dokumentieren
EXPOSE 8000

# Startbefehl
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Schritt 2: .dockerignore erstellen

```
__pycache__/
*.pyc
*.pyo
.env
.git
.gitignore
node_modules/
dist/
*.log
```

## Schritt 3: Image bauen und testen

```bash
# Image bauen
docker build -t meine-app:dev .

# Container starten
docker run -p 8000:8000 meine-app:dev

# App im Browser: http://localhost:8000
```

## Schritt 4: docker-compose.yml für Entwicklung

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app  # Live-Reload: lokaler Code wird gemountet
    environment:
      - DEBUG=true
      - DATABASE_URL=postgresql://user:pass@db:5432/devdb
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: devdb
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

## Schritt 5: Starten & Stoppen

```bash
# Starten (im Hintergrund)
docker compose up -d

# Logs anzeigen
docker compose logs -f app

# Stoppen
docker compose down

# Stoppen + Volumes löschen (Datenbank zurücksetzen)
docker compose down -v
```

## Schritt 6: Debugging

```bash
# Shell im laufenden Container öffnen
docker compose exec app /bin/bash

# Einmaligen Befehl ausführen
docker compose run --rm app python manage.py migrate
```
