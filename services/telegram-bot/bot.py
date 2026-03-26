"""AIOS Co-Pilot Bot — Proaktiver KI-Assistent für das AIOS-Ökosystem.

Ersetzt die n8n-basierte 70_TELEGRAM_ASSISTANT Workflow-Kette.

Architektur:
- intents.py: Deterministische Keyword-Klassifizierung (kein AI-Overhead für einfache Befehle)
- api_clients.py: Direkte HTTP-Clients für n8n, NocoDB, Prometheus, Coolify
- ai_agent.py: ConversationMemory (Window Buffer) + AI-Antwortgenerierung via OpenRouter
- charts.py: QuickChart.io PNG-Generierung

Der Bot ist kein passiver Status-Anzeiger, sondern ein proaktiver Co-Pilot:
- Interpretiert Metriken menschlich verständlich
- Erinnert sich an die letzten 6 Nachrichten pro User (Window Buffer Memory)
- Stellt Rückfragen statt generische Antworten bei unklaren Anfragen
- Erkennt Zusammenhänge zwischen Systemen
"""
from __future__ import annotations

import asyncio
import io
import logging
import os
from datetime import datetime, timezone, timedelta
from functools import wraps

import httpx
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

import ai_agent
import api_clients as api
import charts
from intents import classify, Intent

load_dotenv()

# ─── Config ───────────────────────────────────────────────────────────────────
BOT_TOKEN        = os.environ["TELEGRAM_BOT_TOKEN"]
ALLOWED_USER_ID  = int(os.environ["TELEGRAM_ALLOWED_USER_ID"])
DASHBOARD_URL    = os.environ.get("DASHBOARD_URL", "https://aios.automation-plus-ki.de")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Shared async HTTP client (created in post_init, closed in post_shutdown)
http_client: httpx.AsyncClient | None = None

# Conversation memory: per-user Window Buffer (last 6 turns)
memory = ai_agent.ConversationMemory(max_turns=6)


# ─── Auth decorator ───────────────────────────────────────────────────────────

def require_auth(func):
    @wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = update.effective_user.id if update.effective_user else None
        if user_id != ALLOWED_USER_ID:
            logger.warning("Rejected request from user_id=%s", user_id)
            return  # Silent rejection — no feedback to unknown users
        try:
            return await func(update, context)
        except Exception as exc:
            logger.exception("Handler error in %s", func.__name__)
            try:
                await update.effective_message.reply_text(f"❌ Fehler: {exc}")
            except Exception:
                pass
    return wrapper


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def loading(update: Update, text: str = "⏳ Lade Daten…") -> object:
    return await update.effective_message.reply_text(text)


def fmt_date(s: str | None) -> str:
    if not s:
        return "?"
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        local = dt.astimezone(timezone(timedelta(hours=2)))
        return local.strftime("%d.%m.  %H:%M")
    except ValueError:
        return s[:10]


def truncate(text: str, max_len: int = 4000) -> str:
    if len(text) <= max_len:
        return text
    return text[:max_len - 40] + "\n\n_[Ausgabe gekürzt]_"


def _get_field(row: dict, *keys: str, default: str = "?") -> str:
    for k in keys:
        v = row.get(k)
        if v is not None and str(v).strip():
            return str(v)
    return default


# ─── Help text ────────────────────────────────────────────────────────────────

HELP_TEXT = f"""🤖 *AIOS Control Bot*

*System & Status*
`status` — Systemübersicht (n8n + Prometheus + Coolify)
`monitoring` — Systemmetriken & Prometheus Alerts
`alerts` — Feuernde Prometheus Alerts
`deployments` — Coolify Deployment-Status
`activity` — Letzte Aktivitäten (n8n Executions)
`logs` — Fehler-Executions der letzten 7 Tage

*Workflows*
`workflows` — Alle n8n Workflows anzeigen
`aktiviere [Name]` — Workflow aktivieren
`deaktiviere [Name]` — Workflow stoppen (mit Bestätigung)
`starte [Name]` — Workflow jetzt ausführen

*Research & Content*
`trends` — Trend-Daten + Chart
`sentiment` — Sentiment-Analyse + Chart
`content` — Content Opportunities
`analytics` — Research-Tabellen Übersicht

*Wissen & Agenten*
`agents` — Konfigurierte Agenten
`knowledge` — Knowledge Base (Prompts)
`mcp` — MCP Services Status

*Weitere Bereiche*
`kanban`, `templates`, `files`, `databases`, `settings`
→ Im Admin-Dashboard: {DASHBOARD_URL}

/hilfe — Diese Hilfe"""


# ─── Status Overview ──────────────────────────────────────────────────────────

