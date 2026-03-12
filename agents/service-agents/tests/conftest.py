"""Pytest-Konfiguration: Fügt src/ zum Importpfad hinzu."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
