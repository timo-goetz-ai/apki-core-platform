"""Datei-Organizer mit flexibler Konfiguration und Ordnerüberwachung."""
from __future__ import annotations

import fnmatch
import logging
import shutil
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Mapping, Sequence

import yaml
from watchdog.events import FileCreatedEvent, FileMovedEvent, FileSystemEventHandler
from watchdog.observers import Observer


@dataclass
class Rule:
    """Spezialregel für gezielte Zielordner."""

    name: str
    patterns: list[str]
    target: str

    def matches(self, filename: str) -> bool:
        lowered = filename.lower()
        return any(pattern.lower() in lowered for pattern in self.patterns)


@dataclass
class OrganizerConfig:
    """Konfiguration für den Datei-Organizer."""

    source_dir: Path
    destination_root: Path
    log_file: Path
    use_date: bool = True
    use_project: bool = True
    use_filetype: bool = True
    date_source: str = "modified"  # "created", "modified", "received"
    date_folder_format: str = "{year}/{month:02d}"
    project_keywords: Mapping[str, Sequence[str]] = field(default_factory=dict)
    type_folders: Mapping[str, str] = field(
        default_factory=lambda: {
            "pdf": "PDF",
            "png": "Bilder",
            "jpg": "Bilder",
            "jpeg": "Bilder",
            "gif": "Bilder",
            "bmp": "Bilder",
            "tif": "Bilder",
            "tiff": "Bilder",
            "xlsx": "Excel",
            "xls": "Excel",
            "csv": "Excel",
            "ods": "Excel",
            "txt": "Text",
            "md": "Text",
            "rtf": "Text",
            "py": "Script",
            "sh": "Script",
            "ps1": "Script",
            "zip": "Archive",
            "tar": "Archive",
            "gz": "Archive",
            "7z": "Archive",
            "rar": "Archive",
        }
    )
    rules: List[Rule] = field(default_factory=list)
    ignore_patterns: Sequence[str] = field(default_factory=list)

    @classmethod
    def from_yaml(cls, path: Path) -> "OrganizerConfig":
        content = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
        rules = [Rule(**entry) for entry in content.get("rules", [])]
        return cls(
            source_dir=Path(content.get("source_dir", "data/input")),
            destination_root=Path(content.get("destination_root", "data/output")),
            log_file=Path(content.get("log_file", "organizer.log")),
            use_date=content.get("use_date", True),
            use_project=content.get("use_project", True),
            use_filetype=content.get("use_filetype", True),
            date_source=content.get("date_source", "modified"),
            date_folder_format=content.get("date_folder_format", "{year}/{month:02d}"),
            project_keywords=content.get("project_keywords", {}),
            type_folders=content.get("type_folders", {}),
            rules=rules,
            ignore_patterns=content.get("ignore_patterns", []),
        )

    def ensure_paths(self) -> None:
        for folder in [self.source_dir, self.destination_root, Path(self.log_file).parent]:
            Path(folder).mkdir(parents=True, exist_ok=True)


class Organizer:
    """Koordiniert das Verschieben eingehender Dateien."""

    def __init__(self, config: OrganizerConfig) -> None:
        self.config = config
        self.config.ensure_paths()
        self._setup_logging()

    def _setup_logging(self) -> None:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s",
            handlers=[
                logging.FileHandler(self.config.log_file, encoding="utf-8"),
                logging.StreamHandler(),
            ],
        )
        logging.info("Organizer gestartet")

    def start(self) -> None:
        """Startet die kontinuierliche Überwachung des Eingang-Ordners."""
        observer = Observer()
        handler = IngressHandler(self)
        observer.schedule(handler, str(self.config.source_dir), recursive=False)
        observer.start()
        logging.info("Überwachung läuft für %s", self.config.source_dir.resolve())

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logging.info("Stoppsignal empfangen, Überwachung wird beendet")
            observer.stop()
        observer.join()

    def process_file(self, path: Path) -> Path:
        """Verarbeitet eine neue Datei und gibt den Zielpfad zurück."""
        if self._is_ignored(path.name):
            logging.info("Datei %s wird ignoriert (Ignore-Pattern)", path.name)
            return path

        target_folder = self._resolve_target_folder(path)
        target_folder.mkdir(parents=True, exist_ok=True)
        destination = target_folder / path.name

        if destination.exists():
            logging.warning("Zieldatei existiert bereits, ersetze: %s", destination)

        shutil.move(str(path), destination)
        logging.info("%s → %s", path, destination)
        return destination

    def _is_ignored(self, filename: str) -> bool:
        return any(fnmatch.fnmatch(filename, pattern) for pattern in self.config.ignore_patterns)

    def _resolve_target_folder(self, path: Path) -> Path:
        parts: list[str] = []

        rule_target = self._match_rule(path.name)
        if rule_target:
            parts.append(rule_target)

        if self.config.use_project:
            project = self._detect_project(path.name)
            if project:
                parts.append(project)

        if self.config.use_filetype:
            parts.append(self._folder_for_extension(path.suffix))

        if self.config.use_date:
            parts.append(self._date_folder(path))

        return self.config.destination_root.joinpath(*parts)

    def _detect_project(self, filename: str) -> str | None:
        lowered = filename.lower()
        for project, keywords in self.config.project_keywords.items():
            if any(keyword.lower() in lowered for keyword in keywords):
                return project
        return None

    def _match_rule(self, filename: str) -> str | None:
        for rule in self.config.rules:
            if rule.matches(filename):
                return rule.target
        return None

    def _folder_for_extension(self, suffix: str) -> str:
        extension = suffix.lstrip(".").lower()
        return self.config.type_folders.get(extension, "Sonstiges")

    def _date_folder(self, path: Path) -> str:
        if self.config.date_source == "created":
            timestamp = path.stat().st_ctime
        elif self.config.date_source == "received":
            timestamp = time.time()
        else:
            timestamp = path.stat().st_mtime

        struct_time = time.localtime(timestamp)
        return self.config.date_folder_format.format(
            year=struct_time.tm_year, month=struct_time.tm_mon, day=struct_time.tm_mday
        )

    def process_existing(self) -> None:
        """Verarbeitet bereits vorhandene Dateien im Eingangsordner."""
        for entry in Path(self.config.source_dir).iterdir():
            if entry.is_file():
                self.process_file(entry)


class IngressHandler(FileSystemEventHandler):
    """Reagiert auf neue Dateien im Eingangsordner."""

    def __init__(self, organizer: Organizer) -> None:
        self.organizer = organizer

    def on_created(self, event: FileCreatedEvent) -> None:  # type: ignore[override]
        if event.is_directory:
            return
        self.organizer.process_file(Path(event.src_path))

    def on_moved(self, event: FileMovedEvent) -> None:  # type: ignore[override]
        if event.is_directory:
            return
        self.organizer.process_file(Path(event.dest_path))
