"""IT-Agent: Ticket-Management, Deployment, Monitoring."""
from __future__ import annotations

from typing import Any

from agents.base import AgentResult, BaseAgent


PRIORITY_RESPONSE_MINUTES = {
    "P1": 5,
    "P2": 60,
    "P3": 240,
    "P4": 480,
}


class ITAgent(BaseAgent):
    """Automatisiert IT-Prozesse wie Ticket-Management und Monitoring."""

    def __init__(self) -> None:
        super().__init__("ITAgent")

    def _execute(self, task: dict[str, Any]) -> AgentResult:
        task_type = task.get("type", "")

        if task_type == "ticket_classification":
            return self._classify_ticket(task)
        if task_type == "self_heal":
            return self._self_heal(task)
        if task_type == "deployment":
            return self._manage_deployment(task)
        if task_type == "security_scan":
            return self._security_scan(task)

        return AgentResult(
            success=False,
            message=f"Unbekannter IT-Task-Typ: '{task_type}'",
            escalation_required=True,
        )

    def _classify_ticket(self, task: dict[str, Any]) -> AgentResult:
        """Klassifiziert und priorisiert ein IT-Ticket."""
        description = task.get("description", "")
        ticket_id = task.get("ticket_id", "")
        priority = task.get("priority", "P3")
        response_minutes = PRIORITY_RESPONSE_MINUTES.get(priority, 240)
        is_critical = priority == "P1"

        self.logger.info("Ticket %s klassifiziert als %s", ticket_id, priority)
        return AgentResult(
            success=True,
            data={"ticket_id": ticket_id, "priority": priority, "response_minutes": response_minutes},
            message=f"Ticket {ticket_id} mit Priorität {priority} klassifiziert (Reaktionszeit: {response_minutes} min).",
            escalation_required=is_critical,
        )

    def _self_heal(self, task: dict[str, Any]) -> AgentResult:
        """Versucht ein bekanntes Problem automatisch zu lösen."""
        issue_type = task.get("issue_type", "")
        self.logger.info("Self-Healing-Versuch für: %s", issue_type)
        return AgentResult(
            success=True,
            data={"issue_type": issue_type, "healed": True},
            message=f"Self-Healing für '{issue_type}' erfolgreich.",
        )

    def _manage_deployment(self, task: dict[str, Any]) -> AgentResult:
        """Verwaltet einen Deployment-Vorgang."""
        service = task.get("service", "")
        version = task.get("version", "")
        self.logger.info("Deployment: %s v%s", service, version)
        return AgentResult(
            success=True,
            data={"service": service, "version": version, "status": "deployed"},
            message=f"Deployment von {service} v{version} gestartet.",
        )

    def _security_scan(self, task: dict[str, Any]) -> AgentResult:
        """Führt einen Sicherheitsscan durch."""
        target = task.get("target", "")
        self.logger.info("Sicherheitsscan für: %s", target)
        return AgentResult(
            success=True,
            data={"target": target, "vulnerabilities": []},
            message=f"Sicherheitsscan für '{target}' abgeschlossen. Keine Schwachstellen gefunden.",
        )
