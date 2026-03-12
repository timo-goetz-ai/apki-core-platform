---
title: "GitHub Actions Auto-Deploy Workflow"
version: "1.0.0"
tags: [github-actions, automation, deploy, workflow]
difficulty: intermediate
last_updated: "2026-03-03"
---

# GitHub Actions Auto-Deploy Workflow

Beschreibung eines automatisierten Deployment-Workflows via GitHub Actions.

## Ablauf

```
1. Developer pusht Code auf `main`
2. GitHub Actions startet automatisch
3. Tests laufen (Unit + Integration)
4. Bei Erfolg: Docker Image bauen & pushen
5. Deploy auf Staging-Server
6. Smoke Tests gegen Staging
7. Bei Erfolg: Deploy auf Production
8. Slack/Teams-Benachrichtigung
```

## Workflow-Datei

```yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm ci && npm test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .
      - name: Push to registry
        run: |
          echo "${{ secrets.REGISTRY_TOKEN }}" | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin
          docker push myapp:${{ github.sha }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          ssh deploy@staging.example.com "docker pull myapp:${{ github.sha }} && docker-compose up -d"

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          ssh deploy@prod.example.com "docker pull myapp:${{ github.sha }} && docker-compose up -d"
```

## Voraussetzungen

- Repository Secrets: `REGISTRY_USER`, `REGISTRY_TOKEN`, SSH-Keys
- GitHub Environments mit Protection Rules für Production
- Docker Registry (Docker Hub, GHCR, etc.)
