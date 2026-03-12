#!/usr/bin/env bash
set -euo pipefail
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/
