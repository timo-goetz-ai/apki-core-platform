"""
Lokaler Test-Runner für CoderAgent – ohne AppFlowy.
Generiert Code und zeigt Markdown-Output direkt im Terminal.

Usage:
    python3 test_local.py
    python3 test_local.py "Erstelle einen JWT Auth Middleware"
    python3 test_local.py "React Hook für API-Calls" python
"""

import sys
import json
import os
from datetime import date
from unittest.mock import MagicMock, patch

# Sicherstellen dass ANTHROPIC_API_KEY gesetzt ist
if not os.environ.get("ANTHROPIC_API_KEY"):
    print("❌ ANTHROPIC_API_KEY nicht gesetzt")
    print("   export ANTHROPIC_API_KEY=sk-ant-...")
    sys.exit(1)

# AppFlowy-Calls mocken damit kein echter Server nötig ist
mock_appflowy = MagicMock()
mock_appflowy.search_existing.return_value = []
mock_appflowy.save_record.return_value = "test-row-id-123"

SEPARATOR = "─" * 60


def run_test(requirement: str, language: str = "JavaScript"):
    print(f"\n{SEPARATOR}")
    print(f"TEST: {requirement}")
    print(f"LANG: {language}")
    print(SEPARATOR)

    # Agent importieren und AppFlowy mocken
    with patch("agent.AppFlowySaver", return_value=mock_appflowy):
        from agent import CoderAgent
        agent = CoderAgent()
        # AppFlowy-Instanz durch Mock ersetzen
        agent.appflowy = mock_appflowy

        result = agent.generate(requirement, language)

    print("\n📄 MARKDOWN OUTPUT:")
    print(SEPARATOR)
    print(result["markdown"])
    print(SEPARATOR)
    print(f"✅ Status:       {result['status']}")
    print(f"✅ AppFlowy ID:  {result['appflowy_id']} (Mock)")
    print(f"✅ Länge:        {len(result['markdown'])} Zeichen")

    # JSON-Zusammenfassung speichern
    output_file = f"test_output_{date.today()}.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"✅ Gespeichert:  {output_file}")

    return result


def run_all_tests():
    """Führt mehrere Test-Cases durch."""
    test_cases = [
        ("Erstelle eine einfache REST API Funktion für GET-Requests", "JavaScript"),
        ("Schreib eine Python Funktion die Text in Chunks aufteilt",  "Python"),
        ("React Hook für localStorage State Management",               "React"),
    ]

    results = []
    for req, lang in test_cases:
        try:
            r = run_test(req, lang)
            results.append({"requirement": req, "language": lang, "status": "ok"})
        except Exception as e:
            print(f"❌ Fehler: {e}")
            results.append({"requirement": req, "language": lang, "status": f"error: {e}"})

    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print("=" * 60)
    for r in results:
        icon = "✅" if r["status"] == "ok" else "❌"
        print(f"{icon} [{r['language']}] {r['requirement'][:50]}")
    print(f"\n{sum(1 for r in results if r['status'] == 'ok')}/{len(results)} Tests bestanden")


if __name__ == "__main__":
    if len(sys.argv) >= 2:
        # Einzelner Test aus CLI-Argument
        req = " ".join(sys.argv[1:])
        lang = os.environ.get("CODER_LANGUAGE", "JavaScript")
        run_test(req, lang)
    else:
        # Alle Tests durchführen
        print("🧪 CoderAgent – Lokaler Test (ohne AppFlowy)")
        print("Starte Test-Suite...\n")
        run_all_tests()
