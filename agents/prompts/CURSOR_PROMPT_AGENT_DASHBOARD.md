# Cursor-Prompt: Agent Control Center (Streamlit + Authentik)

**So nutzen:** In Cursor Composer öffnen (CMD+I / CTRL+I), gesamten Text aus dem Kasten unten kopieren und einfügen. Optional die Datei `GEMINI_AUSWERTUNG_TABELLEN.md` im selben Projekt öffnen oder per @ erwähnen.

---

## Prompt (zum Kopieren)

```
Handle als Senior DevOps & Python Developer. Ich baue ein "Agent Control Center" (Dashboard) für mein System.

KONTEXT-DATEIEN (bitte zuerst lesen):
- GEMINI_AUSWERTUNG_TABELLEN.md — enthält die komplette Services-Übersicht (dashboard.automation-plus-ki.de, Authentik, n8n, NocoDB, Grafana, MCP-Server), Login-Credentials-Hinweise und die empfohlene Streamlit-Architektur.
- Falls vorhanden: alle Dateien mit "Struktur", "Authentic" oder "Letzter Stand" im Namen — Architektur und Authentik-Setup.

1. ANALYSE
   - Lies GEMINI_AUSWERTUNG_TABELLEN.md und alle genannten Architektur-Dateien im Workspace.
   - Verstehe: Das Dashboard läuft unter dashboard.automation-plus-ki.de, Authentik (OIDC) für Login, Coolify für Deployment.

2. AUFGABE
   - Erstelle eine dashboard.py (Streamlit-App) als Grundgerüst.
   - Implementiere eine saubere Authentik/OIDC-Integration (z. B. streamlit-authenticator oder OIDC-Handling passend zu Authentik — wähle die beste Option).
   - Layout:
     - Sidebar: Service-Navigation (N8N, NocoDB, Grafana, ggf. Links zu den URLs aus der Auswertung).
     - Hauptbereich: Agent-Status-Cards (Live-Metrics als Platzhalter).
     - Live-Task-Feed mit Platzhalter für Echtzeit-Updates.

3. ANFORDERUNGEN
   - Code modular (z. B. getrennte Module für Auth, Layout, Widgets).
   - st.session_state für User/Session-Management.
   - Sauberes, modernes UI (Custom CSS oder Streamlit-Native).
   - Coolify-kompatibel (Port-Mapping/Umgebungsvariablen beachten).

4. ERGEBNIS
   - Vollständiger Code für dashboard.py.
   - requirements.txt mit allen nötigen Bibliotheken.
   - Kurzer Hinweis im Code oder als Kommentar: Wo Client-ID und Client-Secret aus Authentik eingetragen werden müssen (keine echten Secrets einbauen).
```

---

## Nach dem Ausführen

- **Authentik:** In Authentik unter "Applications" → "Providers" die OIDC-Client-ID und das Secret anlegen und in der App (Umgebungsvariable oder Config) eintragen.
- **Coolify:** App als "Docker" oder "Docker Compose" deployen; Port (z. B. 8501) und ggf. Subdomain `dashboard.automation-plus-ki.de` in Traefik/Authentik konfigurieren.
