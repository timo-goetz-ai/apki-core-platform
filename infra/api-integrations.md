# API-Integrationen — Geplante Anbindungen

## FishAudio
- **Was:** Text-to-Speech mit eigenen Stimmen
- **API:** https://api.fish.audio/v1
- **Auth:** API Key in Header `Authorization: Bearer {FISHAUDIO_KEY}`
- **Hauptendpoint:** POST /v1/tts → gibt Audio-Stream zurück
- **Modell:** Eigene Stimme klonbar oder Standard-Stimmen
- **Env var:** `FISHAUDIO_API_KEY`
- **Use Case:** Voice-Over für YouTube-Videos, Audio-Blog, FishAudio-Template

## Google Workspace
- **Was:** Gmail, Drive, Docs, Sheets, Calendar
- **Bereits aktiv:** mcp-google läuft auf mcp-google.automation-plus-ki.de
- **API:** Google API via OAuth2 oder Service Account
- **Env var:** `GOOGLE_SERVICE_ACCOUNT_KEY` oder `GOOGLE_AI_API_KEY`
- **Use Case:** Email-Templates aus Workspace versenden, Docs erstellen, Sheets für Leads

## PicsArt Pro
- **Was:** KI-Bildbearbeitung und -generierung
- **API:** https://api.picsart.io/tools/1.0
- **Auth:** `X-Picsart-API-Key: {KEY}`
- **Hauptendpoints:**
  - POST /upscale — Bild hochskalieren
  - POST /removebg — Hintergrund entfernen
  - POST /effects — Filter anwenden
  - POST /text2image — Bild aus Text generieren
- **Env var:** `PICSART_API_KEY`
- **Use Case:** Infografiken erstellen, Thumbnails bearbeiten, Brand-Assets generieren

## YouTube Data API v3
- **Was:** Videos hochladen, Kanal verwalten, Beschreibungen setzen
- **API:** https://www.googleapis.com/youtube/v3
- **Auth:** OAuth2 (Kanal-Zugriff) oder API Key (nur lesen)
- **Hauptendpoints:**
  - POST /videos → Video hochladen
  - PUT /videos → Titel/Beschreibung aktualisieren
  - GET /channels → Kanalinfos abrufen
- **Env var:** `YOUTUBE_API_KEY` oder `YOUTUBE_OAUTH_TOKEN`
- **Use Case:** YouTube-Template direkt hochladen, Beschreibungen auto-generieren

## Blogify
- **Was:** Blog-Plattform
- **Integration:** Webhook oder direkter API-Aufruf je nach Platform
- **Use Case:** Blogpost-Templates direkt auf Blogify veröffentlichen
