---
title: "Cursor Refactoring Prompt"
version: "1.0.0"
tags: [cursor, refactoring, prompt, ai, clean-code]
difficulty: beginner
last_updated: "2026-03-03"
---

# Cursor Refactoring Prompt

Prompts für Code-Refactoring in Cursor.

## Allgemeines Refactoring

```
Refactor the selected code to improve:
- Readability and clarity
- Single Responsibility Principle
- Remove duplication (DRY)
- Better naming for variables and functions

Keep the same behavior. Add brief comments only where logic is non-obvious.
Show the refactored version with a short explanation of the changes made.
```

## Funktion aufteilen

```
The selected function is too long. Split it into smaller, focused functions.
Each function should do one thing. Keep the public API the same.
Use descriptive names that explain what each function does.
```

## Fehlerbehandlung verbessern

```
Improve error handling in the selected code:
- Add try/catch where missing
- Use specific exception types instead of catching everything
- Add meaningful error messages
- Ensure resources are properly cleaned up on error
- Log errors appropriately
```

## Performance-Optimierung

```
Analyze the selected code for performance improvements:
- Identify O(n²) or worse algorithms and suggest better alternatives
- Point out unnecessary re-renders (React) or recomputations
- Suggest caching opportunities
- Identify N+1 query problems
Quantify the expected improvement if possible.
```
