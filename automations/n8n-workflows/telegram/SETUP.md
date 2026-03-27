# Telegram AIOS Assistant — Setup-Anleitung

## Übersicht

4 n8n-Workflows für die AIOS-Telegram-Integration:

```
70_TELEGRAM_ASSISTANT   ← Dispatcher (Haupt-Webhook)
  ├── 70a_WORKFLOW_CONTROL   ← Workflow steuern
  ├── 70b_STATUS_REPORT      ← Systemstatus
  └── 70c_RESEARCH_DATA      ← NocoDB-Daten
```

---

## Schritt 1: Telegram Bot erstellen

1. Telegram öffnen → `@BotFather` schreiben
2. `/newbot` → Name: `AIOS Control`, Username: `aios_control_bot` (muss auf `_bot` enden)
3. **Token kopieren** → sieht aus wie `1234567890:ABCdef...`
4. `/setcommands` → folgende Befehle eintragen:
   ```
   status - Systemstatus abrufen
   workflows - Alle Workflows anzeigen
   trends - Aktuelle Trends aus NocoDB
   alerts - Grafana/Prometheus Alerts
   hilfe - Verfügbare Befehle anzeigen
   ```

5. Eigene Chat-ID ermitteln: `@userinfobot` schreiben → numerische ID notieren

---

## Schritt 2: Env Vars in Coolify setzen

Im Coolify-Dashboard beim **n8n-Service** folgende Variablen hinzufügen:

| Variable | Wert |
|----------|------|
| `TELEGRAM_BOT_TOKEN` | Token aus Schritt 1 |
| `TELEGRAM_ALLOWED_CHAT_ID` | Deine Telegram User-ID (Zahl) |

Die folgenden Variablen sollten bereits vorhanden sein:
- `N8N_API_KEY`
- `NOCODB_API_TOKEN`
- `OPENROUTER_API_KEY`

Nach dem Setzen: **n8n-Service neu starten** (damit Env-Vars geladen werden).

---

## Schritt 3: Workflows in n8n importieren

**Reihenfolge wichtig!** Sub-Workflows zuerst, dann Dispatcher.

1. n8n öffnen: `https://n8n.automation-plus-ki.de`
2. Workflows → **Import from file**:
   - Erst: `70c_RESEARCH_DATA.json`
   - Dann: `70b_STATUS_REPORT.json`
   - Dann: `70a_WORKFLOW_CONTROL.json`
   - Zuletzt: `70_TELEGRAM_ASSISTANT.json`

3. Nach dem Import: **IDs der Sub-Workflows notieren** (in der URL sichtbar wenn geöffnet)

---

## Schritt 4: Sub-Workflow IDs eintragen

Im Workflow `70_TELEGRAM_ASSISTANT` müssen 3 Platzhalter ersetzt werden:

1. Node **"Run 70a Workflow Control"** → Workflow-ID von `70a_WORKFLOW_CONTROL` eintragen
2. Node **"Run 70b Status Report"** → Workflow-ID von `70b_STATUS_REPORT` eintragen
3. Node **"Run 70c Research Data"** → Workflow-ID von `70c_RESEARCH_DATA` eintragen

In n8n: Node anklicken → "Workflow" Feld → ID eingeben.

---

## Schritt 5: Alle 4 Workflows aktivieren

Jeden Workflow öffnen → Toggle oben rechts auf **Active** stellen.

Reihenfolge: Sub-Workflows zuerst, dann Dispatcher.

---

## Schritt 6: Telegram Webhook registrieren

```bash
curl -X POST "https://api.telegram.org/bot<DEIN_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://n8n.automation-plus-ki.de/webhook/telegram-assistant"}'
```

Erwartete Antwort: `{"ok":true,"result":true,"description":"Webhook was set"}`

Webhook-Status prüfen:
```bash
curl "https://api.telegram.org/bot<DEIN_TOKEN>/getWebhookInfo"
```

---

## Schritt 7: Testen

Deinen Bot in Telegram öffnen (suche nach `@aios_control_bot`) und testen:

| Nachricht | Erwartetes Ergebnis |
|-----------|---------------------|
| `/hilfe` | Befehlsliste |
| `status` | Systemstatus mit n8n-Stats |
| `workflows` | Liste aller n8n-Workflows |
| `trends` | Letzte 5 Trend-Einträge aus NocoDB |
| `sentiment` | Letzte 5 Sentiment-Einträge |
| `content` | Letzte 5 Content Opportunities |
| `alerts` | Prometheus Alert-Status |
| `aktiviere 11_TREND_MONITOR` | Workflow aktivieren |
| `deaktiviere 11_TREND_MONITOR` | Bestätigungs-Keyboard erscheint |
| `starte 12_SENTIMENT_TRACKER` | Workflow jetzt ausführen |

---

## Troubleshooting

**Bot antwortet nicht:**
- Webhook korrekt gesetzt? → `getWebhookInfo` prüfen
- Workflow `70_TELEGRAM_ASSISTANT` aktiv?
- `TELEGRAM_BOT_TOKEN` in Coolify gesetzt?

**"Blocked" — keine Antwort:**
- `TELEGRAM_ALLOWED_CHAT_ID` stimmt nicht → Wert aus `@userinfobot` prüfen
- Variable leer lassen um Sicherheits-Guard zu deaktivieren (nur für Tests!)

**Sub-Workflow-Fehler:**
- NocoDB: Läuft n8n im Docker-Netz? Ggf. externe URL `https://nocodb.automation-plus-ki.de` statt `http://homestack-nocodb:8080` verwenden
- n8n API: `N8N_API_KEY` gesetzt? `http://10.0.1.29:5678` erreichbar vom n8n-Container?

**AI Intent-Klassifizierung schlägt fehl:**
- `OPENROUTER_API_KEY` vorhanden?
- Rate-Limit bei `google/gemini-2.0-flash:free`? → Modell in AI Intent Classifier Node auf `openai/gpt-4o-mini` wechseln

---

## Workflow-Präfix-Konvention

Dieser Workflow folgt der AIOS-Namenskonvention:
- `70_` → Telegram Assistant (Dispatcher)
- `70a_` → Workflow Control Sub-Workflow
- `70b_` → Status Report Sub-Workflow
- `70c_` → Research Data Sub-Workflow
