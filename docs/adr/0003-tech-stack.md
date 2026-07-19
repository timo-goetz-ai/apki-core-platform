# ADR 0003: Python FastAPI + Next.js + PostgreSQL

**Status:** Accepted  
**Date:** 2026-07-20

## Problem / Context

Need a stack for: ML/agent backends, real-time admin UI, relational data with migrations, and Docker-friendly deployment.

## Decision

| Layer | Technology |
|-------|------------|
| **Backend core** | Python 3.11+ / FastAPI (`nexus-core`) |
| **Agent API** | Python / FastAPI + CrewAI (`crew-api`) |
| **Frontend** | Next.js 14 / React / TypeScript (`admin-dashboard`) |
| **Database** | PostgreSQL 15 (asyncpg + Alembic migrations) |
| **Cache/Events** | Redis 7 |

## Rationale

- **Python** for AI/ML ecosystem (CrewAI, LangGraph, LiteLLM) and FastAPI performance
- **Next.js** for App Router, API routes as BFF to internal services
- **PostgreSQL** for ACID, JSON columns, Alembic migrations in deploy pipeline
- Team expertise and existing homestack (n8n, Supabase-compatible Postgres)

## Consequences

- ✅ Strong typing (Pydantic + TypeScript)
- ✅ Single monorepo with clear service boundaries
- ✅ CI runs Python (ruff/pytest) + Node (eslint/build) + root Jest smoke tests
- ❌ Two runtimes to maintain (Python + Node)
- ❌ Not a pure Node.js monolith — BFF pattern required between dashboard and cores
