#!/bin/bash
# ============================================
# Deploy salon_db Schema auf Hetzner Server
# Nutzt den bestehenden PostgreSQL Container
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVER_IP="<HETZNER_HOST>"
SERVER_USER="root"
DB_NAME="salon_db"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== KI-Flow Salon DB Deploy ===${NC}"
echo ""

# Prüfe SSH-Zugang
echo -e "Prüfe SSH-Verbindung zu ${SERVER_IP}..."
if ! ssh -q -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_IP}" exit 2>/dev/null; then
    echo -e "${RED}SSH-Verbindung fehlgeschlagen!${NC}"
    echo "Stelle sicher, dass SSH-Key konfiguriert ist."
    exit 1
fi
echo -e "${GREEN}SSH OK${NC}"

# Lade .env vom n8n-automation-hub
echo "Lade Datenbank-Credentials..."
POSTGRES_USER=$(ssh "${SERVER_USER}@${SERVER_IP}" "grep POSTGRES_USER /opt/n8n-automation-hub/.env | cut -d= -f2")
POSTGRES_PASSWORD=$(ssh "${SERVER_USER}@${SERVER_IP}" "grep POSTGRES_PASSWORD /opt/n8n-automation-hub/.env | cut -d= -f2")

if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${RED}Konnte DB-Credentials nicht laden!${NC}"
    exit 1
fi
echo -e "${GREEN}Credentials geladen${NC}"

# Erstelle salon_db falls nicht vorhanden
echo "Erstelle Datenbank '${DB_NAME}'..."
ssh "${SERVER_USER}@${SERVER_IP}" "docker exec postgres psql -U ${POSTGRES_USER} -tc \"SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'\" | grep -q 1 || docker exec postgres psql -U ${POSTGRES_USER} -c \"CREATE DATABASE ${DB_NAME}\""
echo -e "${GREEN}Datenbank bereit${NC}"

# Kopiere SQL-Dateien auf Server
echo "Kopiere Migrations..."
scp -q "${PROJECT_DIR}/db/migrations/001_initial_schema.sql" "${SERVER_USER}@${SERVER_IP}:/tmp/001_initial_schema.sql"

# Führe Migration aus
echo "Führe Schema-Migration aus..."
ssh "${SERVER_USER}@${SERVER_IP}" "docker exec -i postgres psql -U ${POSTGRES_USER} -d ${DB_NAME} < /tmp/001_initial_schema.sql"
echo -e "${GREEN}Schema deployed${NC}"

# Optional: Demo-Daten
if [ "${1:-}" = "--seed" ]; then
    echo "Lade Demo-Daten..."
    scp -q "${PROJECT_DIR}/db/seeds/demo_salon.sql" "${SERVER_USER}@${SERVER_IP}:/tmp/demo_salon.sql"
    ssh "${SERVER_USER}@${SERVER_IP}" "docker exec -i postgres psql -U ${POSTGRES_USER} -d ${DB_NAME} < /tmp/demo_salon.sql"
    echo -e "${GREEN}Demo-Daten geladen${NC}"
fi

# Aufräumen
ssh "${SERVER_USER}@${SERVER_IP}" "rm -f /tmp/001_initial_schema.sql /tmp/demo_salon.sql"

echo ""
echo -e "${GREEN}=== Deploy abgeschlossen ===${NC}"
echo ""
echo "Datenbank: ${DB_NAME}"
echo "Server:    ${SERVER_IP}"
echo ""
echo "n8n PostgreSQL Credentials Node:"
echo "  Host:     postgres"
echo "  Port:     5432"
echo "  Database: ${DB_NAME}"
echo "  User:     ${POSTGRES_USER}"
echo "  Password: (aus .env)"
