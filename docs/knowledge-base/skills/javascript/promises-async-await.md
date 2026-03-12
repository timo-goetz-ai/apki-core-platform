---
title: "JavaScript Promises & Async/Await"
version: "1.0.0"
tags: [javascript, promises, async, await, fetch]
difficulty: intermediate
last_updated: "2026-03-03"
---

# JavaScript Promises & Async/Await

Asynchrone Programmierung in JavaScript mit Promises und der `async/await`-Syntax.

## Promise Grundlagen

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Erfolg!"), 1000);
});

promise
  .then(result => console.log(result))  // "Erfolg!"
  .catch(err => console.error(err))
  .finally(() => console.log("Fertig"));
```

## Promise-Kette

```javascript
fetch("https://api.example.com/user/1")
  .then(res => res.json())
  .then(user => fetch(`https://api.example.com/posts?userId=${user.id}`))
  .then(res => res.json())
  .then(posts => console.log(posts))
  .catch(err => console.error("Fehler:", err));
```

## Async/Await

```javascript
async function getUser(id) {
  try {
    const res = await fetch(`https://api.example.com/user/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const user = await res.json();
    return user;
  } catch (err) {
    console.error("Fehler beim Laden:", err);
    throw err;
  }
}
```

## Parallele Ausführung

```javascript
// ❌ Langsam: nacheinander
const user = await getUser(1);     // warte...
const posts = await getPosts(1);   // warte...

// ✅ Schnell: gleichzeitig
const [user, posts] = await Promise.all([
  getUser(1),
  getPosts(1),
]);
```

## Promise.allSettled

```javascript
// Alle Promises abwarten, auch wenn manche fehlschlagen
const results = await Promise.allSettled([
  fetch("/api/a"),
  fetch("/api/b"),
  fetch("/api/c"),
]);

results.forEach(result => {
  if (result.status === "fulfilled") {
    console.log("Erfolg:", result.value);
  } else {
    console.log("Fehler:", result.reason);
  }
});
```

## Promise.race & Promise.any

```javascript
// race: erstes Promise gewinnt (auch Fehler)
const fastest = await Promise.race([fetch("/api/a"), fetch("/api/b")]);

// any: erstes erfolgreiches Promise
const first = await Promise.any([fetch("/api/a"), fetch("/api/b")]);
```

## Fehlerbehandlung Pattern

```javascript
// Hilfsfunktion für saubere Error-Handling
async function safeAsync(promise) {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err, null];
  }
}

const [err, user] = await safeAsync(getUser(1));
if (err) { /* Fehler behandeln */ }
```
