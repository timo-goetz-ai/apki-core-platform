"""Tests für alle Abteilungs-Agenten."""
import pytest

from agents.central import CentralAgent
from agents.customer_service import CustomerServiceAgent
from agents.engineering import EngineeringAgent
from agents.finance import FinanceAgent
from agents.hr import HRAgent
from agents.it import ITAgent
from agents.ops import OpsAgent
from agents.sales import SalesAgent


# ---------------------------------------------------------------------------
# CentralAgent
# ---------------------------------------------------------------------------

class TestCentralAgent:
    def setup_method(self):
        self.central = CentralAgent()

    def test_classify_hr(self):
        assert self.central.classify("Neue Bewerbung eingegangen") == "hr"

    def test_classify_sales(self):
        assert self.central.classify("Neues Angebot für Kunden erstellen") == "sales"

    def test_classify_finance(self):
        assert self.central.classify("Rechnung muss geprüft werden") == "finance"

    def test_classify_ops(self):
        assert self.central.classify("Lager ist fast leer") == "ops"

    def test_classify_it(self):
        assert self.central.classify("Ticket wegen Fehler im System") == "it"

    def test_classify_customer_service(self):
        assert self.central.classify("Beschwerde eingegangen") == "customer_service"

    def test_classify_engineering(self):
        assert self.central.classify("Bug im Code gefunden") == "engineering"

    def test_classify_general_fallback(self):
        assert self.central.classify("Unbekannte Nachricht xyz") == "general"

    def test_route_to_registered_agent(self):
        self.central.register_agent("hr", HRAgent())
        result = self.central.run({"type": "vacation_request", "department": "hr", "employee_name": "Max", "days": 5})
        assert result.success is True

    def test_missing_agent_returns_failure(self):
        result = self.central.run({"department": "missing"})
        assert result.success is False
        assert result.escalation_required is True


# ---------------------------------------------------------------------------
# HRAgent
# ---------------------------------------------------------------------------

class TestHRAgent:
    def setup_method(self):
        self.agent = HRAgent()

    def test_cv_analysis(self):
        result = self.agent.run({"type": "cv_analysis", "candidate_name": "Lisa"})
        assert result.success is True
        assert "Lisa" in result.message

    def test_onboarding(self):
        result = self.agent.run({"type": "onboarding", "employee_name": "Tom"})
        assert result.success is True
        assert "Tom" in result.message

    def test_vacation_request(self):
        result = self.agent.run({"type": "vacation_request", "employee_name": "Sara", "days": 10})
        assert result.success is True
        assert "10" in result.message

    def test_compliance_check(self):
        result = self.agent.run({"type": "compliance_check"})
        assert result.success is True
        assert result.data["compliant"] is True

    def test_unknown_task(self):
        result = self.agent.run({"type": "unknown"})
        assert result.success is False
        assert result.escalation_required is True


# ---------------------------------------------------------------------------
# SalesAgent
# ---------------------------------------------------------------------------

class TestSalesAgent:
    def setup_method(self):
        self.agent = SalesAgent()

    def test_lead_analysis_high(self):
        result = self.agent.run({"type": "lead_analysis", "lead_name": "Firma X", "initial_score": 80})
        assert result.success is True
        assert result.data["priority"] == "hoch"

    def test_lead_analysis_medium(self):
        result = self.agent.run({"type": "lead_analysis", "lead_name": "Firma Y", "initial_score": 50})
        assert result.success is True
        assert result.data["priority"] == "mittel"

    def test_lead_analysis_low(self):
        result = self.agent.run({"type": "lead_analysis", "lead_name": "Firma Z", "initial_score": 20})
        assert result.success is True
        assert result.data["priority"] == "niedrig"

    def test_email_draft(self):
        result = self.agent.run({"type": "email_draft", "recipient": "Hans", "product": "Software"})
        assert result.success is True
        assert result.data["recipient"] == "Hans"

    def test_deal_tracking(self):
        result = self.agent.run({"type": "deal_tracking", "deal_id": "D-001"})
        assert result.success is True
        assert result.data["deal_id"] == "D-001"

    def test_pipeline_forecast(self):
        result = self.agent.run({"type": "pipeline_forecast"})
        assert result.success is True


# ---------------------------------------------------------------------------
# FinanceAgent
# ---------------------------------------------------------------------------

class TestFinanceAgent:
    def setup_method(self):
        self.agent = FinanceAgent()

    def test_invoice_auto_approved(self):
        result = self.agent.run({"type": "invoice_processing", "invoice_id": "INV-001", "amount": 300})
        assert result.success is True
        assert result.data["needs_approval"] is False
        assert result.escalation_required is False

    def test_invoice_needs_approval(self):
        result = self.agent.run({"type": "invoice_processing", "invoice_id": "INV-002", "amount": 1000})
        assert result.success is True
        assert result.data["needs_approval"] is True
        assert result.escalation_required is True

    def test_budget_check(self):
        result = self.agent.run({"type": "budget_check", "cost_center": "IT", "amount": 200})
        assert result.success is True
        assert result.data["available"] is True

    def test_report_generation(self):
        result = self.agent.run({"type": "report_generation", "period": "Oktober 2025"})
        assert result.success is True
        assert "Oktober 2025" in result.message

    def test_expense_auto_approved(self):
        result = self.agent.run({"type": "expense_approval", "amount": 100, "requester": "Anna"})
        assert result.success is True
        assert result.data["approved"] is True

    def test_expense_escalated(self):
        result = self.agent.run({"type": "expense_approval", "amount": 1000, "requester": "Bob"})
        assert result.success is True
        assert result.data["approved"] is False
        assert result.escalation_required is True


