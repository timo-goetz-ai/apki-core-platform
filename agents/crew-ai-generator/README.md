# crew-ai-generator

Production-ready generator for Crew AI templates with Streamlit, Terraform, Kubernetes, Docker, and CI/CD scaffolding.

## Quickstart

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m generator.cli generate my-chatbot --template chatbot --var project_name=my-chatbot --var environment=dev --var aws_region=eu-central-1
```

## Commands

```bash
python -m generator.cli list
python -m generator.cli generate <project_dir> --template chatbot --var key=value
```

## Notes

- Templates are rendered via Jinja2.
- Dotfiles are supported.
- Shared files in `templates/base` are copied first.
