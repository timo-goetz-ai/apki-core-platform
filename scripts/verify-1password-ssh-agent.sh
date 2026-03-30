#!/usr/bin/env bash
# Prüft, ob der 1Password-SSH-Agent Schlüssel anbietet (nach ~/.config/1Password/ssh/agent.toml).
# Nutzung: ./scripts/verify-1password-ssh-agent.sh
set -euo pipefail
SOCK="${SSH_AUTH_SOCK:-$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock}"
if [ ! -S "$SOCK" ]; then
  echo "Kein Socket: $SOCK — 1Password starten und SSH-Agent in den Einstellungen aktivieren."
  exit 1
fi
export SSH_AUTH_SOCK="$SOCK"
echo "SSH_AUTH_SOCK=$SSH_AUTH_SOCK"
ssh-add -l
