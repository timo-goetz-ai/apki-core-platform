"""MCP-Server-Konfiguration aus Umgebungsvariablen."""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class DatabaseMCPConfig:
    """Konfiguration für den Database-MCP-Server."""

    host: str
    port: int
    database: str
    user: str
    password: str
    ssl: bool = True
    pool_size: int = 10
    query_timeout: int = 30

    @classmethod
    def from_env(cls) -> "DatabaseMCPConfig":
        return cls(
            host=os.environ.get("DB_HOST", "localhost"),
            port=int(os.environ.get("DB_PORT", "5432")),
            database=os.environ.get("DB_NAME", ""),
            user=os.environ.get("DB_USER", ""),
            password=os.environ.get("DB_PASSWORD", ""),
            ssl=os.environ.get("DB_SSL", "true").lower() == "true",
        )


@dataclass
class EmailMCPConfig:
    """Konfiguration für den Email-MCP-Server."""

    imap_host: str
    smtp_host: str
    port_imap: int
    port_smtp: int
    user: str
    password: str
    check_interval: int = 60

    @classmethod
    def from_env(cls) -> "EmailMCPConfig":
        return cls(
            imap_host=os.environ.get("EMAIL_IMAP_HOST", ""),
            smtp_host=os.environ.get("EMAIL_SMTP_HOST", ""),
            port_imap=int(os.environ.get("EMAIL_PORT_IMAP", "993")),
            port_smtp=int(os.environ.get("EMAIL_PORT_SMTP", "587")),
            user=os.environ.get("EMAIL_USER", ""),
            password=os.environ.get("EMAIL_PASSWORD", ""),
        )


@dataclass
class CalendarMCPConfig:
    """Konfiguration für den Calendar-MCP-Server."""

    provider: str
    api_key: str
    timezone: str = "Europe/Berlin"
    working_hours_start: str = "08:00"
    working_hours_end: str = "18:00"
    buffer_minutes: int = 15

    @classmethod
    def from_env(cls) -> "CalendarMCPConfig":
        return cls(
            provider=os.environ.get("CALENDAR_PROVIDER", ""),
            api_key=os.environ.get("CALENDAR_API_KEY", ""),
            timezone=os.environ.get("CALENDAR_TIMEZONE", "Europe/Berlin"),
        )


@dataclass
class PaymentMCPConfig:
    """Konfiguration für den Payment-MCP-Server."""

    provider: str
    api_key: str
    auto_approve_limit: float = 500.0
    currency: str = "EUR"
    sandbox_mode: bool = True

    @classmethod
    def from_env(cls) -> "PaymentMCPConfig":
        raw_limit = os.environ.get("PAYMENT_AUTO_APPROVE_LIMIT", "500.0")
        try:
            auto_approve_limit = float(raw_limit)
        except ValueError as exc:
            raise ValueError(
                f"Ungültiger Wert für PAYMENT_AUTO_APPROVE_LIMIT: '{raw_limit}' (erwartet: Dezimalzahl)"
            ) from exc
        return cls(
            provider=os.environ.get("PAYMENT_PROVIDER", ""),
            api_key=os.environ.get("PAYMENT_API_KEY", ""),
            auto_approve_limit=auto_approve_limit,
            sandbox_mode=os.environ.get("PAYMENT_SANDBOX", "true").lower() == "true",
        )
