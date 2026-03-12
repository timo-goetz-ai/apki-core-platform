"""Zentral-Agent: Koordiniert alle Abteilungs-Agenten."""
from __future__ import annotations

from typing import Any

from agents.base import AgentResult, BaseAgent


DEPARTMENT_KEYWORDS: dict[str, list[str]] = {
    "hr": ["bewerbung", "urlaub", "gehalt", "kündigung", "onboarding", "mitarbeiter", "personal"],
    "sales": ["angebot", "lead", "kunde", "vertrieb", "auftrag", "deal", "akquisition"],
    "finance": ["rechnung", "zahlung", "budget", "kosten", "abrechnung", "steuer", "finanzen"],
    "ops": ["lager", "bestand", "lieferant", "logistik", "lieferung", "inventar"],
    "it": ["ticket", "fehler", "passwort", "system", "zugang", "software", "hardware"],
    "customer_service": ["anfrage", "beschwerde", "rückgabe", "feedback", "support"],
    "engineering": ["bug", "feature", "deploy", "code", "pull request", "release"],
}


class CentralAgent(BaseAgent):
    """Orchestriert alle Abteilungs-Agenten und klassifiziert eingehende Aufgaben."""

    def __init__(self) -> None:
        super().__init__("CentralAgent")
        self._department_agents: dict[str, BaseAgent] = {}

    def register_agent(self, department: str, agent: BaseAgent) -> None:
        """Registriert einen Abteilungs-Agenten."""
        self._department_agents[department] = agent
        self.logger.info("Agent registriert: %s → %s", department, agent.name)

    def classify(self, text: str) -> str:
        """Klassifiziert eine Anfrage und bestimmt die zuständige Abteilung."""
        lowered = text.lower()
        for department, keywords in DEPARTMENT_KEYWORDS.items():
            if any(kw in lowered for kw in keywords):
                return department
        return "general"

    def _execute(self, task: dict[str, Any]) -> AgentResult:
        text = task.get("text", "")
        department = task.get("department") or self.classify(text)
        self.logger.info("Aufgabe klassifiziert als: %s", department)

        agent = self._department_agents.get(department)
        if agent is None:
            return AgentResult(
                success=False,
                message=f"Kein Agent für Abteilung '{department}' registriert.",
                escalation_required=True,
            )
        return agent.run(task)
