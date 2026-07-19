# ADR 0001: CrewAI for Agent Orchestration

**Status:** Accepted  
**Date:** 2026-07-20

## Problem / Context

The platform needs multi-agent workflows: content research, writing, fact-checking, routing user prompts to the right pipeline. Building custom orchestration from scratch would take months.

## Decision

Use **CrewAI** via a dedicated **crew-api** FastAPI service. Agent teams are defined declaratively in `services/crew-api/config/crews.yaml` (roles, tasks, models, process flow).

Alternatives considered:
- **Custom Python orchestration** — full control, high maintenance
- **LangChain/LangGraph only** — flexible but more boilerplate for team patterns
- **Fully self-hosted only** — no external CrewAI cloud dependency

## Consequences

- ✅ Fast iteration: new crews via YAML, not new microservices
- ✅ Director-agent pattern for intelligent routing
- ✅ Integrates with Redis event stream and n8n webhooks
- ❌ Dependency on CrewAI library evolution and API surface
- ❌ Model costs via OpenRouter/Gemini (~€10–50/mo variable)
- 💰 No separate CrewAI SaaS fee — self-hosted API on our Hetzner stack
