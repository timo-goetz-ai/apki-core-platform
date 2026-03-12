---
title: "Python List Comprehensions"
version: "1.0.0"
tags: [python, lists, comprehensions, functional]
difficulty: beginner
last_updated: "2026-03-03"
---

# Python List Comprehensions

List Comprehensions bieten eine prägnante Möglichkeit, Listen zu erstellen.

## Grundsyntax

```python
# Grundform
result = [ausdruck for element in iterable if bedingung]

# Beispiel: Quadratzahlen
squares = [x**2 for x in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

## Vergleich mit klassischer Schleife

```python
# Klassisch
numbers = []
for x in range(10):
    if x % 2 == 0:
        numbers.append(x)

# Mit List Comprehension
numbers = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]
```

## Verschachtelte Comprehensions

```python
# Flattening einer verschachtelten Liste
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## Dict & Set Comprehensions

```python
# Dictionary Comprehension
squared = {x: x**2 for x in range(5)}
# {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# Set Comprehension
unique_lengths = {len(word) for word in ["hello", "world", "hi"]}
# {5, 2}
```

## Generator Expressions

```python
# Lazy evaluation – kein Speicher für gesamte Liste nötig
gen = (x**2 for x in range(1000000))
total = sum(gen)
```

## Wann verwenden?

- ✅ Einfache Transformationen und Filter
- ✅ Einzeilige, gut lesbare Ausdrücke
- ❌ Komplexe Logik mit mehreren Schritten → klassische Schleife bevorzugen
