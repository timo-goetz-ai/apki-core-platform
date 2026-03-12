"""Coder Agent boilerplate for an Agent Platform.

Flow:
1) Accept feature requirement
2) Search AppFlowy KB for related snippets
3) Generate production-ready code with Anthropic/OpenAI
4) Wrap output in markdown template
5) Save as AppFlowy record
6) Return status for dashboard display
"""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx

try:
    from crewai import Agent
except Exception:  # pragma: no cover - optional dependency in this boilerplate
    Agent = None


SYSTEM_PROMPT = """You are a senior software engineer.
Return JSON only with this schema:
{
  "description": "string",
  "installation": "string with shell commands",
  "usage": "string with code example",
  "full_code": "string containing complete production-ready code",
  "dependencies": ["dep1", "dep2"],
  "integration_points": ["point 1", "point 2"],
  "filename": "suggested filename"
}
Rules:
- Code must include clear error handling.
- Prefer practical defaults over placeholders.
- Keep dependencies minimal.
"""


@dataclass
class GenerationResult:
    requirement: str
    language: str
    description: str
    installation: str
    usage: str
    full_code: str
    dependencies: list[str]
    integration_points: list[str]
    filename: str


class AppFlowyClient:
    """Small AppFlowy API wrapper with configurable endpoints."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        database_id: str,
        search_endpoint: str = "/api/code/search",
        create_endpoint: str = "/api/code/create",
        timeout_seconds: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.database_id = database_id
        self.search_endpoint = search_endpoint
        self.create_endpoint = create_endpoint
        self.timeout_seconds = timeout_seconds

    @property
    def enabled(self) -> bool:
        return bool(self.base_url and self.api_key and self.database_id)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def search_code(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        if not self.enabled:
            return []

        payload = {
            "database": self.database_id,
            "query": query,
            "limit": limit,
            "category": "Code",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(
                    f"{self.base_url}{self.search_endpoint}",
                    headers=self._headers(),
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                if isinstance(data, dict):
                    records = data.get("records", data.get("list", []))
                    return records if isinstance(records, list) else []
                return data if isinstance(data, list) else []
        except Exception:
            return []

    async def create_code_record(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.enabled:
            return {
                "status": "skipped",
                "reason": "AppFlowy not configured",
                "record_id": None,
                "record_link": None,
            }

        request_payload = {
            "database": self.database_id,
            **payload,
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}{self.create_endpoint}",
                headers=self._headers(),
                json=request_payload,
            )
            response.raise_for_status()
            data = response.json()

        return {
            "status": "created",
            "record_id": data.get("id") or data.get("record_id"),
            "record_link": data.get("url") or data.get("record_link"),
            "raw": data,
        }


class LLMCodeGenerator:
    """Provider-agnostic code generation via Anthropic or OpenAI HTTP APIs."""

    def __init__(
        self,
        provider: str = "anthropic",
        anthropic_api_key: str = "",
        openai_api_key: str = "",
        anthropic_model: str = "claude-3-7-sonnet-latest",
        openai_model: str = "gpt-4.1",
        timeout_seconds: float = 90.0,
    ) -> None:
        self.provider = provider.lower().strip()
        self.anthropic_api_key = anthropic_api_key
        self.openai_api_key = openai_api_key
        self.anthropic_model = anthropic_model
        self.openai_model = openai_model
        self.timeout_seconds = timeout_seconds

    async def generate(
        self,
        requirement: str,
        language: str,
        kb_context: list[dict[str, Any]] | None = None,
    ) -> GenerationResult:
        kb_context = kb_context or []
        user_prompt = self._build_user_prompt(requirement, language, kb_context)

        raw_text = await self._call_provider(user_prompt)
        parsed = self._parse_model_output(raw_text)

        return GenerationResult(
            requirement=requirement,
            language=language,
            description=parsed["description"],
            installation=parsed["installation"],
            usage=parsed["usage"],
            full_code=parsed["full_code"],
            dependencies=parsed["dependencies"],
            integration_points=parsed["integration_points"],
            filename=parsed["filename"],
        )

    def _build_user_prompt(
        self, requirement: str, language: str, kb_context: list[dict[str, Any]]
    ) -> str:
        context_lines: list[str] = []
        for idx, item in enumerate(kb_context[:5], start=1):
            title = str(item.get("title", "Untitled"))
            content = str(item.get("content", ""))[:450]
            context_lines.append(f"{idx}. {title}\n{content}")

        context_block = "\n\n".join(context_lines) if context_lines else "No related snippets found."

        return (
            f"Requirement:\n{requirement}\n\n"
            f"Target language: {language}\n\n"
            "Project stack: Node.js, React, CrewAI, AppFlowy\n"
            "Always include comments and robust error handling.\n\n"
            "Existing KB context:\n"
            f"{context_block}\n"
        )

    async def _call_provider(self, prompt: str) -> str:
        if self.provider == "openai":
            if not self.openai_api_key:
                raise RuntimeError("OPENAI_API_KEY missing for provider=openai")
            return await self._call_openai(prompt)

        if not self.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY missing for provider=anthropic")
        return await self._call_anthropic(prompt)

    async def _call_openai(self, prompt: str) -> str:
        payload = {
            "model": self.openai_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }

        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        return (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )

    async def _call_anthropic(self, prompt: str) -> str:
        payload = {
            "model": self.anthropic_model,
            "max_tokens": 2500,
            "temperature": 0.2,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": prompt}],
        }

        headers = {
            "x-api-key": self.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        content = data.get("content", [])
        if not content:
            return ""
        return str(content[0].get("text", "")).strip()

    def _parse_model_output(self, raw_text: str) -> dict[str, Any]:
        cleaned = raw_text.strip()

        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
            cleaned = re.sub(r"```$", "", cleaned).strip()

        parsed: dict[str, Any] = {}
        try:
            parsed = json.loads(cleaned)
        except Exception:
            code_match = re.search(r"```[a-zA-Z0-9_+.-]*\n([\s\S]*?)```", raw_text)
            fallback_code = code_match.group(1).strip() if code_match else raw_text
            parsed = {
                "description": "Generated code from model output.",
                "installation": "# add dependencies if needed",
                "usage": fallback_code[:300],
                "full_code": fallback_code,
                "dependencies": [],
                "integration_points": ["Wire this output into your target service or route."],
                "filename": "generated_code.txt",
            }

        dependencies = parsed.get("dependencies", [])
        integration_points = parsed.get("integration_points", [])

        if not isinstance(dependencies, list):
            dependencies = [str(dependencies)]
        if not isinstance(integration_points, list):
            integration_points = [str(integration_points)]

        return {
            "description": str(parsed.get("description", "")) or "Generated implementation.",
            "installation": str(parsed.get("installation", "npm install")),
            "usage": str(parsed.get("usage", "")) or "// usage example",
            "full_code": str(parsed.get("full_code", "")) or "// code generation failed",
            "dependencies": [str(dep) for dep in dependencies],
            "integration_points": [str(item) for item in integration_points],
            "filename": str(parsed.get("filename", "generated_code.txt")),
        }


class CoderAgentRuntime:
    """Runs the full flow and returns markdown + metadata for dashboard usage."""

    def __init__(self, appflowy: AppFlowyClient, generator: LLMCodeGenerator) -> None:
        self.appflowy = appflowy
        self.generator = generator

    async def run(self, requirement: str, language: str = "javascript") -> dict[str, Any]:
        kb_matches = await self.appflowy.search_code(requirement)
        generation = await self.generator.generate(requirement, language, kb_matches)

        markdown = self._wrap_in_template(generation)
        tags = ["generated", "code", self._slug(requirement)]

        record_payload = {
            "title": generation.filename,
            "feature": requirement,
            "language": language,
            "status": "Ready to Review",
            "category": "Code",
            "generatedBy": "CoderAgent",
            "dependencies": generation.dependencies,
            "content": markdown,
            "tags": tags,
            "createdDate": datetime.now(timezone.utc).isoformat(),
        }
        save_result = await self.appflowy.create_code_record(record_payload)

        return {
            "status": "Ready to Review",
            "feature": requirement,
            "language": language,
            "markdown": markdown,
            "code": generation.full_code,
            "filename": generation.filename,
            "dependencies": generation.dependencies,
            "record": save_result,
            "tags": [f"#{tag}" for tag in tags],
            "dashboard_message": "Code generated - Review & Copy",
        }

    def _wrap_in_template(self, result: GenerationResult) -> str:
        today = datetime.now(timezone.utc).date().isoformat()
        deps = "\n".join(f"- {dep}" for dep in result.dependencies) or "- none"
        points = "\n".join(f"- {item}" for item in result.integration_points) or "- none"

        return f"""# {result.requirement}
