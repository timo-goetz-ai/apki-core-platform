"""
AIOS Telegram Bot — aiogram 3.x
Function-Calling-fähiger Bot mit PostgreSQL-Anbindung und Website-Monitoring.
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any

import asyncpg
import httpx
from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import Message

# ── Config ────────────────────────────────────────────────────────────────────

BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
ALLOWED_USERS: set[int] = {
    int(uid.strip())
    for uid in os.environ.get("TELEGRAM_ALLOWED_USER_IDS", "").split(",")
    if uid.strip()
}
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:changeme@homestack-postgres:5432/nocodb",
)
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
MONITOR_URL = os.environ.get("MONITOR_URL", "https://ios.automation-ki.de")

log = logging.getLogger("aios-bot")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stdout,
)

# ── Globals ───────────────────────────────────────────────────────────────────

db_pool: asyncpg.Pool | None = None
http: httpx.AsyncClient | None = None

# ── Tools (Function Calling) ─────────────────────────────────────────────────
#
# Jedes Tool ist eine async-Funktion und hat eine SCHEMA-Definition für das LLM.

TOOL_SCHEMAS = [
    {
        "name": "check_website_status",
        "description": "Prüft den HTTP-Status und die Antwortzeit einer Website.",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "Die URL der Website. Standard: MONITOR_URL.",
                }
            },
            "required": [],
        },
    },
    {
        "name": "query_database",
        "description": (
            "Führt eine schreibgeschützte SQL-Abfrage gegen die PostgreSQL-Datenbank aus. "
            "Nützlich für Status-Logs, Nutzerdaten oder Tabellen-Übersichten."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "sql": {
                    "type": "string",
                    "description": "Die SQL-Abfrage (SELECT only).",
                }
            },
            "required": ["sql"],
        },
    },
    {
        "name": "list_database_tables",
        "description": "Listet alle Tabellen in der angebundenen PostgreSQL-Datenbank auf.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_system_info",
        "description": "Gibt System-Informationen zurück: Uptime, Bot-Version, DB-Status.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
]


async def check_website_status(url: str = "") -> dict[str, Any]:
    target = url or MONITOR_URL
    try:
        r = await http.get(target, follow_redirects=True, timeout=10)
        return {
            "url": str(r.url),
            "status_code": r.status_code,
            "ok": r.is_success,
            "response_time_ms": round(r.elapsed.total_seconds() * 1000),
            "content_length": len(r.content),
        }
    except Exception as exc:
        return {"url": target, "error": str(exc)}


async def query_database(sql: str) -> dict[str, Any]:
    if not db_pool:
        return {"error": "Keine Datenbankverbindung verfügbar."}
    normalized = sql.strip().upper()
    if not normalized.startswith("SELECT") and not normalized.startswith("WITH"):
        return {"error": "Nur SELECT-Abfragen sind erlaubt."}
    try:
        rows = await db_pool.fetch(sql)
        data = [dict(r) for r in rows[:50]]
        for row in data:
            for k, v in row.items():
                if isinstance(v, (datetime,)):
                    row[k] = v.isoformat()
                elif not isinstance(v, (str, int, float, bool, type(None))):
                    row[k] = str(v)
        return {"row_count": len(data), "data": data}
    except Exception as exc:
        return {"error": str(exc)}


async def list_database_tables() -> dict[str, Any]:
    return await query_database(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' ORDER BY table_name"
    )


async def get_system_info() -> dict[str, Any]:
    db_ok = False
    if db_pool:
        try:
            await db_pool.fetchval("SELECT 1")
            db_ok = True
        except Exception:
            pass
    return {
        "bot_framework": "aiogram 3.x",
        "python_version": sys.version.split()[0],
        "database_connected": db_ok,
        "monitor_url": MONITOR_URL,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


TOOL_DISPATCH: dict[str, Any] = {
    "check_website_status": check_website_status,
    "query_database": query_database,
    "list_database_tables": list_database_tables,
    "get_system_info": get_system_info,
}


# ── Gemini Function-Calling ──────────────────────────────────────────────────

def _build_gemini_tools() -> list[dict]:
    return [
        {
            "function_declarations": [
                {
                    "name": s["name"],
                    "description": s["description"],
                    "parameters": s["parameters"],
                }
                for s in TOOL_SCHEMAS
            ]
        }
    ]


async def _gemini_chat(messages: list[dict]) -> dict:
    """Single Gemini API call with function calling support."""
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_KEY}"
    )
    payload: dict[str, Any] = {
        "contents": messages,
        "tools": _build_gemini_tools(),
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 2048},
        "systemInstruction": {
            "parts": [
                {
                    "text": (
                        "Du bist AIOS, ein technischer AI-Assistent. "
                        "Antworte auf Deutsch, präzise und kompetent. "
                        "Nutze die verfügbaren Tools, um Live-Daten abzurufen, "
                        "bevor du Fragen zu Website-Status oder Datenbank beantwortest. "
                        "Formatiere Antworten mit Markdown."
                    )
                }
            ]
        },
    }
    r = await http.post(url, json=payload, timeout=30)
    r.raise_for_status()
    return r.json()


async def generate_ai_response(user_text: str) -> str:
    """
    Multi-turn function-calling loop:
    1. Send user message to Gemini
    2. If Gemini returns function_call → execute tool → send result back
    3. Repeat until Gemini returns a text response
    """
    if not GEMINI_KEY:
        return "Kein GEMINI_API_KEY konfiguriert."

    messages = [{"role": "user", "parts": [{"text": user_text}]}]

    for _ in range(5):  # max tool-call rounds
        resp = await _gemini_chat(messages)
        candidate = resp["candidates"][0]["content"]
        messages.append(candidate)

        # Check for function calls
        function_calls = [
            p for p in candidate.get("parts", []) if "functionCall" in p
        ]
        if not function_calls:
            # Pure text response
            text_parts = [
                p["text"] for p in candidate.get("parts", []) if "text" in p
            ]
            return "\n".join(text_parts) or "Keine Antwort."

        # Execute each function call
        fn_responses = []
        for part in function_calls:
            fc = part["functionCall"]
            fn_name = fc["name"]
            fn_args = fc.get("args", {})
            log.info("Tool call: %s(%s)", fn_name, fn_args)

            handler = TOOL_DISPATCH.get(fn_name)
            if handler:
                result = await handler(**fn_args)
            else:
                result = {"error": f"Unknown tool: {fn_name}"}

            fn_responses.append(
                {
                    "functionResponse": {
                        "name": fn_name,
                        "response": result,
                    }
                }
            )

        messages.append({"role": "function", "parts": fn_responses})

    return "Maximale Tool-Aufrufe erreicht."


# ── Handlers ──────────────────────────────────────────────────────────────────

dp = Dispatcher()


def _authorized(user_id: int) -> bool:
    return not ALLOWED_USERS or user_id in ALLOWED_USERS


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    if not _authorized(message.from_user.id):
        return
    await message.answer(
        "**AIOS Bot** (aiogram 3.x)\n\n"
        "Befehle:\n"
        "/status — Website-Status prüfen\n"
        "/tables — Datenbank-Tabellen auflisten\n"
        "/info — System-Info\n"
        "/reset — Konversation zurücksetzen\n\n"
        "Oder stell einfach eine Frage — die AI antwortet mit Live-Daten.",
    )


@dp.message(Command("status"))
async def cmd_status(message: Message) -> None:
    if not _authorized(message.from_user.id):
        return
    msg = await message.answer("Prüfe Website…")
    result = await check_website_status()
    if "error" in result:
        text = f"❌ **Fehler:** {result['error']}"
    else:
        emoji = "✅" if result["ok"] else "⚠️"
        text = (
            f"{emoji} **{result['url']}**\n"
            f"Status: `{result['status_code']}`\n"
            f"Antwortzeit: `{result['response_time_ms']}ms`\n"
            f"Größe: `{result['content_length']}` Bytes"
        )
    await msg.edit_text(text)


@dp.message(Command("tables"))
async def cmd_tables(message: Message) -> None:
    if not _authorized(message.from_user.id):
        return
    msg = await message.answer("Lade Tabellen…")
    result = await list_database_tables()
    if "error" in result:
        await msg.edit_text(f"❌ {result['error']}")
        return
    names = [r["table_name"] for r in result.get("data", [])]
    text = f"**{len(names)} Tabellen:**\n" + "\n".join(f"• `{n}`" for n in names)
    if len(text) > 4000:
        text = text[:4000] + "\n…(gekürzt)"
    await msg.edit_text(text)


@dp.message(Command("info"))
async def cmd_info(message: Message) -> None:
    if not _authorized(message.from_user.id):
        return
    info = await get_system_info()
    await message.answer(
        f"**System-Info**\n"
        f"Framework: `{info['bot_framework']}`\n"
        f"Python: `{info['python_version']}`\n"
        f"DB verbunden: `{info['database_connected']}`\n"
        f"Monitor: `{info['monitor_url']}`\n"
        f"Zeit: `{info['timestamp']}`"
    )


@dp.message(F.text)
async def handle_text(message: Message) -> None:
    if not _authorized(message.from_user.id):
        return
    msg = await message.answer("🧠 Denke nach…")
    try:
        response = await generate_ai_response(message.text)
    except Exception as exc:
        log.exception("AI error")
        response = f"❌ AI-Fehler: {exc}"
    try:
        await msg.edit_text(response)
    except Exception:
        # Markdown parse error fallback
        await msg.edit_text(response, parse_mode=None)


# ── Lifecycle ─────────────────────────────────────────────────────────────────

async def on_startup(bot: Bot) -> None:
    global db_pool, http
    http = httpx.AsyncClient(
        headers={"User-Agent": "AIOS-Bot/1.0"},
        follow_redirects=True,
    )
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
        log.info("PostgreSQL verbunden: %s", DATABASE_URL.split("@")[-1])
    except Exception as exc:
        log.warning("DB-Verbindung fehlgeschlagen: %s", exc)

    me = await bot.get_me()
    log.info("Bot gestartet: @%s (id=%s)", me.username, me.id)


async def on_shutdown(bot: Bot) -> None:
    if db_pool:
        await db_pool.close()
    if http:
        await http.aclose()
    log.info("Bot gestoppt.")


async def main() -> None:
    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN),
    )
    dp.startup.register(on_startup)
    dp.shutdown.register(on_shutdown)

    log.info("Starte AIOS Bot (polling)…")
    await dp.start_polling(bot, allowed_updates=["message"])


if __name__ == "__main__":
    asyncio.run(main())
