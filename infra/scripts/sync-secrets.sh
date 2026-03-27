#!/usr/bin/env bash
# =============================================================================
# sync-secrets.sh — Lädt Secrets aus 1Password und schreibt .env-Dateien
#
# Voraussetzungen:
#   - 1Password CLI: brew install 1password-cli
#   - Eingeloggt:    op signin
#   - jq:            brew install jq
#
# Usage:
#   ./infra/scripts/sync-secrets.sh                    # alle Services
#   ./infra/scripts/sync-secrets.sh admin-dashboard   # nur ein Service
#   ./infra/scripts/sync-secrets.sh --dry-run          # anzeigen, nicht schreiben
#   ./infra/scripts/sync-secrets.sh --list             # verfügbare Services zeigen
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SECRETS_DIR="$ROOT_DIR/secrets/projects"

DRY_RUN=false
TARGET_SERVICE=""
LIST_ONLY=false

for arg in "$@"; do
  case $arg in
    --dry-run)  DRY_RUN=true ;;
    --list)     LIST_ONLY=true ;;
    -*)         echo "Unbekannte Option: $arg"; exit 1 ;;
    *)          TARGET_SERVICE="$arg" ;;
  esac
done

# ── Farben ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_skip()  { echo -e "${CYAN}[SKIP]${NC}  $1"; }

# ── 1Password Check ───────────────────────────────────────────────────────────
check_op() {
  if ! command -v op &> /dev/null; then
    log_error "1Password CLI nicht gefunden → brew install 1password-cli"
    exit 1
  fi
  if ! op account list &> /dev/null 2>&1; then
    log_error "Nicht eingeloggt → op signin"
    exit 1
  fi
}

check_jq() {
  if ! command -v jq &> /dev/null; then
    log_error "jq nicht gefunden → brew install jq"
    exit 1
  fi
}

