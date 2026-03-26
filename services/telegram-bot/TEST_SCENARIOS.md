# AIOS Control Bot — Simulierte Testszenarien

100 Testfragen für alle 18 Dashboard-Bereiche. Jede Frage mit erwartetem Intent und erwarteter Antwort.

---

## 📋 Overview / System Status

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 1 | `Zeige mir eine Übersicht des Systems.` | STATUS_OVERVIEW | n8n Workflows + 24h-Executions + Prometheus Alerts + Coolify Services |
| 2 | `Was sind die aktuellen Systemmetriken?` | MONITORING | CPU%, RAM%, Prometheus Alerts |
| 3 | `Gibt es eine Zusammenfassung der letzten Aktivitäten?` | ACTIVITY | Letzte 10 n8n Executions |
| 4 | `Wie ist der aktuelle Status des Systems?` | STATUS_OVERVIEW | Systemübersicht mit Icons |
| 5 | `Was sind die wichtigsten Kennzahlen im System?` | STATUS_OVERVIEW | Kennzahlen-Übersicht |

---

## ⚙️ Workflows

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 6 | `Welche Workflows sind derzeit aktiv?` | LIST_WORKFLOWS | Liste mit ✅/⏸ Icons |
| 7 | `Zeige mir die letzten Änderungen an den Workflows.` | LIST_WORKFLOWS | Workflow-Liste |
| 8 | `Gibt es Fehler in den aktuellen Workflows?` | LOGS | Fehler-Executions der letzten 7 Tage |
| 9 | `Aktiviere den Workflow "Datenverarbeitung".` | ACTIVATE_WORKFLOW | Sucht "Datenverarbeitung", aktiviert wenn gefunden |
| 10 | `Deaktiviere den Workflow "Berichtsgenerierung".` | DEACTIVATE_WORKFLOW | InlineKeyboard zur Bestätigung |

---

## 🤖 Agents

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 11 | `Wie viele Agenten sind derzeit konfiguriert?` | AGENTS | Anzahl aus NocoDB agents-Tabelle (ggf. "noch leer") |
| 12 | `Zeige mir die Details des Agenten "Datenanalyst".` | AGENTS | NocoDB agents-Tabelle, Filter auf Name |
| 13 | `Kann ich einen neuen Agenten hinzufügen?` | AGENTS | Hinweis + Dashboard-Link |
| 14 | `Was sind die aktuellen Statusberichte der Agenten?` | AGENTS | Alle Agenten-Einträge aus NocoDB |
| 15 | `Wie konfiguriere ich einen neuen Agenten?` | AGENTS | Hinweis + Dashboard-Link |

---

## 📚 Knowledge

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 16 | `Zeige mir die Knowledge Base.` | KNOWLEDGE | Top 5 aus NocoDB prompts-Tabelle |
| 17 | `Was sind die häufigsten Fragen in der Dokumentation?` | KNOWLEDGE | Prompts-Bibliothek |
| 18 | `Gibt es neue Artikel in der Knowledge Base?` | KNOWLEDGE | Neueste Einträge aus prompts-Tabelle |
| 19 | `Wie kann ich einen neuen Artikel hinzufügen?` | KNOWLEDGE | Hinweis + Dashboard-Link |
| 20 | `Suche nach Informationen zu "Workflow-Optimierung".` | KNOWLEDGE | NocoDB prompts-Tabelle |

---

## 📊 Monitoring

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 21 | `Wie ist der aktuelle Status der Systemüberwachung?` | MONITORING | CPU%, RAM%, Alerts |
| 22 | `Welche Metriken werden derzeit überwacht?` | MONITORING | Prometheus-Metriken |
| 23 | `Gibt es Warnungen im Monitoring-System?` | MONITORING | Firing Alerts |
| 24 | `Zeige mir die letzten 24 Stunden der Systemmetriken.` | MONITORING | CPU/RAM + Executions-Stats |
| 25 | `Was sind die häufigsten Probleme, die im Monitoring angezeigt werden?` | MONITORING | Prometheus Alerts |

