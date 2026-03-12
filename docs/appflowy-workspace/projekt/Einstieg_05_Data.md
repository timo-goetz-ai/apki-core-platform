# Einstieg: 05_Data

**NocoDB Schemas, Qdrant Collections**

---

## Überblick

| | |
|---|---|
| **Ziel** | Tabellen, Vektor-DB für AI-Workflows |
| **Status** | NocoDB ✅, Qdrant ungenutzt ⚠️ |
| **Tech** | NocoDB, Qdrant |

---

## NocoDB

- 7 Tabellendefinitionen in nocodb/schema/
- KI-Bewerbungs-Automation nutzt NocoDB

---

## Qdrant

- Vector-DB läuft, kein Agent schreibt rein
- **Entscheidung:** Nutzen (z.B. n8n → Qdrant für Workflow-Ergebnisse) oder abschalten

---

## Struktur

- **Tasks** → Schema-Updates, Qdrant-Aktivierung
- **Configs** → Schema-Definitionen
- **Ergebnis** → Collections, Migrations
