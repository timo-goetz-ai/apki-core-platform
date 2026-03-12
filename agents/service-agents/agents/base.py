"""Basis-Klasse für alle Agenten."""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentResult:
    """Ergebnis einer Agenten-Ausführung."""

    success: bool
    data: Any = None
    message: str = ""
    escalation_required: bool = False


class BaseAgent(ABC):
    """Abstrakte Basisklasse für alle Abteilungs-Agenten."""

    CONFIDENCE_THRESHOLD = 0.70

    def __init__(self, name: str) -> None:
        self.name = name
        self.logger = logging.getLogger(self.__class__.__name__)

    def run(self, task: dict[str, Any]) -> AgentResult:
        """Führt eine Aufgabe aus und gibt ein strukturiertes Ergebnis zurück."""
        self.logger.info("[%s] Aufgabe gestartet: %s", self.name, task.get("type", "unbekannt"))
        try:
            result = self._execute(task)
            if result.escalation_required:
                self.logger.warning("[%s] Eskalation erforderlich: %s", self.name, result.message)
            return result
        except (KeyboardInterrupt, SystemExit):
            raise
        except Exception as exc:  # noqa: BLE001
            self.logger.error("[%s] Fehler bei Aufgabe: %s", self.name, exc)
            return AgentResult(success=False, message=str(exc), escalation_required=True)

    @abstractmethod
    def _execute(self, task: dict[str, Any]) -> AgentResult:
        """Abteilungsspezifische Implementierung der Aufgabenausführung."""
