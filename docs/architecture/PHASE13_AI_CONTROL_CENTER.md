# Phase 13: AI Control Center — Architektur & Agent-Loop-Konzept

> Stand: 2026-03-11 | Status: Konzept & Referenzdokumentation

---

## Übersicht

```
┌────────────────────────────────────────────────────────────┐
│              DEIN AI CONTROL CENTER (2026)                 │
├────────────────────────────────────────────────────────────┤
│  Dashboard                                                 │
│  └─ https://control.automation-plus-ki.de                 │
│                                                            │
│  API Layer                                                 │
│  └─ https://api.control.automation-plus-ki.de             │
│     ├─ /api/agents       (manage agents)                  │
│     ├─ /api/models       (model router)                   │
│     ├─ /api/prompts      (prompt registry)                │
│     ├─ /api/tasks        (task queue)                     │
│     └─ /api/automations  (triggers)                       │
│                                                            │
│  Agents                                                    │
│  ├─ Research Agent       → deepseek-reasoner              │
│  ├─ Dev Agent            → openai/gpt-4-turbo             │
│  ├─ Docs Agent           → mistral-large                  │
│  └─ Infrastructure Agent → gemini-2.0                     │
│                                                            │
│  Orchestration                                             │
│  ├─ n8n Workflows        (automation flows)               │
│  ├─ GitHub Actions       (CI/CD)                          │
│  └─ Webhooks             (event triggers)                 │
│                                                            │
│  Storage & Data                                            │
│  ├─ Workspace            (/workspace)                     │
│  ├─ Prompt Registry      (Git-based)                      │
│  ├─ PostgreSQL           (metadata)                       │
│  └─ Vector DB (Qdrant)   (embeddings)                     │
│                                                            │
│  Monitoring                                                │
│  ├─ Prometheus           (metrics)                        │
│  ├─ Grafana              (visualization)                  │
│  └─ Alerting             (notifications)                  │
└────────────────────────────────────────────────────────────┘
```

---

## Agent Execution Loop

```
┌─────────────────────────────────────┐
│  Agent Execution Loop               │
├─────────────────────────────────────┤
│ 1. Ziel/Kontext abrufen             │
│ 2. Hooks (Pre-Execution)            │
│ 3. Skills evaluieren & ausführen    │
│ 4. Ergebnis überprüfen              │
│ 5. Plugins zur Verarbeitung         │
│ 6. Hooks (Post-Execution)           │
│ 7. Konvergenz? → Ja: Exit | Nein: ↻ │
└─────────────────────────────────────┘
```

---

## Komponenten

### Objective-Definition

| Komponente | Zweck | Beispiel |
|---|---|---|
| Objective | Endzustand definieren | "Kundenproblem vollständig gelöst" |
| Success Criteria | Messbare Erfolgsbedingungen | `satisfaction_score >= 0.8` |
| Max Iterations | Abbruchbedingung | `iterations <= 10` |
| Timeout | Zeitliche Begrenzung | `5 minutes` |

```typescript
const objective = {
  goal: "Problem lösen",
  successCriteria: {
    confidence: 0.85,
    completeness: 0.9,
    userSatisfaction: 0.8
  },
  maxIterations: 5,
  timeout: 30000 // ms
};
```

---

### Skills als Ausführungseinheiten

```
Agent
├── Skill 1 (z.B. "Daten abrufen")
│   ├── Pre-Hook:  Validierung
│   ├── Ausführung
│   └── Post-Hook: Formatierung
├── Skill 2 (z.B. "Analyse durchführen")
└── Skill N
```

Skills haben **Few-shot Beispiele** eingebaut:

```typescript
class AnalysisSkill {
  examples = [
    { input: "Kundenfrage A", output: "Analyse-Ergebnis A" },
    { input: "Kundenfrage B", output: "Analyse-Ergebnis B" }
  ];

  async execute(context) {
    // Few-shot learning mit Beispielen
  }
}
```

---

### Hooks als Kontrollpunkte