@require_auth
async def handle_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Systemstatus wird abgerufen…")

    workflows, executions, alerts, apps = await asyncio.gather(
        api.get_n8n_workflows(http_client),
        api.get_n8n_executions(http_client, limit=100),
        api.get_prometheus_alerts(http_client),
        api.get_coolify_applications(http_client),
        return_exceptions=True,
    )

    lines = []

    # Workflows
    if isinstance(workflows, Exception):
        lines.append(f"⚠️ *n8n:* Nicht erreichbar ({workflows})")
        status_icon = "🟡"
    else:
        total = len(workflows)
        active = sum(1 for w in workflows if w.get("active"))
        lines.append(f"*n8n Workflows:*\n• Gesamt: {total} | ✅ Aktiv: {active} | ⏸ Pausiert: {total - active}")

    # Executions
    if isinstance(executions, Exception):
        lines.append(f"\n⚠️ *Executions:* {executions}")
    else:
        stats = api.calc_execution_stats(executions, hours=24)
        avg = f"{stats['avg_runtime_s']}s" if stats['avg_runtime_s'] else "n/a"
        lines.append(
            f"\n*Ausführungen (24h):*\n"
            f"• Gesamt: {stats['total']} | ✅ {stats['success']} | ❌ {stats['errors']}\n"
            f"• Ø Laufzeit: {avg}"
        )

    # Alerts
    if isinstance(alerts, Exception):
        lines.append(f"\n⚠️ *Prometheus:* {alerts}")
        status_icon = "🟡"
    elif alerts:
        names = [a.get("labels", {}).get("alertname", "?") for a in alerts[:3]]
        lines.append(f"\n*🔴 Alerts ({len(alerts)} feuern):*\n• " + "\n• ".join(names))
        status_icon = "🔴"
    else:
        lines.append("\n*Alerts:* ✅ Keine feuernden Alerts")
        status_icon = "🟢"

    # Coolify services
    if isinstance(apps, Exception):
        lines.append(f"\n⚠️ *Coolify:* {apps}")
    else:
        running = sum(1 for a in apps if "running" in str(a.get("status", "")).lower())
        lines.append(f"\n*Coolify Services:*\n• {running}/{len(apps)} laufen")

    # Prepare data context for AI interpretation
    exec_stats = api.calc_execution_stats(executions, hours=24) if not isinstance(executions, Exception) else None
    data_ctx = {
        "workflows": {"total": len(workflows) if not isinstance(workflows, Exception) else "n/a",
                      "active": sum(1 for w in workflows if w.get("active")) if not isinstance(workflows, Exception) else "n/a"},
        "executions_24h": exec_stats,
        "alerts": [{"name": a.get("labels",{}).get("alertname"), "severity": a.get("labels",{}).get("severity")} for a in alerts] if not isinstance(alerts, Exception) else "n/a",
        "coolify_services": {"total": len(apps), "running": sum(1 for a in apps if "running" in str(a.get("status","")).lower())} if not isinstance(apps, Exception) else "n/a",
    }

    # Try AI interpretation first
    user_msg = update.message.text if update.message else "status"
    user_id = update.effective_user.id
    ai_text = await ai_agent.generate_response(http_client, user_msg, data_ctx, memory, user_id)

    if ai_text:
        await msg.edit_text(truncate(ai_text), parse_mode="Markdown")
    else:
        now_str = datetime.now(timezone(timedelta(hours=2))).strftime("%d.%m. %H:%M")
        header = f"{status_icon} *AIOS System Status*\n\n"
        text = header + "\n".join(lines) + f"\n\n_Stand: {now_str} Uhr_"
        await msg.edit_text(truncate(text), parse_mode="Markdown")

    # Chart: execution stats
    if not isinstance(executions, Exception):
        stats = api.calc_execution_stats(executions, hours=24)
        other = stats["total"] - stats["success"] - stats["errors"]
        try:
            config = charts.build_execution_stats_chart(stats["success"], stats["errors"], max(0, other))
            png = await charts.fetch_chart_png(http_client, config)
            await update.effective_message.reply_photo(photo=png, caption="Ausführungen letzte 24h")
        except Exception as e:
            logger.warning("Status chart failed: %s", e)


# ─── Workflows ────────────────────────────────────────────────────────────────

