# Unternehmens-Automatisierungsarchitektur

Ein zeitgemäßes Unternehmen gliedert sich in Kernbereiche, die jeweils durch spezialisierte KI-Agenten automatisiert werden. Dieses Repository enthält die Architektur, Konfigurationen und Wissensdatenbank für ein solches Multi-Agent-System.

---

## 🏗️ Systemarchitektur

```
┌─────────────────────────────────────────┐
│    Zentrale Orchestrier-Agent           │
│    (Koordiniert alle Abteilungen)       │
└────────────┬────────────────────────────┘
             │
    ┌────────┼────────┬─────────┐
    │        │        │         │
 ┌──▼──┐ ┌──▼──┐ ┌──▼──┐  ┌──▼──┐
 │HR   │ │Sales│ │Fin. │  │Ops. │
 │Agt. │ │Agt. │ │Agt. │  │Agt. │
 └──┬──┘ └──┬──┘ └──┬──┘  └──┬──┘
    │       │       │        │
    └───────┴───────┴────────┘
         │
    ┌────▼──────────────────┐
    │   MCP-Server Layer    │
    ├──────────────────────┤
    │ • Datenbank-Server   │
    │ • API-Gateway        │
    │ • Document-Server    │
    │ • Analytics-Server   │
    └──────────────────────┘
```

---

## 📁 Verzeichnisstruktur

```
├── docs/
│   ├── processes/       # Ablaufbeschreibungen
│   ├── policies/        # Unternehmensrichtlinien
│   ├── templates/       # Vorlagen
│   ├── faq/             # Häufige Fragen (für Agenten)
│   └── integrations/    # API-Dokumentation
├── src/
│   ├── agents/          # Agenten-Implementierungen
│   │   ├── central/     # Zentral-Agent
│   │   ├── hr/          # HR-Agent
│   │   ├── sales/       # Sales-Agent
│   │   ├── finance/     # Finance-Agent
│   │   ├── ops/         # Operations-Agent
│   │   ├── it/          # IT-Agent
│   │   ├── customer_service/ # Kundenservice-Agent
│   │   └── engineering/ # Engineering-Agent
│   ├── mcp_servers/     # MCP-Server-Konfigurationen
│   └── skills/          # Gemeinsame Skills/Funktionen
└── data/                # Datei-Organizer I/O
```

---

## 🤖 Abteilungen & Agenten

| Abteilung | Agent | Automatisierte Prozesse |
|---|---|---|
| Vertrieb & Marketing | `SalesAgent` | Lead-Scoring, E-Mail-Kampagnen, Pipeline-Management |
| Human Resources | `HRAgent` | Bewerberschreening, Onboarding, Urlaubsverwaltung |
| Finanzen & Controlling | `FinanceAgent` | Rechnungsverarbeitung, Reporting, Budgetplanung |
| Operationen & Supply Chain | `OpsAgent` | Bestandsverwaltung, Lieferanten-Koordination |
| IT & Infrastruktur | `ITAgent` | Ticket-Management, Deployment, Monitoring |
| Kundenservice | `CustomerServiceAgent` | Ticket-Routing, FAQ-Beantwortung, Eskalation |
| Produktentwicklung | `EngineeringAgent` | Bug-Tracking, Code-Review, Testing |

---

## ⚙️ Workflow-Beispiel: Automatisierte Kundenakquisition

```
Trigger: Neue Anfrage eingeht
  ↓
[CentralAgent] ✓ klassifiziert
  ↓
[SalesAgent → LeadAnalyzer] ✓ bewertet Lead
  ↓
[SalesAgent → EmailWriter] ✓ verfasst Angebot
  ↓
[FinanceAgent → ContractMCP] ✓ erstellt Vertrag
  ↓
[HRAgent → CalendarMCP] ✓ plant Kickoff-Meeting
  ↓
[CentralAgent] ✓ versendet alles & monitort
```

---

## 🚀 Quickstart

```bash
# Abhängigkeiten installieren und Datei-Organizer starten
./start.sh

# Oder direkt mit Python
pip install -r requirements.txt
python src/main.py
```

---

## 📚 Dokumentation

- [Prozesse](docs/processes/README.md)
- [Richtlinien](docs/policies/README.md)
- [Vorlagen](docs/templates/README.md)
- [FAQ](docs/faq/README.md)
- [Integrationen](docs/integrations/README.md)
