"""Tests für die gemeinsamen Skills."""
import pytest

from skills.common import classify_text, extract_amount, render_template, score_to_priority


class TestScoreToPriority:
    def test_high(self):
        assert score_to_priority(80.0) == "hoch"

    def test_high_boundary(self):
        assert score_to_priority(70.0) == "hoch"

    def test_medium(self):
        assert score_to_priority(55.0) == "mittel"

    def test_medium_boundary(self):
        assert score_to_priority(40.0) == "mittel"

    def test_low(self):
        assert score_to_priority(20.0) == "niedrig"

    def test_zero(self):
        assert score_to_priority(0.0) == "niedrig"

    def test_custom_thresholds(self):
        assert score_to_priority(60.0, high=80.0, medium=50.0) == "mittel"


class TestExtractAmount:
    def test_euro_sign(self):
        assert extract_amount("Betrag: 500 €") == 500.0

    def test_eur_abbreviation(self):
        assert extract_amount("Zahlung 1.234,56 EUR") == 1234.56

    def test_german_format(self):
        assert extract_amount("Rechnung über 2.500,00 €") == 2500.00

    def test_no_match(self):
        assert extract_amount("Kein Betrag hier") is None

    def test_simple_integer(self):
        assert extract_amount("100 €") == 100.0


class TestClassifyText:
    KEYWORD_MAP = {
        "hr": ["bewerbung", "urlaub"],
        "finance": ["rechnung", "zahlung"],
    }

    def test_hr_match(self):
        assert classify_text("Neue Bewerbung eingegangen", self.KEYWORD_MAP) == "hr"

    def test_finance_match(self):
        assert classify_text("Rechnung liegt vor", self.KEYWORD_MAP) == "finance"

    def test_no_match(self):
        assert classify_text("Keine Ahnung", self.KEYWORD_MAP) is None

    def test_case_insensitive(self):
        assert classify_text("RECHNUNG erhalten", self.KEYWORD_MAP) == "finance"


class TestRenderTemplate:
    def test_render(self, tmp_path):
        template = tmp_path / "test.md"
        template.write_text("Hallo {name}, dein Score ist {score}.", encoding="utf-8")
        result = render_template(template, {"name": "Anna", "score": "95"})
        assert result == "Hallo Anna, dein Score ist 95."

    def test_missing_template(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            render_template(tmp_path / "fehlt.md", {})