---

## 📈 Activity

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 26 | `Zeige mir das Aktivitätsprotokoll der letzten Woche.` | ACTIVITY | n8n Executions (letzte 20) |
| 27 | `Was sind die letzten Aktivitäten im System?` | ACTIVITY | Letzte 10 Executions |
| 28 | `Gibt es eine Übersicht über Benutzeraktivitäten?` | ACTIVITY | n8n Execution-Übersicht |
| 29 | `Wie viele Benutzer haben sich in den letzten 24 Stunden angemeldet?` | STATUS_OVERVIEW | Systemstatus (kein User-Auth in n8n) |
| 30 | `Was sind die häufigsten Aktivitäten im System?` | ACTIVITY | Executions-Übersicht |

---

## 📝 Logs

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 31 | `Zeige mir die detaillierten Log-Einträge.` | LOGS | Fehler-Executions der letzten 7 Tage |
| 32 | `Gibt es Fehlerprotokolle der letzten 7 Tage?` | LOGS | Fehler-Executions mit Fehlermeldungen |
| 33 | `Wie kann ich ein spezifisches Log durchsuchen?` | LOGS | Logs + Dashboard-Link |
| 34 | `Was sind die letzten kritischen Fehler im Log?` | LOGS | Fehler-Executions |
| 35 | `Gibt es Warnungen in den Log-Einträgen?` | LOGS | Fehler-Executions |

---

## 🚀 Deployments

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 36 | `Was ist der Status der letzten Deployments?` | DEPLOYMENTS | Coolify Apps mit running/stopped Status |
| 37 | `Zeige mir die Historie der Deployments.` | DEPLOYMENTS | Coolify Application-Liste |
| 38 | `Gibt es fehlgeschlagene Deployments?` | DEPLOYMENTS | Coolify Apps mit stopped/error Status |
| 39 | `Wie kann ich ein Deployment zurücksetzen?` | DEPLOYMENTS | Hinweis + Coolify-Dashboard-Link |
| 40 | `Was sind die aktuellen Versionen der Deployments?` | DEPLOYMENTS | Coolify Apps mit Status |

---

## 📉 Analytics

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 41 | `Zeige mir die aktuellen Analysen.` | ANALYTICS | NocoDB Tabellen-Übersicht mit Row-Counts |
| 42 | `Was sind die wichtigsten Erkenntnisse aus den letzten Berichten?` | ANALYTICS | Research-Tabellen Übersicht |
| 43 | `Gibt es neue Analysen, die ich überprüfen sollte?` | ANALYTICS | NocoDB Counts + Hinweis auf trends/sentiment |
| 44 | `Wie kann ich einen neuen Bericht erstellen?` | ANALYTICS | Hinweis + Dashboard-Link |
| 45 | `Was sind die Trends in den letzten 30 Tagen?` | NOCODB_TRENDS | NocoDB Trends + Bar-Chart |

---

## 🏭 Content Factory

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 46 | `Zeige mir die Inhalte, die derzeit erstellt werden.` | CONTENT_FACTORY | NocoDB content_pipeline (letzte 5) |
| 47 | `Wie kann ich einen neuen Inhalt erstellen?` | CONTENT_FACTORY | Hinweis auf Dashboard + n8n-Workflow |
| 48 | `Gibt es eine Übersicht über die letzten Inhalte?` | CONTENT_FACTORY | Content Pipeline Einträge |
| 49 | `Was sind die häufigsten Inhalte, die erstellt wurden?` | CONTENT_FACTORY | Content Pipeline + Content Opportunities |
| 50 | `Wie kann ich einen bestehenden Inhalt bearbeiten?` | CONTENT_FACTORY | Dashboard-Link |

---