| Hook-Typ | Wann | Beispiel |
|---|---|---|
| Pre-Execution | Vor Skill-Ausführung | Input validieren, Plugins laden |
| Post-Execution | Nach Skill-Ausführung | Ergebnis transformieren, Metriken sammeln |
| Pre-Iteration | Vor Loop-Schritt | Kontext aktualisieren |
| Post-Iteration | Nach Loop-Schritt | Konvergenz prüfen, Logs schreiben |

---

### Plugins für flexible Verarbeitung

```
Plugins (Registry)
├── Output-Transformer Plugin
├── Error-Recovery Plugin
├── Feedback-Loop Plugin
├── Memory/State Plugin
└── Custom-Logic Plugin
```

```typescript
plugins.register('converge-check', (result) => {
  return {
    ...result,
    shouldContinue: result.confidence < 0.9
  };
});
```

---

## Vollständige Agent-Implementierung

```typescript
class Agent {
  constructor(objective, skills, plugins, hooks) {
    this.objective  = objective;
    this.skills     = skills;     // Array von ausführbaren Skills
    this.plugins    = plugins;    // Plugin-Registry
    this.hooks      = hooks;      // Hook-Handler
    this.state      = {};         // Agent State (Speicher)
    this.iteration  = 0;
  }

  async execute(context) {
    while (this.shouldContinue()) {
      this.iteration++;

      // Pre-Iteration Hooks
      await this.hooks.runPre('iteration', { context, state: this.state });

      // Beste Skill auswählen
      const skill = this.selectSkill(context);

      // Pre-Execution Hooks
      await this.hooks.runPre('execution', { skill, context });

      // Skill ausführen
      let result = await skill.execute(context);

      // Post-Execution Hooks
      result = await this.hooks.runPost('execution', { result, skill });

      // Plugins anwenden (Transformation, Validierung, etc.)
      result = await this.plugins.process(result);

      // State aktualisieren
      this.state = { ...this.state, lastResult: result };

      // Post-Iteration Hooks
      await this.hooks.runPost('iteration', { result, state: this.state });

      // Konvergenzprüfung
      if (this.hasConverged(result)) break;
    }

    return this.state;
  }

  hasConverged(result) {
    return result.successScore >= this.objective.successCriteria.confidence;
  }

  shouldContinue() {
    return this.iteration < this.objective.maxIterations;
  }
}
```

---

## State Management über Iterationen

```typescript
// Jede Iteration hat Zugriff auf vorherige Ergebnisse
const state = {
  iteration: 3,
  previousResults: [ /* ... */ ],
  context: { /* ... */ },
  convergenceHistory: [0.5, 0.7, 0.85]
};
```

---

## Implementierungs-Checkliste

- [ ] Objective klar definiert (nicht fuzzy)
- [ ] Success Criteria messbar (Zahlen, nicht Text)
- [ ] Skills haben Beispiele (Few-shot)
- [ ] Hooks an kritischen Punkten registriert
- [ ] Plugins für Transformation geladen
- [ ] State zwischen Iterationen persistent
- [ ] Abbruchbedingungen (Iterations, Timeout, Konvergenz)
- [ ] Logging/Monitoring für jede Schleife
- [ ] Error-Recovery-Plugin vorhanden
- [ ] Feedback-Loop für Verbesserungen

---

## Verknüpfte Projekte

| Projekt | Pfad / URL |
|---|---|
| AI Agent Platform | `~/Geschäft/STUDIO/03_AI_Engineering/07_Projects/03_ai-agent-platform/` |
| AI Voice Platform | `~/Geschäft/STUDIO/03_AI_Engineering/07_Projects/01_ai-voice-platform/` |
| n8n (Orchestration) | https://n8n.automation-plus-ki.de |
| Grafana (Monitoring) | https://grafana.automation-plus-ki.de |
| Qdrant (Vector DB) | im Homestack |
| AppFlowy (Docs) | https://appflowy.automation-plus-ki.de |
