---
title: "Cursor Code Review Prompt"
version: "1.0.0"
tags: [cursor, code-review, prompt, ai]
difficulty: beginner
last_updated: "2026-03-03"
---

# Cursor Code Review Prompt

Wiederverwendbarer Prompt für Code Reviews in Cursor.

## Prompt

```
Review the selected code and provide feedback on:

1. **Correctness** – Are there bugs, edge cases, or logic errors?
2. **Performance** – Any obvious performance bottlenecks?
3. **Readability** – Is the code easy to understand? Are names clear?
4. **Security** – Any security vulnerabilities (injection, auth issues, etc.)?
5. **Best Practices** – Does it follow language/framework conventions?

For each issue found:
- Describe the problem clearly
- Explain why it's a problem
- Provide a concrete fix with code example

Be concise. Prioritize critical issues first.
```

## Prompt (Deutsch)

```
Analysiere den ausgewählten Code und gib Feedback zu:

1. **Korrektheit** – Gibt es Bugs, Edge Cases oder Logikfehler?
2. **Performance** – Offensichtliche Performance-Probleme?
3. **Lesbarkeit** – Ist der Code gut verständlich? Sind Namen klar?
4. **Sicherheit** – Sicherheitslücken (Injection, Auth, etc.)?
5. **Best Practices** – Werden Sprach-/Framework-Konventionen eingehalten?

Für jedes gefundene Problem:
- Problem klar beschreiben
- Erklären warum es ein Problem ist
- Konkreten Fix mit Code-Beispiel liefern

Priorisiere kritische Probleme zuerst. Antworte auf Deutsch.
```

## Spezifischer Review für Python

```
Review this Python code focusing on:
- PEP 8 compliance
- Type hints completeness
- Exception handling patterns
- Pythonic idioms (comprehensions, context managers, etc.)
- Missing docstrings for public functions/classes
```

## Spezifischer Review für JavaScript/TypeScript

```
Review this TypeScript code focusing on:
- Type safety (avoid `any`)
- Async/await error handling (try/catch)
- Null/undefined safety
- React best practices (hooks rules, key props, etc.)
- Bundle size implications
```