@require_auth
async def handle_workflows(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Workflows…")
    workflows = await api.get_n8n_workflows(http_client)

    active_wf   = [w for w in workflows if w.get("active")]
    inactive_wf = [w for w in workflows if not w.get("active")]

    lines = [f"*n8n Workflows* ({len(workflows)} gesamt)\n"]
    if active_wf:
        lines.append(f"*Aktiv ({len(active_wf)}):*")
        for w in active_wf:
            lines.append(f"  ✅ `{w['name']}`")
    if inactive_wf:
        lines.append(f"\n*Pausiert ({len(inactive_wf)}):*")
        for w in inactive_wf:
            lines.append(f"  ⏸ `{w['name']}`")
    lines.append("\n_aktiviere [Name] | deaktiviere [Name] | starte [Name]_")

    await msg.edit_text(truncate("\n".join(lines)), parse_mode="Markdown")

    # Workflow status chart
    try:
        config = charts.build_workflow_status_chart(len(active_wf), len(inactive_wf))
        png = await charts.fetch_chart_png(http_client, config, width=400, height=300)
        await update.effective_message.reply_photo(photo=png)
    except Exception as e:
        logger.warning("Workflow chart failed: %s", e)


def _find_workflow(workflows: list[dict], query: str) -> dict | None:
    q = query.lower()
    for w in workflows:
        if w.get("name", "").lower() == q:
            return w
    for w in workflows:
        if q in w.get("name", "").lower():
            return w
    return None


async def _activate_workflow(update: Update, name: str) -> None:
    msg = await loading(update, f"⏳ Suche Workflow `{name}`…")
    workflows = await api.get_n8n_workflows(http_client)
    target = _find_workflow(workflows, name)
    if not target:
        await msg.edit_text(
            f"❌ Workflow `{name}` nicht gefunden.\nTippe `workflows` für die Liste.",
            parse_mode="Markdown",
        )
        return
    if target.get("active"):
        await msg.edit_text(f"ℹ️ `{target['name']}` ist bereits aktiv.", parse_mode="Markdown")
        return
    await api.activate_n8n_workflow(http_client, str(target["id"]))
    await msg.edit_text(f"✅ `{target['name']}` wurde *aktiviert*.", parse_mode="Markdown")


async def _deactivate_prompt(update: Update, name: str) -> None:
    msg = await loading(update, f"⏳ Suche Workflow `{name}`…")
    workflows = await api.get_n8n_workflows(http_client)
    target = _find_workflow(workflows, name)
    if not target:
        await msg.edit_text(
            f"❌ Workflow `{name}` nicht gefunden.\nTippe `workflows` für die Liste.",
            parse_mode="Markdown",
        )
        return
    kb = InlineKeyboardMarkup([[
        InlineKeyboardButton("✅ Ja, deaktivieren", callback_data=f"deactivate:{target['id']}:{target['name']}"),
        InlineKeyboardButton("❌ Abbrechen",         callback_data="cancel"),
    ]])
    await msg.edit_text(
        f"⚠️ *Bestätigung erforderlich*\n\n`{target['name']}` wirklich deaktivieren?",
        parse_mode="Markdown",
        reply_markup=kb,
    )


async def _trigger_workflow(update: Update, name: str) -> None:
    msg = await loading(update, f"⏳ Suche Workflow `{name}`…")
    workflows = await api.get_n8n_workflows(http_client)
    target = _find_workflow(workflows, name)
    if not target:
        await msg.edit_text(
            f"❌ Workflow `{name}` nicht gefunden.\nTippe `workflows` für die Liste.",
            parse_mode="Markdown",
        )
        return
    if not target.get("active"):
        await msg.edit_text(
            f"⚠️ `{target['name']}` ist deaktiviert.\n"
            f"Tippe `aktiviere {target['name']}` zum Aktivieren.",
            parse_mode="Markdown",
        )
        return
    result = await api.run_n8n_workflow(http_client, str(target["id"]))
    exec_id = result.get("executionId") or result.get("id") or ""
    suffix = f"\nExecution ID: `{exec_id}`" if exec_id else ""
    await msg.edit_text(f"🚀 `{target['name']}` wurde *gestartet*.{suffix}", parse_mode="Markdown")


# ─── Monitoring ───────────────────────────────────────────────────────────────

@require_auth
async def handle_monitoring(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Monitoring-Daten…")

    alerts, cpu_data, mem_data = await asyncio.gather(
        api.get_prometheus_alerts(http_client),
        api.query_prometheus(http_client, '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
        api.query_prometheus(http_client, '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100'),
        return_exceptions=True,
    )

    lines = ["*📊 System-Monitoring*\n"]

    # CPU
    if not isinstance(cpu_data, Exception):
        results = cpu_data.get("result", [])
        if results:
            val = float(results[0].get("value", [0, 0])[1])
            icon = "🔴" if val > 80 else "🟡" if val > 60 else "🟢"
            lines.append(f"*CPU-Auslastung:* {icon} {val:.1f}%")
    else:
        lines.append("*CPU:* ⚠️ Nicht abrufbar")

    # Memory
    if not isinstance(mem_data, Exception):
        results = mem_data.get("result", [])
        if results:
            val = float(results[0].get("value", [0, 0])[1])
            icon = "🔴" if val > 85 else "🟡" if val > 70 else "🟢"
            lines.append(f"*RAM-Auslastung:* {icon} {val:.1f}%")
    else:
        lines.append("*RAM:* ⚠️ Nicht abrufbar")

    # Alerts
    lines.append("")
    if isinstance(alerts, Exception):
        lines.append(f"*Prometheus:* ⚠️ Nicht erreichbar")
    elif not alerts:
        lines.append("*Prometheus Alerts:* ✅ Keine feuernden Alerts")
    else:
        lines.append(f"*🔴 Feuernde Alerts ({len(alerts)}):*")
        for a in alerts[:10]:
            name     = a.get("labels", {}).get("alertname", "?")
            severity = a.get("labels", {}).get("severity", "")
            summary  = a.get("annotations", {}).get("summary", "")
            line = f"• *{name}*"
            if severity:
                line += f" [{severity}]"
            if summary:
                line += f"\n  _{summary}_"
            lines.append(line)

    # AI interpretation for monitoring data
    user_id  = update.effective_user.id
    user_msg = update.message.text if update.message else "monitoring"
    cpu_val  = float(cpu_data.get("result", [{}])[0].get("value", [0, 0])[1]) if not isinstance(cpu_data, Exception) and cpu_data.get("result") else None
    mem_val  = float(mem_data.get("result", [{}])[0].get("value", [0, 0])[1]) if not isinstance(mem_data, Exception) and mem_data.get("result") else None
    data_ctx = {
        "cpu_percent": round(cpu_val, 1) if cpu_val is not None else "n/a",
        "ram_percent": round(mem_val, 1) if mem_val is not None else "n/a",
        "cpu_status": "kritisch" if cpu_val and cpu_val > 80 else "erhöht" if cpu_val and cpu_val > 60 else "normal",
        "ram_status": "kritisch" if mem_val and mem_val > 85 else "erhöht" if mem_val and mem_val > 70 else "normal",
        "alerts_firing": len(alerts) if not isinstance(alerts, Exception) else "n/a",
        "alerts": [{"name": a.get("labels", {}).get("alertname"), "severity": a.get("labels", {}).get("severity")} for a in (alerts[:5] if not isinstance(alerts, Exception) else [])],
    }
    ai_text = await ai_agent.generate_response(http_client, user_msg, data_ctx, memory, user_id)
    if ai_text:
        await msg.edit_text(truncate(ai_text), parse_mode="Markdown")
    else:
        await msg.edit_text(truncate("\n".join(lines)), parse_mode="Markdown")


# ─── Alerts ───────────────────────────────────────────────────────────────────

@require_auth
async def handle_alerts(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Alerts…")
    alerts = await api.get_prometheus_alerts(http_client)
    if not alerts:
        await msg.edit_text("✅ Keine feuernden Prometheus Alerts.")
        return
    lines = [f"*🔴 Feuernde Alerts ({len(alerts)}):*\n"]
    for a in alerts:
        name     = a.get("labels", {}).get("alertname", "?")
        severity = a.get("labels", {}).get("severity", "")
        summary  = a.get("annotations", {}).get("summary", "")
        lines.append(f"• *{name}*" + (f" [{severity}]" if severity else ""))
        if summary:
            lines.append(f"  _{summary}_")
    await msg.edit_text(truncate("\n".join(lines)), parse_mode="Markdown")


# ─── Activity ─────────────────────────────────────────────────────────────────

@require_auth
async def handle_activity(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Aktivitäten…")
    executions = await api.get_n8n_executions(http_client, limit=20)

    lines = [f"*Letzte Aktivitäten* ({len(executions[:10])} Einträge)\n"]
    for e in executions[:10]:
        name   = e.get("workflowData", {}).get("name") or e.get("workflow", {}).get("name") or "?"
        status = e.get("status", "?")
        icon   = "✅" if status == "success" else "❌" if status in ("error","failed") else "⏳"
        date   = fmt_date(e.get("startedAt") or e.get("createdAt"))
        lines.append(f"{icon} `{name}`\n   {date}")

    fallback = truncate("\n\n".join(lines))
    stats = api.calc_execution_stats(executions, hours=24)
    data_ctx = {
        "total_24h": stats["total"], "success_24h": stats["success"],
        "errors_24h": stats["errors"], "avg_runtime_s": stats["avg_runtime_s"],
        "recent_executions": [
            {"name": e.get("workflowData", {}).get("name") or "?", "status": e.get("status")}
            for e in executions[:5]
        ],
    }
    user_msg = update.message.text if update.message else "activity"
    user_id = update.effective_user.id
    ai_text = await ai_agent.generate_response(http_client, user_msg, data_ctx, memory, user_id)
    await msg.edit_text(truncate(ai_text) if ai_text else fallback, parse_mode="Markdown")


# ─── Logs ─────────────────────────────────────────────────────────────────────

@require_auth
async def handle_logs(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Fehler-Logs…")
    errors = await api.get_n8n_error_executions(http_client, days=7)

    if not errors:
        await msg.edit_text("✅ Keine Fehler-Executions in den letzten 7 Tagen.")
        return

    lines = [f"*❌ Fehler-Executions* (letzte 7 Tage, {len(errors)} gefunden)\n"]
    error_details = []
    for e in errors[:10]:
        name = e.get("workflowData", {}).get("name") or e.get("workflow", {}).get("name") or "?"
        date = fmt_date(e.get("startedAt") or e.get("createdAt"))
        err_msg = ""
        try:
            result_data = e.get("data", {}).get("resultData", {})
            run_data = result_data.get("runData", {})
            for node_runs in run_data.values():
                for run in node_runs:
                    err = run.get("error", {})
                    if err:
                        err_msg = err.get("message", "")[:80]
                        break
                if err_msg:
                    break
        except Exception:
            pass
        lines.append(f"❌ `{name}`\n   {date}" + (f"\n   _{err_msg}_" if err_msg else ""))
        error_details.append({"workflow": name, "error": err_msg or "unbekannt"})

    fallback = truncate("\n\n".join(lines))
    data_ctx = {"errors_count": len(errors), "errors": error_details[:5]}
    user_msg = update.message.text if update.message else "logs"
    user_id = update.effective_user.id
    ai_text = await ai_agent.generate_response(http_client, user_msg, data_ctx, memory, user_id)
    await msg.edit_text(truncate(ai_text) if ai_text else fallback, parse_mode="Markdown")


# ─── Deployments ──────────────────────────────────────────────────────────────

@require_auth
async def handle_deployments(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Deployment-Status…")
    apps = await api.get_coolify_applications(http_client)

    running = [a for a in apps if "running" in str(a.get("status", "")).lower()]
    stopped = [a for a in apps if "stopped" in str(a.get("status", "")).lower()]
    other   = [a for a in apps if a not in running and a not in stopped]

    lines = [f"*Coolify Deployments* ({len(apps)} gesamt)\n"]
    if running:
        lines.append(f"*Laufend ({len(running)}):*")
        for a in running:
            name   = a.get("name", "?")
            status = a.get("status", "?")
            fqdn   = a.get("fqdn", "")
            icon   = "🟢" if "healthy" in status else "🟡"
            lines.append(f"  {icon} `{name}`" + (f"\n     {fqdn}" if fqdn else ""))
    if stopped:
        lines.append(f"\n*Gestoppt ({len(stopped)}):*")
        for a in stopped:
            lines.append(f"  🔴 `{a.get('name','?')}`")
    if other:
        lines.append(f"\n*Sonstige ({len(other)}):*")
        for a in other:
            lines.append(f"  ⚪ `{a.get('name','?')}` — {a.get('status','?')}")

    fallback = truncate("\n".join(lines))
    data_ctx = {
        "total_services": len(apps),
        "running": len(running), "stopped": len(stopped),
        "services": [{"name": a.get("name"), "status": a.get("status")} for a in apps[:10]],
    }
    user_msg = update.message.text if update.message else "deployments"
    user_id = update.effective_user.id
    ai_text = await ai_agent.generate_response(http_client, user_msg, data_ctx, memory, user_id)
    await msg.edit_text(truncate(ai_text) if ai_text else fallback, parse_mode="Markdown")


# ─── Trends ───────────────────────────────────────────────────────────────────

@require_auth
async def handle_trends(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Trend-Daten…")
    rows = await api.get_nocodb_rows(http_client, api.TABLE_TRENDS, limit=5)

    if not rows:
        await msg.edit_text(
            "*Trends:* Noch keine Daten.\n_Workflow `11_TREND_MONITOR` läuft täglich um 07:00._",
            parse_mode="Markdown",
        )
        return

    lines = ["*Aktuelle Trends* (letzte 5):\n"]
    for i, r in enumerate(rows, 1):
        title = _get_field(r, "Title", "title", "Trend", "keyword", "Keyword")
        score = _get_field(r, "Score", "score", "Engagement", "engagement")
        date  = fmt_date(r.get("CreatedAt") or r.get("created_at"))
        lines.append(f"{i}. *{title}*\nScore: {score}  |  {date}")

    fallback = truncate("\n\n".join(lines))
    data_ctx = {"trends": [{"title": _get_field(r,"Title","title","Trend","keyword"), "score": _get_field(r,"Score","score","Engagement","engagement")} for r in rows]}
    user_msg = update.message.text if update.message else "trends"
    user_id = update.effective_user.id
    ai_text = await ai_agent.generate_response(http_client, user_msg, data_ctx, memory, user_id)
    await msg.edit_text(truncate(ai_text) if ai_text else fallback, parse_mode="Markdown")

    try:
        config = charts.build_trends_bar_chart(rows)
        png = await charts.fetch_chart_png(http_client, config)
        await update.effective_message.reply_photo(photo=io.BytesIO(png), caption="Trend-Scores")
    except Exception as e:
        logger.warning("Trends chart failed: %s", e)
        await update.effective_message.reply_text(f"_Chart konnte nicht geladen werden._", parse_mode="Markdown")


# ─── Sentiment ────────────────────────────────────────────────────────────────

@require_auth
async def handle_sentiment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Sentiment-Daten…")
    rows = await api.get_nocodb_rows(http_client, api.TABLE_SENTIMENT, limit=5)

    if not rows:
        await msg.edit_text(
            "*Sentiment:* Noch keine Daten.\n_Workflow `12_SENTIMENT_TRACKER` läuft alle 4h._",
            parse_mode="Markdown",
        )
        return

    ICONS = {"positive": "🟢", "neutral": "🟡", "negative": "🔴"}
    lines = ["*Sentiment-Analyse* (letzte 5):\n"]
    for i, r in enumerate(rows, 1):
        topic = _get_field(r, "topic", "Topic", "Title", "title")
        sent  = _get_field(r, "Sentiment", "sentiment", "Stimmung").lower()
        icon  = ICONS.get(sent, "⚪")
        date  = fmt_date(r.get("CreatedAt") or r.get("created_at"))
        lines.append(f"{i}. {icon} *{topic}*\n   {sent}  |  {date}")

    fallback = truncate("\n\n".join(lines))
    pos = sum(1 for r in rows if "positive" in _get_field(r,"Sentiment","sentiment","Stimmung","").lower())
    neg = sum(1 for r in rows if "negative" in _get_field(r,"Sentiment","sentiment","Stimmung","").lower())
    data_ctx = {
        "sentiment_summary": {"positive": pos, "neutral": len(rows)-pos-neg, "negative": neg},
        "topics": [{"topic": _get_field(r,"topic","Topic","Title","title"), "sentiment": _get_field(r,"Sentiment","sentiment","Stimmung")} for r in rows],
    }
    user_msg = update.message.text if update.message else "sentiment"
    user_id = update.effective_user.id
    ai_text = await ai_agent.generate_response(http_client, user_msg, data_ctx, memory, user_id)
    await msg.edit_text(truncate(ai_text) if ai_text else fallback, parse_mode="Markdown")

    try:
        config = charts.build_sentiment_pie_chart(rows)
        png = await charts.fetch_chart_png(http_client, config, width=400, height=350)
        await update.effective_message.reply_photo(photo=io.BytesIO(png), caption="Sentiment-Verteilung")
    except Exception as e:
        logger.warning("Sentiment chart failed: %s", e)


# ─── Content ──────────────────────────────────────────────────────────────────

@require_auth
async def handle_content(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Content Opportunities…")
    rows = await api.get_nocodb_rows(http_client, api.TABLE_CONTENT_OPP, limit=5)

    if not rows:
        await msg.edit_text("📭 Keine Content Opportunities gefunden.")
        return

    PRIO = {"high": "🔥 Hoch", "medium": "📋 Mittel", "low": "💡 Niedrig"}
    lines = ["*Content Opportunities* (letzte 5):\n"]
    for i, r in enumerate(rows, 1):
        title = _get_field(r, "title", "Title", "Content", "content")
        prio  = _get_field(r, "priority", "Priority", default="?").lower()
        date  = fmt_date(r.get("CreatedAt") or r.get("created_at"))
        lines.append(f"{i}. *{title}*\n   {PRIO.get(prio, prio)}  |  {date}")

    await msg.edit_text(truncate("\n\n".join(lines)), parse_mode="Markdown")


# ─── Analytics ────────────────────────────────────────────────────────────────

@require_auth
async def handle_analytics(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Analytics…")

    trends_count, sentiment_count, content_count, pipeline_count = await asyncio.gather(
        api.count_nocodb_rows(http_client, api.TABLE_TRENDS),
        api.count_nocodb_rows(http_client, api.TABLE_SENTIMENT),
        api.count_nocodb_rows(http_client, api.TABLE_CONTENT_OPP),
        api.count_nocodb_rows(http_client, api.TABLE_CONTENT_PIPELINE),
        return_exceptions=True,
    )

    def _fmt(val):
        return str(val) if not isinstance(val, Exception) else "⚠️"

    lines = [
        "*📈 Research Analytics — Übersicht*\n",
        f"• *Trends:* {_fmt(trends_count)} Einträge",
        f"• *Sentiment:* {_fmt(sentiment_count)} Einträge",
        f"• *Content Opportunities:* {_fmt(content_count)} Einträge",
        f"• *Content Pipeline:* {_fmt(pipeline_count)} Einträge",
        "",
        "_Detailansicht: `trends`, `sentiment`, `content`_",
        f"_NocoDB: {api.NOCODB_BASE_URL}_",
    ]
    fallback = "\n".join(lines)
    data_ctx = {
        "trends_count": trends_count if not isinstance(trends_count, Exception) else "n/a",
        "sentiment_count": sentiment_count if not isinstance(sentiment_count, Exception) else "n/a",
        "content_opportunities": content_count if not isinstance(content_count, Exception) else "n/a",
        "content_pipeline": pipeline_count if not isinstance(pipeline_count, Exception) else "n/a",
    }
    user_msg = update.message.text if update.message else "analytics"
    user_id = update.effective_user.id
    ai_text = await ai_agent.generate_response(http_client, user_msg, data_ctx, memory, user_id)
    await msg.edit_text(truncate(ai_text) if ai_text else fallback, parse_mode="Markdown")


# ─── Content Factory ──────────────────────────────────────────────────────────

@require_auth
async def handle_content_factory(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Content Pipeline…")
    rows = await api.get_nocodb_rows(http_client, api.TABLE_CONTENT_PIPELINE, limit=5)

    if not rows:
        await msg.edit_text("📭 Keine Einträge in der Content Pipeline.")
        return

    lines = ["*🏭 Content Factory — Pipeline* (letzte 5):\n"]
    for i, r in enumerate(rows, 1):
        title  = _get_field(r, "title", "Title", "Name", "name")
        status = _get_field(r, "status", "Status", default="?")
        date   = fmt_date(r.get("CreatedAt") or r.get("created_at"))
        lines.append(f"{i}. *{title}*\n   Status: {status}  |  {date}")

    await msg.edit_text(truncate("\n\n".join(lines)), parse_mode="Markdown")


# ─── Agents ───────────────────────────────────────────────────────────────────

@require_auth
async def handle_agents(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Agenten…")

    # Try agents table (may be empty per CLAUDE.md)
    try:
        rows = await api.get_nocodb_rows(http_client, "agents", limit=10)
    except Exception:
        rows = []

    if not rows:
        await msg.edit_text(
            "*🤖 Agenten*\n\nNoch keine Agenten konfiguriert.\n"
            "_Die `agents`-Tabelle ist leer. Aktiviere `52_AIOS_DISCOVERY` um sie zu befüllen._",
            parse_mode="Markdown",
        )
        return

    lines = [f"*🤖 Agenten* ({len(rows)} konfiguriert):\n"]
    for i, r in enumerate(rows, 1):
        name = _get_field(r, "name", "Name", "title", "Title")
        desc = _get_field(r, "description", "Description", default="")
        lines.append(f"{i}. *{name}*" + (f"\n   _{desc[:80]}_" if desc and desc != "?" else ""))

    await msg.edit_text(truncate("\n\n".join(lines)), parse_mode="Markdown")


# ─── Knowledge ────────────────────────────────────────────────────────────────

@require_auth
async def handle_knowledge(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade Knowledge Base…")
    rows = await api.get_nocodb_rows(http_client, api.TABLE_PROMPTS, limit=5)

    if not rows:
        await msg.edit_text("📭 Keine Einträge in der Knowledge Base / Prompt-Bibliothek.")
        return

    lines = ["*📚 Knowledge Base* (Top 5 Prompts):\n"]
    for i, r in enumerate(rows, 1):
        title = _get_field(r, "title", "Title", "name", "Name")
        cat   = _get_field(r, "category", "Category", "type", "Type", default="")
        lines.append(f"{i}. *{title}*" + (f" [{cat}]" if cat and cat != "?" else ""))

    await msg.edit_text(truncate("\n".join(lines)), parse_mode="Markdown")


# ─── MCP Services ─────────────────────────────────────────────────────────────

@require_auth
async def handle_mcp_services(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = await loading(update, "⏳ Lade MCP Services…")
    apps = await api.get_coolify_applications(http_client)

    mcp_apps = [a for a in apps if "mcp" in str(a.get("name", "")).lower()]

    if not mcp_apps:
        await msg.edit_text("📭 Keine MCP Services gefunden.")
        return

    lines = [f"*🔧 MCP Services* ({len(mcp_apps)} konfiguriert):\n"]
    for a in mcp_apps:
        name   = a.get("name", "?")
        status = a.get("status", "?")
        fqdn   = a.get("fqdn", "")
        icon   = "🟢" if "running" in status.lower() else "🔴" if "stopped" in status.lower() else "🟡"
        health = "healthy" if "healthy" in status.lower() else ""
        lines.append(f"{icon} `{name}`" + (f" _{health}_" if health else "") + (f"\n   {fqdn}" if fqdn else ""))

    await msg.edit_text(truncate("\n".join(lines)), parse_mode="Markdown")


# ─── Dashboard-only features ──────────────────────────────────────────────────

async def _dashboard_only(update: Update, feature: str, emoji: str) -> None:
    await update.effective_message.reply_text(
        f"{emoji} *{feature}*\n\n"
        f"Diese Funktion ist im Admin-Dashboard verfügbar:\n"
        f"{DASHBOARD_URL}",
        parse_mode="Markdown",
    )


@require_auth
async def handle_kanban(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _dashboard_only(update, "Kanban Board", "📌")


@require_auth
async def handle_templates(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _dashboard_only(update, "Templates", "📄")


@require_auth
async def handle_files(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _dashboard_only(update, "Datei-Manager", "📁")


@require_auth
async def handle_databases(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _dashboard_only(update, "Datenbanken", "🗄️")


@require_auth
async def handle_settings(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _dashboard_only(update, "Einstellungen", "⚙️")


@require_auth
async def handle_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(HELP_TEXT, parse_mode="Markdown")


# ─── Callback handler (InlineKeyboard) ───────────────────────────────────────

@require_auth
async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()  # ACK immediately — prevents Telegram loading spinner

    data = query.data or ""

    if data == "cancel":
        await query.edit_message_text("❌ Abgebrochen.")
        return

    if data.startswith("deactivate:"):
        parts = data.split(":", 2)
        wf_id   = parts[1] if len(parts) > 1 else ""
        wf_name = parts[2] if len(parts) > 2 else wf_id
        try:
            await api.deactivate_n8n_workflow(http_client, wf_id)
            await query.edit_message_text(
                f"⏸ `{wf_name}` wurde *deaktiviert*.", parse_mode="Markdown"
            )
        except Exception as e:
            await query.edit_message_text(f"❌ Fehler beim Deaktivieren: {e}")
        return

    await query.edit_message_text("❓ Unbekannte Aktion.")


# ─── Universal text handler ───────────────────────────────────────────────────

INTENT_HANDLERS = {
    "STATUS_OVERVIEW":  handle_status,
    "LIST_WORKFLOWS":   handle_workflows,
    "MONITORING":       handle_monitoring,
    "ALERTS":           handle_alerts,
    "ACTIVITY":         handle_activity,
    "LOGS":             handle_logs,
    "DEPLOYMENTS":      handle_deployments,
    "NOCODB_TRENDS":    handle_trends,
    "NOCODB_SENTIMENT": handle_sentiment,
    "ANALYTICS":        handle_analytics,
    "CONTENT_FACTORY":  handle_content_factory,
    "AGENTS":           handle_agents,
    "KNOWLEDGE":        handle_knowledge,
    "MCP_SERVICES":     handle_mcp_services,
    "KANBAN":           handle_kanban,
    "TEMPLATES":        handle_templates,
    "FILES":            handle_files,
    "DATABASES":        handle_databases,
    "SETTINGS":         handle_settings,
    "HELP":             handle_help,
}


@require_auth
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text or ""
    user_id = update.effective_user.id
    intent = await classify(http_client, text)
    logger.info("Message: %r → intent: %s (workflow: %s)", text[:60], intent.name, intent.workflow_name)

    if intent.name == "ACTIVATE_WORKFLOW" and intent.workflow_name:
        await _activate_workflow(update, intent.workflow_name)
        return
    if intent.name == "DEACTIVATE_WORKFLOW" and intent.workflow_name:
        await _deactivate_prompt(update, intent.workflow_name)
        return
    if intent.name == "TRIGGER_WORKFLOW" and intent.workflow_name:
        await _trigger_workflow(update, intent.workflow_name)
        return

    # For HELP intent with natural language (not a direct /hilfe command):
    # Ask a clarifying question if the message looks like a real question
    if intent.name == "HELP" and len(text) > 10 and not text.lower().startswith(("hilfe", "help", "/", "was kann")):
        clarification = await ai_agent.ask_clarification(http_client, text, memory, user_id)
        if clarification:
            await update.message.reply_text(clarification, parse_mode="Markdown")
            return

    handler = INTENT_HANDLERS.get(intent.name, handle_help)
    await handler(update, context)


# ─── Application lifecycle ────────────────────────────────────────────────────

async def post_init(application: Application) -> None:
    global http_client
    http_client = httpx.AsyncClient(timeout=httpx.Timeout(12.0))
    logger.info("HTTP client initialized")


async def post_shutdown(application: Application) -> None:
    if http_client:
        await http_client.aclose()
        logger.info("HTTP client closed")


# ─── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    app = (
        Application.builder()
        .token(BOT_TOKEN)
        .post_init(post_init)
        .post_shutdown(post_shutdown)
        .build()
    )

    # Slash commands
    app.add_handler(CommandHandler(["start", "hilfe", "help"], handle_help))
    app.add_handler(CommandHandler("status",      handle_status))
    app.add_handler(CommandHandler("workflows",   handle_workflows))
    app.add_handler(CommandHandler("monitoring",  handle_monitoring))
    app.add_handler(CommandHandler("alerts",      handle_alerts))
    app.add_handler(CommandHandler("activity",    handle_activity))
    app.add_handler(CommandHandler("logs",        handle_logs))
    app.add_handler(CommandHandler("deployments", handle_deployments))
    app.add_handler(CommandHandler("trends",      handle_trends))
    app.add_handler(CommandHandler("sentiment",   handle_sentiment))
    app.add_handler(CommandHandler("content",     handle_content))
    app.add_handler(CommandHandler("analytics",   handle_analytics))
    app.add_handler(CommandHandler("agents",      handle_agents))
    app.add_handler(CommandHandler("knowledge",   handle_knowledge))
    app.add_handler(CommandHandler("mcp",         handle_mcp_services))
    app.add_handler(CommandHandler("kanban",      handle_kanban))
    app.add_handler(CommandHandler("templates",   handle_templates))
    app.add_handler(CommandHandler("files",       handle_files))
    app.add_handler(CommandHandler("databases",   handle_databases))
    app.add_handler(CommandHandler("settings",    handle_settings))

    # Inline keyboard callbacks
    app.add_handler(CallbackQueryHandler(handle_callback))

    # All text messages (no slash prefix) → intent classifier
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("AIOS Control Bot startet (Polling)…")
    logger.info("Allowed user ID: %s", ALLOWED_USER_ID)
    app.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,  # Discard backlog from while bot was offline
    )


if __name__ == "__main__":
    main()
