---
title: "Python Decorators"
version: "1.0.0"
tags: [python, decorators, functions, advanced]
difficulty: intermediate
last_updated: "2026-03-03"
---

# Python Decorators

Decorators ermöglichen es, Funktionen oder Klassen zu modifizieren, ohne deren Quellcode zu ändern.

## Grundprinzip

```python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print("Vor dem Aufruf")
        result = func(*args, **kwargs)
        print("Nach dem Aufruf")
        return result
    return wrapper

@my_decorator
def say_hello(name):
    print(f"Hallo, {name}!")

say_hello("Welt")
# Ausgabe:
# Vor dem Aufruf
# Hallo, Welt!
# Nach dem Aufruf
```

## functools.wraps verwenden

```python
import functools

def my_decorator(func):
    @functools.wraps(func)  # Erhält Metadaten der Originalfunktion
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

## Decorator mit Parametern

```python
def repeat(n):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for _ in range(n):
                func(*args, **kwargs)
        return wrapper
    return decorator

@repeat(3)
def greet():
    print("Hallo!")

greet()
# Hallo!
# Hallo!
# Hallo!
```

## Praxisbeispiele

### Timer Decorator

```python
import time
import functools

def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} lief in {end - start:.4f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)
```

### Cache / Memoization

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

### Klassen-Decorator

```python
def singleton(cls):
    instances = {}
    @functools.wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class DatabaseConnection:
    pass
```

## Wann verwenden?

- ✅ Logging, Timing, Caching
- ✅ Zugriffskontrolle / Authentication
- ✅ Eingabevalidierung
- ✅ Wiederverwendbare Querschnittsbelange (Cross-Cutting Concerns)