## 📌 Kanban

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 51 | `Zeige mir das Kanban-Board.` | KANBAN | Link zum Admin-Dashboard |
| 52 | `Welche Aufgaben sind derzeit in Bearbeitung?` | KANBAN | Dashboard-Link |
| 53 | `Wie kann ich eine neue Aufgabe im Kanban hinzufügen?` | KANBAN | Dashboard-Link |
| 54 | `Was sind die Prioritäten der aktuellen Aufgaben?` | KANBAN | Dashboard-Link |
| 55 | `Gibt es eine Übersicht über die abgeschlossenen Aufgaben?` | KANBAN | Dashboard-Link |

---

## 📄 Templates

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 56 | `Zeige mir die verfügbaren Vorlagen.` | TEMPLATES | Dashboard-Link |
| 57 | `Wie kann ich eine neue Vorlage erstellen?` | TEMPLATES | Dashboard-Link |
| 58 | `Gibt es Änderungen an bestehenden Vorlagen?` | TEMPLATES | Dashboard-Link |
| 59 | `Was sind die häufigsten Vorlagen, die verwendet werden?` | TEMPLATES | Dashboard-Link |
| 60 | `Wie kann ich eine Vorlage bearbeiten?` | TEMPLATES | Dashboard-Link |

---

## 📁 Files

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 61 | `Zeige mir die Dateiübersicht.` | FILES | Dashboard-Link |
| 62 | `Wie kann ich eine neue Datei hochladen?` | FILES | Dashboard-Link |
| 63 | `Gibt es eine Übersicht über die letzten Dateizugriffe?` | FILES | Dashboard-Link |
| 64 | `Wie kann ich eine Datei löschen?` | FILES | Dashboard-Link |
| 65 | `Was sind die häufigsten Dateitypen im System?` | FILES | Dashboard-Link |

---

## 🗄️ Databases

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 66 | `Zeige mir die Datenbanken, die derzeit verwaltet werden.` | DATABASES | Dashboard-Link |
| 67 | `Wie kann ich eine neue Datenbank erstellen?` | DATABASES | Dashboard-Link |
| 68 | `Gibt es Probleme mit den aktuellen Datenbanken?` | DATABASES | Dashboard-Link |
| 69 | `Was sind die letzten Änderungen an den Datenbanken?` | DATABASES | Dashboard-Link |
| 70 | `Wie kann ich eine Datenbank sichern?` | DATABASES | Dashboard-Link |

---

## 🔧 MCP Services

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 71 | `Zeige mir die konfigurierten MCP-Services.` | MCP_SERVICES | Coolify mcp-* Apps mit Status |
| 72 | `Wie kann ich einen neuen MCP-Service hinzufügen?` | MCP_SERVICES | Hinweis + Dashboard-Link |
| 73 | `Gibt es aktuelle Probleme mit den MCP-Services?` | MCP_SERVICES | Apps mit nicht-healthy Status |
| 74 | `Was sind die letzten Statusberichte der MCP-Services?` | MCP_SERVICES | Coolify mcp-* Apps |
| 75 | `Wie konfiguriere ich einen bestehenden MCP-Service?` | MCP_SERVICES | Dashboard-Link |

---

## 🔌 Tools & API

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 76 | `Zeige mir die verfügbaren APIs und Tools.` | MCP_SERVICES | MCP Services + Dashboard-Link |
| 77 | `Wie kann ich eine neue API integrieren?` | MCP_SERVICES | Dashboard-Link |
| 78 | `Gibt es aktuelle Probleme mit den APIs?` | MCP_SERVICES | MCP Service Status |
| 79 | `Was sind die häufigsten Tools, die verwendet werden?` | MCP_SERVICES | MCP Services Liste |
| 80 | `Wie kann ich ein Tool aktualisieren?` | MCP_SERVICES | Dashboard-Link |

---

## ⚙️ Settings

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 81 | `Zeige mir die aktuellen Systemeinstellungen.` | SETTINGS | Dashboard-Link |
| 82 | `Wie kann ich die Systemeinstellungen ändern?` | SETTINGS | Dashboard-Link |
| 83 | `Gibt es eine Übersicht über die letzten Änderungen an den Einstellungen?` | SETTINGS | Dashboard-Link |
| 84 | `Was sind die wichtigsten Systemeinstellungen, die ich überprüfen sollte?` | SETTINGS | Dashboard-Link |
| 85 | `Wie kann ich die Benutzereinstellungen anpassen?` | SETTINGS | Dashboard-Link |

