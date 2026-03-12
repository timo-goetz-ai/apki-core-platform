---
title: "Python Async/Await"
version: "1.0.0"
tags: [python, async, await, asyncio, concurrency]
difficulty: intermediate
last_updated: "2026-03-03"
---

# Python Async / Await

`asyncio` ermöglicht asynchrone, nebenläufige Programmierung in Python ohne Threads.

## Grundkonzepte

```python
import asyncio

# Coroutine definieren
async def hello():
    print("Hallo")
    await asyncio.sleep(1)  # Nicht-blockierendes Warten
    print("Welt")

# Ausführen
asyncio.run(hello())
```

## Mehrere Tasks gleichzeitig

```python
import asyncio

async def fetch_data(url: str) -> str:
    await asyncio.sleep(1)  # Simulierter HTTP-Request
    return f"Daten von {url}"

async def main():
    # Gleichzeitig ausführen – schneller als nacheinander
    results = await asyncio.gather(
        fetch_data("https://api.example.com/users"),
        fetch_data("https://api.example.com/posts"),
        fetch_data("https://api.example.com/comments"),
    )
    for r in results:
        print(r)

asyncio.run(main())
```

## Task erstellen

```python
async def main():
    task1 = asyncio.create_task(fetch_data("url1"))
    task2 = asyncio.create_task(fetch_data("url2"))

    # Andere Arbeit erledigen während Tasks laufen
    await asyncio.sleep(0.1)

    result1 = await task1
    result2 = await task2
```

## Async Context Manager

```python
import aiofiles

async def read_file():
    async with aiofiles.open("datei.txt", "r") as f:
        content = await f.read()
    return content
```

## Async Generator

```python
async def count_up(n: int):
    for i in range(n):
        await asyncio.sleep(0.1)
        yield i

async def main():
    async for number in count_up(5):
        print(number)
```

## HTTP mit aiohttp

```python
import aiohttp
import asyncio

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.json()

async def main():
    async with aiohttp.ClientSession() as session:
        data = await fetch(session, "https://jsonplaceholder.typicode.com/todos/1")
        print(data)

asyncio.run(main())
```

## Wichtige Regeln

- `await` nur innerhalb `async def` verwenden
- `asyncio.run()` nur einmal pro Programm (Einstiegspunkt)
- CPU-intensive Aufgaben in `loop.run_in_executor()` auslagern
- Keine blockierenden Calls (`time.sleep`, `requests`) in Coroutinen