# ── Einen Service syncen ──────────────────────────────────────────────────────
sync_service() {
  local service_dir="$1"
  local service_name
  service_name=$(basename "$service_dir")
  local req="$service_dir/env-requirements.json"

  if [[ ! -f "$req" ]]; then
    log_warn "$service_name: kein env-requirements.json — überspringe"
    return 0
  fi

  local target_env
  target_env=$(jq -r '.target_env_file // empty' "$req")

  if [[ -z "$target_env" ]]; then
    log_skip "$service_name: kein target_env_file (z.B. mcp-servers) — überspringe Datei-Sync"
    print_service_values "$service_name" "$req"
    return 0
  fi

  local env_file="$ROOT_DIR/$target_env"
  echo -e "\n${BOLD}── $service_name${NC} → $target_env"

  local env_content=""
  local count_ok=0 count_default=0 count_skip=0
  local missing_required=()
  # Hinweis: count_ok+=1 statt count_ok=$((count_ok + 1)) wegen set -e (0++ gibt exit 1)

  while IFS= read -r key; do
    local op_path default_value optional note
    op_path=$(jq -r ".required_keys[\"$key\"].op_path // empty" "$req")
    default_value=$(jq -r ".required_keys[\"$key\"].default_value // empty" "$req")
    optional=$(jq -r ".required_keys[\"$key\"].optional" "$req")
    note=$(jq -r ".required_keys[\"$key\"].note // empty" "$req")

    local value=""

    if [[ -n "$op_path" ]]; then
      # 1Password lesen
      if op_value=$(op read "$op_path" 2>/dev/null); then
        value="$op_value"
        log_ok "  $key ✓  (1Password)"
        count_ok=$((count_ok + 1))
      elif [[ -n "$default_value" ]]; then
        # Fallback auf Default
        value="$default_value"
        log_warn "  $key ⚠  (1P fehlgeschlagen → default)"
        count_default=$((count_default + 1))
      elif [[ "$optional" == "false" ]]; then
        missing_required+=("$key → $op_path")
        log_error "  $key ✗  (PFLICHT — nicht gefunden)"
        continue
      else
        log_skip "  $key —  (optional, nicht gefunden)"
        [[ -n "$note" ]] && log_info "    Hinweis: $note"
        count_skip=$((count_skip + 1))
        continue
      fi
    elif [[ -n "$default_value" ]]; then
      # Nur Default, kein op_path
      value="$default_value"
      log_info "  $key =  (default)"
      count_default=$((count_default + 1))
    elif [[ "$optional" == "false" ]]; then
      missing_required+=("$key — kein op_path und kein default_value")
      log_error "  $key ✗  (PFLICHT — keine Quelle konfiguriert)"
      [[ -n "$note" ]] && log_warn "    → $note"
      continue
    else
      log_skip "  $key —  (optional, keine Quelle)"
      [[ -n "$note" ]] && log_info "    Hinweis: $note"
      count_skip=$((count_skip + 1))
      continue
    fi

    env_content+="$key=$value"$'\n'
  done < <(jq -r '.required_keys | keys[]' "$req")

  # Fehlende Pflichtfelder → Abbrechen
  if [[ ${#missing_required[@]} -gt 0 ]]; then
    log_error "Fehlende Pflichtfelder:"
    for m in "${missing_required[@]}"; do log_error "  ✗ $m"; done
    return 1
  fi

  echo -e "  ${GREEN}✓ $count_ok aus 1P${NC}  ${BLUE}= $count_default defaults${NC}  ${CYAN}– $count_skip übersprungen${NC}"

  if [[ "$DRY_RUN" == "true" ]]; then
    log_warn "[DRY-RUN] Würde schreiben → $env_file"
    echo "$env_content" | sed 's/=.*/=***/'
    return 0
  fi

  # Backup
  if [[ -f "$env_file" ]]; then
    cp "$env_file" "${env_file}.bak"
    log_info "  Backup → ${env_file}.bak"
  fi

  mkdir -p "$(dirname "$env_file")"
  printf "# Auto-generated by sync-secrets.sh — %s\n# NIEMALS committen!\n\n%s" \
    "$(date '+%Y-%m-%d %H:%M')" "$env_content" > "$env_file"

  log_ok "  Geschrieben → $env_file"
}

# ── Service-Werte ohne Datei anzeigen (z.B. mcp-servers) ─────────────────────
print_service_values() {
  local service_name="$1" req="$2"
  echo -e "\n${BOLD}── $service_name${NC} (kein .env — Werte zur manuellen Nutzung):"
  while IFS= read -r key; do
    local op_path
    op_path=$(jq -r ".required_keys[\"$key\"].op_path // empty" "$req")
    if [[ -n "$op_path" ]]; then
      if value=$(op read "$op_path" 2>/dev/null); then
        echo -e "  ${GREEN}$key${NC}=***"
      else
        log_warn "  $key — nicht gefunden ($op_path)"
      fi
    fi
  done < <(jq -r '.required_keys | keys[]' "$req")
}

# ── Main ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}  AIOS Secret Sync — 1Password → .env files${NC}"
echo -e "${BOLD}================================================${NC}"

if [[ "$LIST_ONLY" == "true" ]]; then
  echo -e "\nVerfügbare Services:"
  for d in "$SECRETS_DIR"/*/; do
    name=$(basename "$d")
    target=$(jq -r '.target_env_file // "(kein target_env_file)"' "$d/env-requirements.json" 2>/dev/null)
    echo -e "  ${CYAN}$name${NC} → $target"
  done
  exit 0
fi

check_jq
check_op

if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "${YELLOW}  Modus: DRY-RUN — keine Dateien werden geschrieben${NC}"
fi

if [[ -n "$TARGET_SERVICE" ]]; then
  service_path="$SECRETS_DIR/$TARGET_SERVICE"
  if [[ ! -d "$service_path" ]]; then
    log_error "Service '$TARGET_SERVICE' nicht gefunden"
    log_info "Verfügbar: $(ls "$SECRETS_DIR" | tr '\n' ' ')"
    exit 1
  fi
  sync_service "$service_path"
else
  for service_dir in "$SECRETS_DIR"/*/; do
    sync_service "$service_dir"
  done
fi

echo ""
if [[ "$DRY_RUN" == "true" ]]; then
  echo -e "${YELLOW}DRY-RUN abgeschlossen — keine Dateien wurden geschrieben${NC}"
else
  echo -e "${GREEN}Sync abgeschlossen!${NC}"
fi
echo ""