---

## 🟢 System Online

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 86 | `Ist das System derzeit online?` | STATUS_OVERVIEW | Systemstatus mit 🟢/🔴 |
| 87 | `Gibt es geplante Wartungsarbeiten?` | STATUS_OVERVIEW | Systemstatus + Prometheus Alerts |
| 88 | `Was sind die letzten Systemupdates?` | DEPLOYMENTS | Coolify Deployment-Status |
| 89 | `Wie kann ich den Systemstatus überprüfen?` | STATUS_OVERVIEW | Systemübersicht |
| 90 | `Gibt es aktuelle Probleme, die den Systemstatus betreffen?` | ALERTS | Prometheus Alerts |

---

## 💡 Allgemeine Anfragen

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 91 | `Was sind die häufigsten Fragen von Benutzern?` | KNOWLEDGE | Prompts-Bibliothek |
| 92 | `Gibt es neue Updates, die ich beachten sollte?` | DEPLOYMENTS | Coolify Deployment-Status |
| 93 | `Wie kann ich Feedback zum System geben?` | HELP | Help-Text + Dashboard-Link |
| 94 | `Was sind die besten Praktiken für die Nutzung des Systems?` | HELP | Help-Text |
| 95 | `Wie kann ich die Benutzeroberfläche anpassen?` | SETTINGS | Dashboard-Link |

---

## ✅ Abschlussanfragen

| # | Frage | Intent | Erwartete Antwort |
|---|-------|--------|-------------------|
| 96 | `Zeige mir eine Zusammenfassung der letzten 30 Tage.` | ANALYTICS | NocoDB Counts + Trends |
| 97 | `Was sind die wichtigsten Herausforderungen, die wir derzeit haben?` | ALERTS | Prometheus Alerts + Fehler-Logs |
| 98 | `Gibt es neue Funktionen, die ich ausprobieren sollte?` | HELP | Help-Text |
| 99 | `Wie kann ich meine Benutzerdaten verwalten?` | SETTINGS | Dashboard-Link |
| 100 | `Was sind die nächsten Schritte für die Systemoptimierung?` | STATUS_OVERVIEW | Systemübersicht + Handlungsempfehlungen |

---

## Workflow-Steuerungs-Tests (Bonus)

```
aktiviere 11_TREND_MONITOR          → ACTIVATE_WORKFLOW(11_TREND_MONITOR)
deaktiviere 12_SENTIMENT_TRACKER    → DEACTIVATE_WORKFLOW(12_SENTIMENT_TRACKER) + InlineKeyboard
starte 13_CONTENT_OPPORTUNITY       → TRIGGER_WORKFLOW(13_CONTENT_OPPORTUNITY)
Aktiviere den Workflow 11_TREND_MONITOR  → ACTIVATE_WORKFLOW(11_TREND_MONITOR)
Deaktiviere den Workflow "60_DAILY_DIGEST"  → DEACTIVATE_WORKFLOW(60_DAILY_DIGEST)
```

---

## Verifikation

Teste jeden Intent-Typ mit mindestens einer Frage:

```bash
# In Telegram eingeben:
status          → STATUS_OVERVIEW
workflows       → LIST_WORKFLOWS
monitoring      → MONITORING
alerts          → ALERTS
activity        → ACTIVITY
logs            → LOGS
deployments     → DEPLOYMENTS
trends          → NOCODB_TRENDS (+ PNG Chart)
sentiment       → NOCODB_SENTIMENT (+ PNG Chart)
content         → CONTENT_FACTORY
analytics       → ANALYTICS
agents          → AGENTS
knowledge       → KNOWLEDGE
mcp             → MCP_SERVICES
kanban          → KANBAN (Dashboard-Link)
```
