---
title: "Docker Grundlagen"
version: "1.0.0"
tags: [docker, container, devops, deployment]
difficulty: beginner
last_updated: "2026-03-03"
---

# Docker Grundlagen

Docker ermöglicht das Verpacken von Anwendungen in portable Container.

## Wichtigste Befehle

```bash
# Image bauen
docker build -t mein-app:1.0 .

# Container starten
docker run -d -p 8080:80 --name mein-container mein-app:1.0

# Laufende Container anzeigen
docker ps

# Alle Container (auch gestoppte)
docker ps -a

# Container stoppen & entfernen
docker stop mein-container
docker rm mein-container

# Image entfernen
docker rmi mein-app:1.0

# Logs anzeigen
docker logs -f mein-container

# Shell im Container öffnen
docker exec -it mein-container /bin/bash
```

## Dockerfile Beispiel (Node.js)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Erst package.json kopieren (Layer-Caching)
COPY package*.json ./
RUN npm ci --only=production

# Restliche Dateien kopieren
COPY . .

# Port freilegen
EXPOSE 3000

# Startbefehl
CMD ["node", "server.js"]
```

## Dockerfile Beispiel (Python)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## docker-compose.yml Beispiel

```yaml
version: "3.9"

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
# Alle Services starten
docker compose up -d

# Services stoppen
docker compose down

# Logs aller Services
docker compose logs -f
```

## Best Practices

- ✅ Minimale Base-Images verwenden (alpine, slim)
- ✅ `.dockerignore` anlegen (node_modules, .git, .env)
- ✅ Multi-Stage Builds für produktionsbereite Images
- ✅ Nicht als root ausführen (`USER nonroot`)
- ✅ Secrets nie in ENV-Variablen im Dockerfile hardcoden
- ❌ Kein `latest`-Tag in Produktion
