#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export SSH_AUTH_SOCK="$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"
echo "SSH_AUTH_SOCK=$SSH_AUTH_SOCK"
ssh-add -l
echo ""
echo ">>> Wenn 1Password/Touch ID fragt: JETZT bestätigen."
git commit --allow-empty -m "chore: 1Password op-ssh-sign Test ($(date +%Y-%m-%d))"
echo ""
git show --show-signature -s --oneline HEAD
echo ""
echo "Fertig."
