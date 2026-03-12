#!/usr/bin/env bash
set -euo pipefail
docker build -t {{ project_name | default('chatbot') }}:latest -f infrastructure/docker/Dockerfile .
