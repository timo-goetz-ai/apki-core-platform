#!/usr/bin/env bash
# Prüft den 1Password-SSH-Agent (unabhängig von evtl. anderem SSH_AUTH_SOCK der Shell).
# Nutzung: ./scripts/verify-1password-ssh-agent.sh
set -euo pipefail
_1P_SOCK="$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"
if [ ! -S "$_1P_SOCK" ]; then
  echo "Kein 1Password-Socket: $_1P_SOCK — 1Password starten, SSH-Agent in den Einstellungen aktivieren."
  exit 1
fi
export SSH_AUTH_SOCK="$_1P_SOCK"
echo "SSH_AUTH_SOCK=$SSH_AUTH_SOCK"
ssh-add -l
