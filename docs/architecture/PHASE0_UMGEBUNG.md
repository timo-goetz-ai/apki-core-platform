# Phase 0: Server-Umgebung (abgeschlossen)

**Datum:** 2025-03-06  
**SSH-Host:** hetzner (<HETZNER_HOST>)

## Ergebnis

| Komponente | Status |
|------------|--------|
| OS | Ubuntu, Kernel 6.8.0-100 |
| Docker | 29.2.0 |
| Coolify | Läuft (homestack) |
| **N8n** | **homestack-n8n** – Port 5678, Up 3 days |
| **NocoDB** | **homestack-nocodb** – Port 8080, Up 15 hours |
| Disk | 33G/301G belegt (12%) |
| RAM | 7,3 GB verfügbar |

## Konsequenz

**Kein neuer Docker-Stack nötig.** Bestehende N8n- und NocoDB-Instanzen werden genutzt.

- Schema in bestehendem NocoDB anlegen
- Workflows in bestehendem N8n importieren
- Zugriff über Coolify-Proxy (Port 80/443)
