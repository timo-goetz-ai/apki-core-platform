"""Finance-Agent: Rechnungsverarbeitung, Reporting, Budgetplanung."""
from __future__ import annotations

from typing import Any

from agents.base import AgentResult, BaseAgent


class FinanceAgent(BaseAgent):
    """Automatisiert Finanzprozesse wie Rechnungsverarbeitung und Reporting."""

    AUTO_APPROVE_LIMIT = 500.0

    def __init__(self) -> None:
        super().__init__("FinanceAgent")

    def _execute(self, task: dict[str, Any]) -> AgentResult:
        task_type = task.get("type", "")

        if task_type == "invoice_processing":
            return self._process_invoice(task)
        if task_type == "budget_check":
            return self._check_budget(task)
        if task_type == "report_generation":
            return self._generate_report(task)
        if task_type == "expense_approval":
            return self._approve_expense(task)

        return AgentResult(
            success=False,
            message=f"Unbekannter Finance-Task-Typ: '{task_type}'",
            escalation_required=True,
        )

    def _process_invoice(self, task: dict[str, Any]) -> AgentResult:
        """Verarbeitet eine eingehende Rechnung."""
        invoice_id = task.get("invoice_id", "")
        amount = float(task.get("amount", 0))
        self.logger.info("Rechnungsverarbeitung: %s (%.2f €)", invoice_id, amount)

        needs_approval = amount > self.AUTO_APPROVE_LIMIT
        return AgentResult(
            success=True,
            data={"invoice_id": invoice_id, "amount": amount, "needs_approval": needs_approval},
            message=(
                f"Rechnung {invoice_id} über {amount:.2f} € "
                + ("erfordert manuelle Genehmigung." if needs_approval else "automatisch genehmigt.")
            ),
            escalation_required=needs_approval,
        )

    def _check_budget(self, task: dict[str, Any]) -> AgentResult:
        """Prüft die Budgetverfügbarkeit für eine Kostenstelle."""
        cost_center = task.get("cost_center", "")
        amount = float(task.get("amount", 0))
        self.logger.info("Budget-Prüfung: Kostenstelle %s (%.2f €)", cost_center, amount)
        return AgentResult(
            success=True,
            data={"cost_center": cost_center, "available": True},
            message=f"Budget für Kostenstelle {cost_center} ist verfügbar.",
        )

    def _generate_report(self, task: dict[str, Any]) -> AgentResult:
        """Generiert einen Finanzbericht."""
        period = task.get("period", "aktueller Monat")
        self.logger.info("Berichterstellung: %s", period)
        return AgentResult(
            success=True,
            data={"template": "monatsbericht.md", "period": period},
            message=f"Monatsbericht für {period} erstellt.",
        )

    def _approve_expense(self, task: dict[str, Any]) -> AgentResult:
        """Genehmigt oder eskaliert Ausgaben gemäß Genehmigungsrichtlinie."""
        amount = float(task.get("amount", 0))
        requester = task.get("requester", "Unbekannt")
        self.logger.info("Ausgabenprüfung: %s (%.2f €)", requester, amount)

        if amount <= self.AUTO_APPROVE_LIMIT:
            return AgentResult(
                success=True,
                data={"approved": True, "amount": amount},
                message=f"Ausgabe von {amount:.2f} € für {requester} automatisch genehmigt.",
            )
        return AgentResult(
            success=True,
            data={"approved": False, "amount": amount},
            message=f"Ausgabe von {amount:.2f} € erfordert manuelle Genehmigung.",
            escalation_required=True,
        )
