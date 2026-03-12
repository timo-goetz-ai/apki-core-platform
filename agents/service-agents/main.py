"""Einstiegspunkt für das neue Projekt."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

from organizer import Organizer, OrganizerConfig


ENV_FILE = Path(".env")
DEFAULT_CONFIG_PATH = Path("data/organizer.yaml")


def load_env(path: Path = ENV_FILE) -> None:
    """Lädt einfache KEY=VALUE Paare aus einer .env-Datei, falls vorhanden."""
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def ensure_directories(folders: Iterable[Path]) -> None:
    """Erstellt benötigte Ordner, falls sie fehlen."""
    for folder in folders:
        folder.mkdir(parents=True, exist_ok=True)


def build_status_message() -> str:
    project_name = os.environ.get("PROJECT_NAME", "Datei-Organizer")
    environment = os.environ.get("ENVIRONMENT", "development")
    return f"Projekt '{project_name}' ist bereit (Umgebung: {environment})."


def _load_config() -> OrganizerConfig:
    config_path = Path(os.environ.get("ORGANIZER_CONFIG", DEFAULT_CONFIG_PATH))
    if config_path.exists():
        return OrganizerConfig.from_yaml(config_path)

    data_root = Path("data")
    ensure_directories([data_root / "input", data_root / "output"])
    return OrganizerConfig(
        source_dir=data_root / "input",
        destination_root=data_root / "output",
        log_file=Path("organizer.log"),
    )


def main() -> None:
    load_env()
    organizer = Organizer(_load_config())
    organizer.process_existing()

    print(build_status_message())
    print(
        "Überwachung gestartet – lege Dateien in den Eingangsordner, um sie automatisch zu sortieren."
    )
    organizer.start()


if __name__ == "__main__":
    main()
