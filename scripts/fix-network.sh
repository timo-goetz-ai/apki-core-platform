#!/bin/bash
# fix-network.sh — Netzwerk-Reset & Reconnect für macOS
# Usage: sudo bash fix-network.sh

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[•]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; }

WIFI_INTERFACE="en0"
DNS_PRIMARY="1.1.1.1"
DNS_SECONDARY="8.8.8.8"
TEST_HOST="8.8.8.8"
TEST_URL="https://github.com"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧  macOS Netzwerk-Diagnose & Reset"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# --- 1. Status prüfen ---
log "Schritt 1: Aktueller Status..."
WIFI_STATUS=$(networksetup -getairportpower $WIFI_INTERFACE 2>/dev/null | awk '{print $NF}')
echo "  Wi-Fi Power:  $WIFI_STATUS"
IP=$(ipconfig getifaddr $WIFI_INTERFACE 2>/dev/null || echo "keine IP")
echo "  IP-Adresse:   $IP"
ROUTER=$(netstat -rn 2>/dev/null | awk '/default.*en0/{print $2; exit}')
echo "  Gateway:      ${ROUTER:-nicht gefunden}"

# --- 2. Ping-Test ---
log "Schritt 2: Verbindungstest..."
if ping -c 1 -W 2 $TEST_HOST &>/dev/null; then
  ok "Internet erreichbar — kein Reset nötig"
  curl -s -o /dev/null -w "  GitHub: %{http_code}\n" --max-time 5 $TEST_URL
  exit 0
else
  warn "Kein Internet — starte Reset..."
fi

# --- 3. DNS-Cache leeren ---
log "Schritt 3: DNS-Cache leeren..."
dscacheutil -flushcache && killall -HUP mDNSResponder 2>/dev/null
ok "DNS-Cache geleert"

# --- 4. DHCP-Lease erneuern ---
log "Schritt 4: DHCP-Lease erneuern..."
ipconfig set $WIFI_INTERFACE DHCP 2>/dev/null || warn "DHCP-Erneuerung fehlgeschlagen (ggf. kein sudo)"
sleep 2
NEW_IP=$(ipconfig getifaddr $WIFI_INTERFACE 2>/dev/null || echo "keine IP")
echo "  Neue IP: $NEW_IP"

# --- 5. Wi-Fi aus/ein ---
log "Schritt 5: Wi-Fi Neustart..."
networksetup -setairportpower $WIFI_INTERFACE off
sleep 2
networksetup -setairportpower $WIFI_INTERFACE on
sleep 5
ok "Wi-Fi neu gestartet"

# --- 6. Netzwerk-Interface reset ---
log "Schritt 6: Interface reset..."
ifconfig $WIFI_INTERFACE down 2>/dev/null && sleep 1
ifconfig $WIFI_INTERFACE up   2>/dev/null
sleep 3

# --- 7. DNS manuell setzen (Cloudflare + Google) ---
log "Schritt 7: DNS auf $DNS_PRIMARY / $DNS_SECONDARY setzen..."
networksetup -setdnsservers "Wi-Fi" $DNS_PRIMARY $DNS_SECONDARY
ok "DNS gesetzt"

# --- 8. Netzwerkdienst neu starten ---
log "Schritt 8: Netzwerkdienst neu starten..."
networksetup -setnetworkserviceenabled "Wi-Fi" off
sleep 1
networksetup -setnetworkserviceenabled "Wi-Fi" on
sleep 4

# --- 9. Ergebnis ---
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Verbindungstest nach Reset..."
sleep 3

if ping -c 2 -W 3 $TEST_HOST &>/dev/null; then
  ok "✅ Internet wiederhergestellt!"
  FINAL_IP=$(ipconfig getifaddr $WIFI_INTERFACE 2>/dev/null || echo "?")
  echo "  IP-Adresse: $FINAL_IP"
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 $TEST_URL || echo "000")
  echo "  GitHub:     $HTTP"
else
  fail "❌ Immer noch kein Internet"
  echo ""
  warn "Mögliche Ursachen:"
  echo "  • Router / Modem neu starten"
  echo "  • WLAN-Passwort prüfen (vergessenes Netzwerk?)"
  echo "  • VPN / Tailscale deaktivieren: sudo tailscale down"
  echo "  • macOS Netzwerk-Diagnose: /System/Library/CoreServices/Wireless\\ Diagnostics.app"
  echo ""
  warn "Tailscale deaktivieren und nochmal versuchen:"
  echo "  sudo tailscale down && sudo bash fix-network.sh"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
