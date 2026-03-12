# Credentials – Bewerbungs-Automation

Alle Credentials werden in der **N8n-UI** angelegt (Settings → Credentials). Keine Secrets in Git committen.

---

## 1. NocoDB API Token

- **Wo:** NocoDB → Account (Avatar) → Tokens → Create Token
- **N8n:** Credential-Typ „NocoDB API“ → URL (NocoDB-Instanz), Token einfügen
- **Hinweis:** Token später austauschen – erstmal Platzhalter/Test-Token für Setup

---

## 2. SMTP (SMTP2Go) – E-Mail-Benachrichtigungen

| Feld | Wert |
|------|------|
| **Host** | mail-eu.smtp2go.com |
| **Port** | 2525 (Standard) |
| **Alternative Ports** | 8025, 587, 80, 25 (TLS) |
| **SSL-Ports** | 465, 8465, 443 |

**N8n:** Credential-Typ „SMTP“  
- Host: `mail-eu.smtp2go.com`  
- Port: `2525`  
- User/Pass: SMTP2Go-Login (API-Key oder Account-Daten)  
- Secure: TLS (bei 2525) oder SSL (bei 465)

---

## 3. Optional (später)

- **OpenAI/Claude** – Keyword-Extraktion, Scoring
- **Apify** – Job-Scraping StepStone/Indeed