# ---------------------------------------------------------------------------
# OpsAgent
# ---------------------------------------------------------------------------

class TestOpsAgent:
    def setup_method(self):
        self.agent = OpsAgent()

    def test_inventory_check(self):
        result = self.agent.run({"type": "inventory_check", "item": "Schrauben"})
        assert result.success is True
        assert "Schrauben" in result.message

    def test_reorder(self):
        result = self.agent.run({"type": "reorder", "item": "Bolzen", "quantity": 500})
        assert result.success is True
        assert result.data["order_status"] == "ausgelöst"

    def test_supplier_coordination(self):
        result = self.agent.run({"type": "supplier_coordination", "supplier": "Lieferant GmbH"})
        assert result.success is True

    def test_quality_control(self):
        result = self.agent.run({"type": "quality_control", "batch_id": "BATCH-007"})
        assert result.success is True
        assert "BATCH-007" in result.message


# ---------------------------------------------------------------------------
# ITAgent
# ---------------------------------------------------------------------------

class TestITAgent:
    def setup_method(self):
        self.agent = ITAgent()

    def test_ticket_p1_escalates(self):
        result = self.agent.run({"type": "ticket_classification", "ticket_id": "TKT-001", "priority": "P1"})
        assert result.success is True
        assert result.escalation_required is True
        assert result.data["response_minutes"] == 5

    def test_ticket_p3(self):
        result = self.agent.run({"type": "ticket_classification", "ticket_id": "TKT-002", "priority": "P3"})
        assert result.success is True
        assert result.escalation_required is False
        assert result.data["response_minutes"] == 240

    def test_self_heal(self):
        result = self.agent.run({"type": "self_heal", "issue_type": "hohe CPU-Last"})
        assert result.success is True
        assert result.data["healed"] is True

    def test_deployment(self):
        result = self.agent.run({"type": "deployment", "service": "api", "version": "1.2.3"})
        assert result.success is True
        assert result.data["status"] == "deployed"

    def test_security_scan(self):
        result = self.agent.run({"type": "security_scan", "target": "production"})
        assert result.success is True
        assert result.data["vulnerabilities"] == []


# ---------------------------------------------------------------------------
# CustomerServiceAgent
# ---------------------------------------------------------------------------

class TestCustomerServiceAgent:
    def setup_method(self):
        self.agent = CustomerServiceAgent()

    def test_incoming_request_positive_sentiment(self):
        result = self.agent.run({"type": "incoming_request", "customer_name": "Klaus", "sentiment_score": 4.0})
        assert result.success is True
        assert result.escalation_required is False

    def test_incoming_request_negative_sentiment_escalates(self):
        result = self.agent.run({"type": "incoming_request", "customer_name": "Maria", "sentiment_score": 1.5})
        assert result.success is True
        assert result.escalation_required is True

    def test_sentiment_analysis(self):
        result = self.agent.run({"type": "sentiment_analysis", "message": "Super Service!", "mock_score": 4.5})
        assert result.success is True
        assert result.data["sentiment_score"] == 4.5

    def test_faq_lookup_escalates(self):
        result = self.agent.run({"type": "faq_lookup", "query": "Wie kann ich stornieren?"})
        assert result.success is True
        assert result.escalation_required is True

    def test_followup(self):
        result = self.agent.run({"type": "followup", "customer_name": "Petra", "ticket_id": "TKT-100"})
        assert result.success is True
        assert "TKT-100" in result.message


# ---------------------------------------------------------------------------
# EngineeringAgent
# ---------------------------------------------------------------------------

class TestEngineeringAgent:
    def setup_method(self):
        self.agent = EngineeringAgent()

    def test_bug_report_critical_escalates(self):
        result = self.agent.run({"type": "bug_report", "bug_id": "BUG-001", "severity": "critical"})
        assert result.success is True
        assert result.escalation_required is True
        assert result.data["sla_hours"] == 4

    def test_bug_report_minor(self):
        result = self.agent.run({"type": "bug_report", "bug_id": "BUG-002", "severity": "minor"})
        assert result.success is True
        assert result.escalation_required is False
        assert result.data["sla_hours"] == 72

    def test_code_review(self):
        result = self.agent.run({"type": "code_review", "pr_id": "PR-42"})
        assert result.success is True
        assert result.data["approved"] is True

    def test_run_tests(self):
        result = self.agent.run({"type": "run_tests", "test_suite": "unit"})
        assert result.success is True
        assert result.data["passed"] is True

    def test_generate_docs(self):
        result = self.agent.run({"type": "generate_docs", "target": "api"})
        assert result.success is True
        assert result.data["docs_updated"] is True


# ---------------------------------------------------------------------------
# BaseAgent error handling
# ---------------------------------------------------------------------------

class TestBaseAgentErrorHandling:
    def test_exception_returns_failure(self):
        class BrokenAgent(HRAgent):
            def _execute(self, task):
                raise RuntimeError("Simulierter Fehler")

        agent = BrokenAgent()
        result = agent.run({"type": "anything"})
        assert result.success is False
        assert result.escalation_required is True
        assert "Simulierter Fehler" in result.message
