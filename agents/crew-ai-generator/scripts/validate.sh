#!/usr/bin/env bash
set -euo pipefail
python -m generator.cli list
pytest -q
