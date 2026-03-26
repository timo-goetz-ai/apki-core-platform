"""QuickChart.io chart generation helpers."""
from __future__ import annotations

import json
import urllib.parse

import httpx

QUICKCHART_BASE = "https://quickchart.io/chart"


async def fetch_chart_png(
    client: httpx.AsyncClient,
    chart_config: dict,
    width: int = 600,
    height: int = 400,
) -> bytes:
    """Fetch a chart as PNG bytes from QuickChart.io.

    Raises RuntimeError on HTTP error or empty response.
    """
    encoded = urllib.parse.quote(json.dumps(chart_config))
    url = f"{QUICKCHART_BASE}?c={encoded}&w={width}&h={height}&bkg=white"
    r = await client.get(url, timeout=httpx.Timeout(20.0))
    r.raise_for_status()
    if not r.content:
        raise RuntimeError("QuickChart returned empty PNG")
    return r.content


def build_trends_bar_chart(rows: list[dict]) -> dict:
    """Horizontal bar chart of trend scores (last 5 entries)."""
    rows = rows[:10]  # safety cap for URL length
    labels = []
    scores = []
    for r in rows:
        label = (
            r.get("Title") or r.get("title") or r.get("Trend") or
            r.get("keyword") or r.get("Keyword") or "?"
        )
        labels.append(str(label)[:25])
        raw_score = (
            r.get("Score") or r.get("score") or r.get("Engagement") or
            r.get("engagement") or 0
        )
        try:
            scores.append(float(raw_score))
        except (TypeError, ValueError):
            scores.append(0.0)

    return {
        "type": "horizontalBar",
        "data": {
            "labels": labels,
            "datasets": [{
                "label": "Score",
                "data": scores,
                "backgroundColor": "rgba(59,130,246,0.8)",
                "borderColor": "rgba(59,130,246,1)",
                "borderWidth": 1,
            }],
        },
        "options": {
            "title": {"display": True, "text": "Aktuelle Trends", "fontSize": 16},
            "legend": {"display": False},
            "scales": {"xAxes": [{"ticks": {"beginAtZero": True}}]},
        },
    }


def build_sentiment_pie_chart(rows: list[dict]) -> dict:
    """Doughnut chart showing positive / neutral / negative sentiment distribution."""
    counts = {"positive": 0, "neutral": 0, "negative": 0}
    for r in rows:
        s = (
            r.get("Sentiment") or r.get("sentiment") or
            r.get("Stimmung") or "neutral"
        ).lower()
        if s in counts:
            counts[s] += 1
        else:
            counts["neutral"] += 1

    return {
        "type": "doughnut",
        "data": {
            "labels": ["Positiv", "Neutral", "Negativ"],
            "datasets": [{
                "data": [counts["positive"], counts["neutral"], counts["negative"]],
                "backgroundColor": ["#22c55e", "#f59e0b", "#ef4444"],
                "borderWidth": 2,
            }],
        },
        "options": {
            "title": {"display": True, "text": "Sentiment-Verteilung", "fontSize": 16},
            "plugins": {
                "datalabels": {"display": True, "formatter": "value"},
            },
        },
    }


def build_workflow_status_chart(active: int, paused: int) -> dict:
    """Pie chart for workflow active/paused ratio."""
    return {
        "type": "pie",
        "data": {
            "labels": ["Aktiv", "Pausiert"],
            "datasets": [{
                "data": [active, paused],
                "backgroundColor": ["#22c55e", "#94a3b8"],
            }],
        },
        "options": {
            "title": {"display": True, "text": f"Workflows ({active+paused} gesamt)", "fontSize": 16},
        },
    }


def build_execution_stats_chart(success: int, errors: int, other: int) -> dict:
    """Bar chart for 24h execution results."""
    return {
        "type": "bar",
        "data": {
            "labels": ["Erfolg", "Fehler", "Sonstige"],
            "datasets": [{
                "label": "Ausführungen (24h)",
                "data": [success, errors, other],
                "backgroundColor": ["#22c55e", "#ef4444", "#94a3b8"],
            }],
        },
        "options": {
            "title": {"display": True, "text": "n8n Ausführungen (letzte 24h)", "fontSize": 16},
            "legend": {"display": False},
            "scales": {"yAxes": [{"ticks": {"beginAtZero": True}}]},
        },
    }
