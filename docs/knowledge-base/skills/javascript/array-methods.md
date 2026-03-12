---
title: "JavaScript Array Methods"
version: "1.0.0"
tags: [javascript, arrays, map, filter, reduce, functional]
difficulty: beginner
last_updated: "2026-03-03"
---

# JavaScript Array Methods

Die wichtigsten Array-Methoden für funktionale Programmierung in JavaScript.

## map – Transformieren

```javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10]

const users = [{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }];
const names = users.map(u => u.name);
// ["Alice", "Bob"]
```

## filter – Filtern

```javascript
const evens = numbers.filter(n => n % 2 === 0);
// [2, 4]

const adults = users.filter(u => u.age >= 18);
```

## reduce – Aggregieren

```javascript
const sum = numbers.reduce((acc, n) => acc + n, 0);
// 15

// Objekt aus Array bauen
const byName = users.reduce((acc, user) => {
  acc[user.name] = user;
  return acc;
}, {});
// { Alice: {...}, Bob: {...} }
```

## find & findIndex

```javascript
const alice = users.find(u => u.name === "Alice");
const idx = users.findIndex(u => u.name === "Alice"); // 0
```

## some & every

```javascript
const hasAdult = users.some(u => u.age >= 18);   // true
const allAdult = users.every(u => u.age >= 18);  // true/false
```

## flat & flatMap

```javascript
const nested = [[1, 2], [3, 4], [5]];
const flat = nested.flat();
// [1, 2, 3, 4, 5]

const sentences = ["Hallo Welt", "Foo Bar"];
const words = sentences.flatMap(s => s.split(" "));
// ["Hallo", "Welt", "Foo", "Bar"]
```

## sort

```javascript
// ⚠️ Modifiziert Original-Array – Kopie erstellen!
const sorted = [...numbers].sort((a, b) => a - b);  // aufsteigend
const sortedDesc = [...numbers].sort((a, b) => b - a);  // absteigend

const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));
```

## Methoden verketten

```javascript
const result = users
  .filter(u => u.age >= 25)
  .map(u => u.name)
  .sort();
// ["Alice", "Bob"] (beide >= 25)
```

## includes & indexOf

```javascript
const fruits = ["apple", "banana", "cherry"];
fruits.includes("banana");  // true
fruits.indexOf("cherry");   // 2
```

## Array.from & Array.of

```javascript
// Aus Set (Duplikate entfernen)
const unique = Array.from(new Set([1, 2, 2, 3, 3]));
// [1, 2, 3]

// Aus String
const chars = Array.from("Hallo");
// ["H", "a", "l", "l", "o"]
```
