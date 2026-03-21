# Rollback-Strategie

## Wie Images getaggt werden

GitHub Actions baut jedes Image mit zwei Tags:
- `ghcr.io/timogoetz1988/<service>:latest` — immer aktueller Stand von `main`
- `ghcr.io/timogoetz1988/<service>:sha-<SHORT_SHA>` — spezifischer Commit

Alle SHA-Tags sind im GitHub Container Registry sichtbar:
`https://github.com/TimoGoetz1988/aios/pkgs/container/<service>`

## Rollback-Verfahren (Coolify)

### 1. SHA des Ziel-Commits ermitteln

```bash
git log --oneline -10
# z. B.: abc1234 feat: xyz
```

### 2. Image-Tag in Coolify ändern

1. Coolify öffnen: https://coolify.automation-plus-ki.de
2. Anwendung auswählen (z. B. `infra-dashboard`)
3. **Configuration → General → Docker Image** — Tag von `latest` auf `sha-abc1234` ändern
4. **Deploy** auslösen

### 3. Health-Check

```bash
curl -f https://admin.automation-plus-ki.de/api/health
# oder je nach Service-URL
```

### 4. Nach erfolgreichem Rollback

- Ursache des Problems analysieren und in `main` fixen
- Fix committen, CI-Pipeline läuft durch
- Image-Tag in Coolify zurück auf `latest` setzen
- Erneut deployen

## Services & Image-Namen

| Service | Image |
|---------|-------|
| Admin Dashboard | `ghcr.io/timogoetz1988/aios-admin-dashboard` |
| Nexus Core | `ghcr.io/timogoetz1988/nexus-core` |
| Crew API | `ghcr.io/timogoetz1988/crew-api` |
| Landing Page | `ghcr.io/timogoetz1988/landing-page` |

## Wann kein Coolify-Rollback möglich ist

Wenn die DB-Schema-Migration (Alembic) vorwärts-inkompatibel war:
1. DB-Backup von vor dem Deploy einspielen (Backup-Script: `infra/scripts/`)
2. Dann Image-Rollback wie oben

## Schnell-Referenz

```bash
# Letzten stabilen SHA ermitteln
git log --oneline | grep -v "fix\|revert" | head -5

# Image lokal testen vor Coolify-Deploy
docker pull ghcr.io/timogoetz1988/aios-admin-dashboard:sha-abc1234
docker run -p 3000:3000 ghcr.io/timogoetz1988/aios-admin-dashboard:sha-abc1234
```
