"""Tests für die MCP-Server-Konfiguration."""
import os

import pytest

from mcp_servers.config import (
    CalendarMCPConfig,
    DatabaseMCPConfig,
    EmailMCPConfig,
    PaymentMCPConfig,
)


class TestDatabaseMCPConfig:
    def test_defaults(self, monkeypatch):
        monkeypatch.delenv("DB_HOST", raising=False)
        monkeypatch.delenv("DB_PORT", raising=False)
        cfg = DatabaseMCPConfig.from_env()
        assert cfg.host == "localhost"
        assert cfg.port == 5432
        assert cfg.ssl is True

    def test_from_env(self, monkeypatch):
        monkeypatch.setenv("DB_HOST", "db.example.com")
        monkeypatch.setenv("DB_PORT", "5433")
        monkeypatch.setenv("DB_NAME", "mydb")
        monkeypatch.setenv("DB_USER", "user")
        monkeypatch.setenv("DB_PASSWORD", "secret")
        monkeypatch.setenv("DB_SSL", "false")
        cfg = DatabaseMCPConfig.from_env()
        assert cfg.host == "db.example.com"
        assert cfg.port == 5433
        assert cfg.database == "mydb"
        assert cfg.ssl is False


class TestEmailMCPConfig:
    def test_defaults(self, monkeypatch):
        monkeypatch.delenv("EMAIL_PORT_IMAP", raising=False)
        monkeypatch.delenv("EMAIL_PORT_SMTP", raising=False)
        cfg = EmailMCPConfig.from_env()
        assert cfg.port_imap == 993
        assert cfg.port_smtp == 587


class TestCalendarMCPConfig:
    def test_default_timezone(self, monkeypatch):
        monkeypatch.delenv("CALENDAR_TIMEZONE", raising=False)
        cfg = CalendarMCPConfig.from_env()
        assert cfg.timezone == "Europe/Berlin"

    def test_custom_timezone(self, monkeypatch):
        monkeypatch.setenv("CALENDAR_TIMEZONE", "UTC")
        cfg = CalendarMCPConfig.from_env()
        assert cfg.timezone == "UTC"


class TestPaymentMCPConfig:
    def test_default_limit(self, monkeypatch):
        monkeypatch.delenv("PAYMENT_AUTO_APPROVE_LIMIT", raising=False)
        cfg = PaymentMCPConfig.from_env()
        assert cfg.auto_approve_limit == 500.0

    def test_custom_limit(self, monkeypatch):
        monkeypatch.setenv("PAYMENT_AUTO_APPROVE_LIMIT", "1000.0")
        cfg = PaymentMCPConfig.from_env()
        assert cfg.auto_approve_limit == 1000.0

    def test_invalid_limit_raises(self, monkeypatch):
        monkeypatch.setenv("PAYMENT_AUTO_APPROVE_LIMIT", "not_a_number")
        with pytest.raises(ValueError, match="PAYMENT_AUTO_APPROVE_LIMIT"):
            PaymentMCPConfig.from_env()

    def test_sandbox_default(self, monkeypatch):
        monkeypatch.delenv("PAYMENT_SANDBOX", raising=False)
        cfg = PaymentMCPConfig.from_env()
        assert cfg.sandbox_mode is True
