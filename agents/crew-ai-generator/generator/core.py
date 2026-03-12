from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable

from jinja2 import Environment, FileSystemLoader

from .utils import is_text_file


class ProjectGenerator:
    def __init__(self, templates_dir: str = "templates") -> None:
        self.templates_dir = Path(templates_dir)
        self.env = Environment(loader=FileSystemLoader(self.templates_dir), autoescape=False)

    def list_templates(self) -> list[str]:
        if not self.templates_dir.exists():
            return []
        return sorted(
            p.name
            for p in self.templates_dir.iterdir()
            if p.is_dir() and p.name != "base"
        )

    def generate(self, project_dir: str, template_type: str, variables: Dict[str, str] | None = None) -> Path:
        variables = variables or {}

        template_path = self.templates_dir / template_type
        if not template_path.exists():
            raise ValueError(f"Template '{template_type}' not found in {self.templates_dir}")

        destination = Path(project_dir)
        destination.mkdir(parents=True, exist_ok=True)

        self._copy_tree(self.templates_dir / "base", destination, variables)
        self._copy_tree(template_path, destination, variables)
        return destination

    def _copy_tree(self, src_root: Path, dst_root: Path, variables: Dict[str, str]) -> None:
        if not src_root.exists():
            return

        files = [p for p in src_root.rglob("*") if p.is_file()]
        for src_file in files:
            rel_path = src_file.relative_to(src_root)
            dst_file = dst_root / rel_path
            dst_file.parent.mkdir(parents=True, exist_ok=True)

            if is_text_file(src_file):
                template_rel = src_file.relative_to(self.templates_dir)
                template = self.env.get_template(str(template_rel))
                rendered = template.render(**variables)
                dst_file.write_text(rendered, encoding="utf-8")
            else:
                dst_file.write_bytes(src_file.read_bytes())
