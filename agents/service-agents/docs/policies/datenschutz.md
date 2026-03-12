# Datenschutzrichtlinie

**Geltungsbereich:** Alle KI-Agenten und MCP-Server  
**Grundlage:** DSGVO, BDSG

## Grundsätze

1. **Datensparsamkeit** – Agenten verarbeiten nur die für den jeweiligen Prozess notwendigen Daten.
2. **Zweckbindung** – Daten werden ausschließlich für den angegebenen Zweck genutzt.
3. **Speicherbegrenzung** – Personenbezogene Daten werden nach Prozessabschluss gelöscht oder anonymisiert.
4. **Transparenz** – Betroffene Personen werden über automatisierte Entscheidungen informiert.

## Klassifizierung von Daten

| Klasse | Beispiele | Speicherdauer | Verschlüsselung |
|---|---|---|---|
| Öffentlich | Produktkataloge, FAQs | Unbegrenzt | Optional |
| Intern | Prozessdokumente, Berichte | 10 Jahre | Empfohlen |
| Vertraulich | Verträge, Finanzdaten | 10 Jahre | Pflicht |
| Streng vertraulich | Personaldaten, Gesundheitsdaten | Gesetzlich | Pflicht (AES-256) |

## Agenten-Regelwerk

- Kein Agent darf personenbezogene Daten in Logs schreiben.
- Externe KI-APIs (z. B. LLM-Anbieter) erhalten keine unverschlüsselten Personendaten.
- Jeder Datenzugriff wird im Audit-Log erfasst.
