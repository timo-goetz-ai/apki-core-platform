# Mac Project Scanner

Scannt `~/Desktop` und `~/projects` nach lokalen Projekten (Git-Repos, Docker-Projekte) und importiert sie ins Dashboard.

## Setup auf dem Mac

```bash
cd tools/mac-scanner
# Kein npm install nötig – nur Node.js Stdlib

# Scan anzeigen (kein Upload)
node scan.js

# Direkt ans Dashboard senden
DASHBOARD_URL=https://agents.automation-plus-ki.de \
DASHBOARD_API_KEY=dein-secret-hier \
node scan.js --push
```

## Automatisierung via cron (Mac)

```bash
# Alle 30 Minuten scannen und pushen
crontab -e

*/30 * * * * DASHBOARD_URL=https://agents.automation-plus-ki.de DASHBOARD_API_KEY=dein-secret /usr/local/bin/node /path/to/aios/tools/mac-scanner/scan.js --push >> /tmp/mac-scan.log 2>&1
```

## Automatisierung via launchd (empfohlen auf Mac)

`~/Library/LaunchAgents/de.automation-plus-ki.mac-scanner.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>de.automation-plus-ki.mac-scanner</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/DEIN_USER/projects/aios/tools/mac-scanner/scan.js</string>
    <string>--push</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>DASHBOARD_URL</key>
    <string>https://agents.automation-plus-ki.de</string>
    <key>DASHBOARD_API_KEY</key>
    <string>HIER_DEIN_KEY</string>
  </dict>
  <key>StartInterval</key>
  <integer>1800</integer>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/de.automation-plus-ki.mac-scanner.plist
```

## API-Schnittstelle

**POST** `/api/mac/sync`
Header: `Authorization: Bearer <DASHBOARD_API_KEY>`

```json
{
  "scannedAt": "2026-03-15T10:00:00Z",
  "host": "mac",
  "projectCount": 12,
  "projects": [
    {
      "id": "mac-ai-agent-platform",
      "name": "ai-agent-platform",
      "path": "/Users/.../projects/ai-agent-platform",
      "type": "node",
      "activity": "active",
      "git": {
        "branch": "main",
        "remote": "https://github.com/TimoGoetz1988/ai-agent-platform",
        "lastCommitDate": "2026-03-14T18:22:00Z",
        "isDirty": true,
        "ahead": 2,
        "behind": 0
      },
      "docker": {
        "hasDockerfile": true,
        "hasCompose": true
      }
    }
  ]
}
```

**GET** `/api/mac/projects`
Header: `Authorization: Bearer <DASHBOARD_API_KEY>`

Gibt alle gespeicherten Mac-Projekte zurück.
