"""Tests für den Datei-Organizer."""
import time
from pathlib import Path

import pytest

from organizer import OrganizerConfig, Rule, Organizer


@pytest.fixture()
def config(tmp_path):
    return OrganizerConfig(
        source_dir=tmp_path / "input",
        destination_root=tmp_path / "output",
        log_file=tmp_path / "test.log",
        use_date=False,
        use_project=False,
        use_filetype=True,
    )


@pytest.fixture()
def organizer(config):
    config.source_dir.mkdir(parents=True, exist_ok=True)
    return Organizer(config)


class TestRule:
    def test_matches_pattern(self):
        rule = Rule(name="Test", patterns=["rechnung"], target="Rechnungen")
        assert rule.matches("Rechnung_2025.pdf") is True

    def test_no_match(self):
        rule = Rule(name="Test", patterns=["backup"], target="Snapshots")
        assert rule.matches("Rechnung_2025.pdf") is False


class TestOrganizerConfig:
    def test_from_yaml(self, tmp_path):
        yaml_content = """
source_dir: data/input
destination_root: data/output
log_file: organizer.log
use_date: false
use_project: false
use_filetype: true
rules:
  - name: Rechnungen
    patterns: ["Rechnung"]
    target: Rechnungen
ignore_patterns:
  - "*.tmp"
"""
        config_file = tmp_path / "config.yaml"
        config_file.write_text(yaml_content, encoding="utf-8")
        cfg = OrganizerConfig.from_yaml(config_file)
        assert cfg.use_date is False
        assert len(cfg.rules) == 1
        assert cfg.rules[0].target == "Rechnungen"
        assert "*.tmp" in cfg.ignore_patterns

    def test_ensure_paths_creates_dirs(self, tmp_path):
        cfg = OrganizerConfig(
            source_dir=tmp_path / "in",
            destination_root=tmp_path / "out",
            log_file=tmp_path / "logs" / "organizer.log",
        )
        cfg.ensure_paths()
        assert (tmp_path / "in").exists()
        assert (tmp_path / "out").exists()
        assert (tmp_path / "logs").exists()


class TestOrganizer:
    def test_process_pdf_file(self, organizer, config):
        src = config.source_dir / "document.pdf"
        src.write_text("test", encoding="utf-8")
        dest = organizer.process_file(src)
        assert dest.suffix == ".pdf"
        assert "PDF" in str(dest)

    def test_process_image_file(self, organizer, config):
        src = config.source_dir / "photo.jpg"
        src.write_text("img", encoding="utf-8")
        dest = organizer.process_file(src)
        assert "Bilder" in str(dest)

    def test_process_unknown_extension(self, organizer, config):
        src = config.source_dir / "file.xyz"
        src.write_text("x", encoding="utf-8")
        dest = organizer.process_file(src)
        assert "Sonstiges" in str(dest)

    def test_ignore_pattern(self, organizer, config):
        config.ignore_patterns = ["*.tmp"]
        src = config.source_dir / "temp.tmp"
        src.write_text("tmp", encoding="utf-8")
        result = organizer.process_file(src)
        # Ignored files are returned unchanged (not moved)
        assert result == src

    def test_rule_takes_precedence(self, tmp_path):
        cfg = OrganizerConfig(
            source_dir=tmp_path / "in",
            destination_root=tmp_path / "out",
            log_file=tmp_path / "test.log",
            use_date=False,
            use_project=False,
            use_filetype=False,
            rules=[Rule(name="Rechnungen", patterns=["rechnung"], target="Rechnungen")],
        )
        cfg.source_dir.mkdir(parents=True, exist_ok=True)
        org = Organizer(cfg)
        src = cfg.source_dir / "Rechnung_001.pdf"
        src.write_text("pdf", encoding="utf-8")
        dest = org.process_file(src)
        assert "Rechnungen" in str(dest)

    def test_project_detection(self, tmp_path):
        cfg = OrganizerConfig(
            source_dir=tmp_path / "in",
            destination_root=tmp_path / "out",
            log_file=tmp_path / "test.log",
            use_date=False,
            use_project=True,
            use_filetype=False,
            project_keywords={"ProjektX": ["projektx", "px"]},
        )
        cfg.source_dir.mkdir(parents=True, exist_ok=True)
        org = Organizer(cfg)
        src = cfg.source_dir / "ProjektX_bericht.txt"
        src.write_text("x", encoding="utf-8")
        dest = org.process_file(src)
        assert "ProjektX" in str(dest)

    def test_process_existing(self, organizer, config):
        for name in ["a.pdf", "b.txt", "c.jpg"]:
            (config.source_dir / name).write_text("x", encoding="utf-8")
        organizer.process_existing()
        # All files should have been moved out of source
        remaining = list(config.source_dir.iterdir())
        assert remaining == []

    def test_existing_destination_overwritten(self, organizer, config):
        src = config.source_dir / "file.txt"
        src.write_text("new content", encoding="utf-8")
        # Process once
        dest = organizer.process_file(src)
        # Put a new file with same name back in source
        src.write_text("updated content", encoding="utf-8")
        dest2 = organizer.process_file(src)
        assert dest2.read_text(encoding="utf-8") == "updated content"
