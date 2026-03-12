---
title: "JavaScript/TypeScript Style Guide"
version: "1.0.0"
tags: [javascript, typescript, eslint, style, best-practices]
difficulty: beginner
last_updated: "2026-03-03"
---

# JavaScript / TypeScript Style Guide

Coding-Standards für JavaScript und TypeScript-Projekte.

## Grundregeln

- Einrückung: **2 Leerzeichen**
- Semikolons: **Ja** (verhindert ASI-Fehler)
- Anführungszeichen: **Single quotes** (`'`) oder **Template Literals** `` ` ``
- `const` bevorzugen, `let` wenn nötig, **kein `var`**

## Namenskonventionen

```typescript
// Variablen und Funktionen: camelCase
const userName = "Alice";
function calculateTotalPrice() { ... }

// Klassen und Interfaces/Types: PascalCase
class UserProfile { ... }
interface ApiResponse { ... }
type UserId = string;

// Konstanten: UPPER_SNAKE_CASE (oder camelCase wenn aus config)
const MAX_RETRY_COUNT = 3;
const defaultTimeout = 30;

// Private Felder: führendes #
class MyClass {
  #privateField = "secret";
}
```

## TypeScript

```typescript
// ✅ Explizite Types verwenden
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// ❌ any vermeiden
function process(data: any) { ... }

// ✅ Stattdessen unknown oder konkrete Types
function process(data: unknown): void {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
}

// Interface vs Type
interface User {           // Interfaces für Objekte/Klassen
  id: number;
  name: string;
  email?: string;          // Optional
}

type Status = 'active' | 'inactive' | 'pending';  // Types für Unions
```

## Fehlerbehandlung

```typescript
// ✅ Immer try/catch bei async
async function fetchUser(id: number): Promise<User> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }
    return res.json() as Promise<User>;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}
```

## ESLint-Konfiguration

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error"
  }
}
```

## Prettier-Konfiguration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```
