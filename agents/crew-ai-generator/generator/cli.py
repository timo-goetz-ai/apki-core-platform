from __future__ import annotations

import argparse
import sys

from .core import ProjectGenerator
from .utils import parse_kv_pairs


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Crew AI project generator")
    sub = parser.add_subparsers(dest="command", required=True)

    list_cmd = sub.add_parser("list", help="List available templates")
    list_cmd.add_argument("--templates-dir", default="templates")

    gen_cmd = sub.add_parser("generate", help="Generate a project from a template")
    gen_cmd.add_argument("project_dir", help="Output project directory")
    gen_cmd.add_argument("--template", required=True, help="Template type, e.g. chatbot")
    gen_cmd.add_argument("--templates-dir", default="templates")
    gen_cmd.add_argument("--var", action="append", default=[], help="Template variable in key=value format")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        generator = ProjectGenerator(templates_dir=args.templates_dir)

        if args.command == "list":
            for name in generator.list_templates():
                print(name)
            return 0

        if args.command == "generate":
            variables = parse_kv_pairs(args.var)
            out = generator.generate(
                project_dir=args.project_dir,
                template_type=args.template,
                variables=variables,
            )
            print(f"Generated project at: {out}")
            return 0

        parser.print_help()
        return 1
    except Exception as exc:  # pragma: no cover
        print(f"Error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