**Status:** Generated by CoderAgent
**Date:** {today}
**Language:** {result.language}

## Description
{result.description}

## Installation
```bash
{result.installation}
```

## Usage
```{result.language}
{result.usage}
```

## Full Code
```{result.language}
{result.full_code}
```

## Dependencies
{deps}

## Integration Points
{points}

---
Status: Ready to Review
Tagged: #generated #code #{self._slug(result.requirement)}
"""

    @staticmethod
    def _slug(value: str) -> str:
        normalized = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower())
        return normalized.strip("-") or "feature"


def build_crewai_agent(runtime: CoderAgentRuntime) -> Agent | None:
    """Optional helper if CrewAI is installed in your environment."""
    if Agent is None:
        return None

    return Agent(
        role="Code Generator",
        goal="Generate production-ready code and save it as structured markdown in AppFlowy.",
        backstory=(
            "You are the platform CoderAgent. You first search existing KB snippets, "
            "then generate robust code, then persist output for review."
        ),
        tools=[runtime.run],
        verbose=True,
    )


def create_runtime_from_env(provider: str = "anthropic") -> CoderAgentRuntime:
    appflowy = AppFlowyClient(
        base_url=os.getenv("APPFLOWY_API_URL", ""),
        api_key=os.getenv("APPFLOWY_API_KEY", ""),
        database_id=os.getenv("APPFLOWY_DATABASE_ID", "code_snippets"),
        search_endpoint=os.getenv("APPFLOWY_SEARCH_ENDPOINT", "/api/code/search"),
        create_endpoint=os.getenv("APPFLOWY_CREATE_ENDPOINT", "/api/code/create"),
    )

    generator = LLMCodeGenerator(
        provider=provider,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        anthropic_model=os.getenv("ANTHROPIC_MODEL", "claude-3-7-sonnet-latest"),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4.1"),
    )

    return CoderAgentRuntime(appflowy=appflowy, generator=generator)


async def _main_async(args: argparse.Namespace) -> None:
    runtime = create_runtime_from_env(provider=args.provider)
    result = await runtime.run(requirement=args.requirement, language=args.language)

    print(json.dumps(
        {
            "status": result["status"],
            "dashboard_message": result["dashboard_message"],
            "record_link": result["record"].get("record_link"),
            "tags": result["tags"],
        },
        indent=2,
    ))
    print("\n" + result["markdown"])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run CoderAgent end-to-end.")
    parser.add_argument("requirement", help="Natural language feature requirement")
    parser.add_argument("--language", default="javascript", help="Target language")
    parser.add_argument(
        "--provider",
        default="anthropic",
        choices=["anthropic", "openai"],
        help="LLM provider",
    )
    return parser.parse_args()


if __name__ == "__main__":
    import asyncio

    asyncio.run(_main_async(parse_args()))
