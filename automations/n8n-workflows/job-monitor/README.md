# job-monitor

> Continuous Integration / Automation — Builds, Checks, Deploy.

## 📋 Übersicht

Dieses Verzeichnis ist Teil des Repos unter `:new`. Die folgende Beschreibung wurde **automatisch aus Pfad und Namen** abgeleitet (Heuristik: `ci`) und soll Onboarding und Agenten-Kontext beschleunigen. Bei fachlicher Abweichung bitte **manuell anpassen**.

## 🎯 Zweck

- Pipeline-Schritte kurz und nachvollziehbar.
- Secrets nur über CI-Secrets / OIDC.
- Fehlerlogs und Wiederholbarkeit sicherstellen.

## 📁 Struktur

```
job-monitor/
├── 50_560_JOB_MONITOR.json
```

## 🚀 Quick Start

```bash
# In dieses Verzeichnis wechseln und Inhalt prüfen
cd "/Users/zuhause_mit_ideen/projects/:new/0-prod-aios-monorepo/automations/n8n-workflows/job-monitor"
ls -la
```

```python
def main() -> None:
    print("ok")


if __name__ == "__main__":
    main()
```

*Hinweis:* Zweiter Block ist ein **lauffähiges Minimalbeispiel** (Python), nicht notwendigerweise Teil dieses Ordners.

## 📖 Detaillierte Anleitung

### Lokale Orientierung

Verknüpfe diesen Ordner mit dem übergeordneten Kontext: [README im Root](../../../../README.md). Für produktiven Code im Monorepo siehe `services/`, `infrastructure/`, `docs/` je nach Thema.

### Änderungen vornehmen

Vor größeren Refactors: Abhaengigkeiten prüfen, Tests/CI laufen lassen, und bei API- oder Schemaaenderungen `05_DATA` bzw. Service-READMEs aktualisieren.

## ⚙️ Konfiguration & Optionen

| Parameter | Typ | Default | Beschreibung |
|-----------|-----|---------|--------------|
| Umgebung | str | `local` | Welche `.env` / Secrets gelten (`13_ENVIRONMENTS`) |
| Log-Level | str | `info` | Für Dienste: `debug` nur lokal |
| Feature-Flags | bool | `false` | Über Env toggeln, nicht hardcoden |

## 🔗 Abhaengigkeiten & Relationen

- **Benötigt**: übergeordnetes `../../../../README.md`, ggf. `02_SECRETS`, `13_ENVIRONMENTS`
- **Wird genutzt von**: je nach Inhalt — Services, CI, oder lokale Tools
- **Optional kombinierbar mit**: `11_TESTING`, `12_DOCKER`, `18_OBSERVABILITY`

## 💡 Best Practices

1. Keine Secrets im Git — nur `.env.example` oder Secret-Manager.
2. Kurze, suchbare READMEs; Details in `docs/` oder Service-README auslagern.
3. Pfade mit Sonderzeichen (`:`, Leerzeichen) immer quoten.

## ⚠️ Häufige Fehler & Lösungen

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Falsche Umgebung | `.env` nicht geladen | `set -a; source .env; set +a` oder Tooling prüfen |
| Veraltete Doku | kein Review nach Refactor | Diese README und `docs/` anpassen |
| CI rot | fehlende Dependency | Lockfile/Version im Root des Services prüfen |

## 🔄 Alternativen & Varianten

**Standard für dich**: Markdown im Repo, kurze README pro Ordner.

| Ansatz | Beste Nutzung | Vor- & Nachteile |
|--------|---------------|------------------|
| Nur zentrale Doku | kleine Teams | übersichtlich; Tiefe leidet |
| Volltext pro Ordner | Monorepo mit vielen Packages | Navigation einfach; mehr Pflege |

## 📚 Weiterführende Ressourcen & Links

- [README im Repo-Root](../../../../README.md)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [12-Factor Config](https://12factor.net/config)
