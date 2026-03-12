---
title: "Deployment Checkliste"
version: "1.0.0"
tags: [deployment, checklist, devops, production]
difficulty: intermediate
last_updated: "2026-03-03"
---

# Deployment Checkliste

Checkliste vor, während und nach einem Produktions-Deployment.

## Vor dem Deployment

### Code & Tests
- [ ] Alle Tests grün (Unit, Integration, E2E)?
- [ ] Code Review abgeschlossen und approved?
- [ ] Keine offenen Security-Alerts?
- [ ] Abhängigkeiten aktuell (keine kritischen CVEs)?

### Konfiguration
- [ ] Umgebungsvariablen für Production gesetzt?
- [ ] Secrets in Vault / Secret Manager, nicht im Code?
- [ ] Datenbankmigrationen vorbereitet und getestet?
- [ ] Feature Flags korrekt konfiguriert?

### Backups & Rollback
- [ ] Datenbankbackup erstellt?
- [ ] Rollback-Plan dokumentiert?
- [ ] Letztes bekannt-gutes Image/Tag notiert?

## Während des Deployments

- [ ] Deployment außerhalb der Stoßzeiten?
- [ ] Monitoring-Dashboard geöffnet?
- [ ] Logs aktiv beobachten?
- [ ] Team informiert (Slack/Teams)?

## Nach dem Deployment

### Verifikation
- [ ] Smoke Tests erfolgreich?
- [ ] Health-Check-Endpoints antworten?
- [ ] Kritische User Flows manuell getestet?
- [ ] Fehlerrate normal (keine Spikes)?
- [ ] Response Times im Normalbereich?

### Dokumentation
- [ ] Changelog / Release Notes aktualisiert?
- [ ] Versionsnummer getaggt?
- [ ] Team informiert dass Deployment erfolgreich?

## Rollback-Trigger

Sofort rollbacken wenn:
- Error Rate > 1% (Baseline 0.1%)
- Response Time > 2x Baseline
- Health Checks schlagen fehl
- Kritische Bugs in Core-Features gemeldet
