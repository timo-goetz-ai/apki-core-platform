# Integrations-Dokumentation (MCP-Server)

Dieser Ordner beschreibt die MCP-Server (Model Context Protocol) und API-Integrationen.

## MCP-Server Übersicht

| Server | Zweck | Datei |
|---|---|---|
| Database MCP | Direkter Datenbankzugriff | [database_mcp.md](database_mcp.md) |
| Email MCP | E-Mail-Verarbeitung & -Versand | [email_mcp.md](email_mcp.md) |
| Calendar MCP | Terminkoordination | [calendar_mcp.md](calendar_mcp.md) |
| Document MCP | Dokumentengenerierung & -verwaltung | [document_mcp.md](document_mcp.md) |
| Payment MCP | Finanzielle Transaktionen | [payment_mcp.md](payment_mcp.md) |

## Agenten-zu-MCP-Zuordnung

| Agent | Genutzte MCP-Server |
|---|---|
| CentralAgent | Database, Email |
| HRAgent | Database, Email, Calendar, Document |
| SalesAgent | Database, Email, Calendar |
| FinanceAgent | Database, Payment, Document |
| OpsAgent | Database |
| ITAgent | Database, Email |
| CustomerServiceAgent | Database, Email |
| EngineeringAgent | Database |
