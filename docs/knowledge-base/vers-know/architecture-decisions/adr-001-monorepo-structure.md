---
title: "ADR-001: Monorepo-Struktur für Portfolio-Repository"
version: "1.0.0"
tags: [adr, architecture, monorepo, knowledge-base]
difficulty: beginner
last_updated: "2026-03-03"
---

# ADR-001: Monorepo-Struktur für Portfolio-Repository

**Status:** Accepted  
**Datum:** 2026-03-03

## Kontext

Das Portfolio-Repository soll Skills, Agents, Regeln und Wissen an einem zentralen Ort verwalten. Es wurde die Frage gestellt, ob separate Repositories oder ein Monorepo sinnvoller ist.

## Entscheidung

Wir verwenden ein **Monorepo** mit klar getrennten Ordnern:

```
/skills/         – Wiederverwendbare Skills & Snippets
/agents/         – AI-Agenten, Prompts, Workflows
/rules/          – Coding-Standards, Konventionen
/knowledge-base/ – Tutorials, Best Practices, ADRs
/projects/       – Portfolio-Projekte
```

## Begründung

**Vorteile des Monorepos:**
- Single Source of Truth – alles an einem Ort
- Einfache Navigation und Suche über alle Inhalte
- Ein einziger Clone für das gesamte Wissen
- Konsistente Versionierung und Commit-Historie
- Auto-Index kann alle Inhalte scannen

**Nachteile (akzeptiert):**
- Bei sehr großem Wachstum könnte Performance leiden
- Berechtigungen können nicht granular pro Ordner gesetzt werden

## Konsequenzen

- Neue Inhalte immer im passenden Unterordner anlegen
- YAML Front Matter für alle Inhalte verwenden (Auto-Index)
- Contributions via PR gegen `main`
- Bei Bedarf kann später ein Splitting in separate Repos erfolgen
