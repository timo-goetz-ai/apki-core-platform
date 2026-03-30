# Admin Dashboard — Kontext für Claude Code

Next.js- **Admin-/Operations-Dashboard** im AIOS-Monorepo.

## Stack & Router

- **Next.js 14** mit **App Router** (`src/app/**`) — kein Pages Router.
- **Route Handlers** liegen unter `src/app/api/**/route.ts` (jede Datei = eine API-Route).

## Daten & Integrationen

- **NocoDB** über die App-interne API-Kette, z. B. Aufrufe wie `/api/nocodb/table?id=TABLE_ID` (Tabellen-ID aus NocoDB-Meta/Env).
- **n8n** und weitere Dienste: über dedizierte Routen unter `src/app/api/` (z. B. Trigger/Pipeline-Endpoints) — bestehende Muster wiederverwenden.

## UI

- Komponenten: **`src/components/ui/`** — shadcn-**artig**, projekteigene Implementierung (Radix + CVA + Tailwind).
- Design-Tokens über **CSS-Variablen**, u. a.:
  - Ebenen: `--layer-0` … `--layer-3`
  - Text: `--text-primary`, `--text-secondary`, `--text-muted`
  - Akzente: `--accent-blue`, `--accent-green`, `--accent-red`

## Build & Quality

- **Produktions-Build:** `npm run build` (im Verzeichnis `services/admin-dashboard`).
- **Vor Push / Deploy:** Build **muss** ohne Fehler laufen; CI/Coolify bauen denselben Pfad.

## Häufige Fehler / Stolpersteine

- **ESLint `react/jsx-key`:** Listen/Arrays in JSX immer mit stabiler `key` rendern.
- **TypeScript:** strikte Typen an bestehende Patterns halten; nach Refactors `tsc`/Build laufen lassen.
- **Picsart / Bild-APIs:** Max. **1024px** Kantenlänge (API-Limit) beachten — keine zu großen Abmessungen in Requests.

## Related

- Repo-weite Architektur und Deploy: `../../CLAUDE.md`

## Design & UI-Konsistenz

- Ausführliche Token-Tabellen und Migrationsregeln: **`DESIGN.md`** (dieses Verzeichnis).
- Kurz: neue UI nutzt **CSS-Variablen** aus `globals.css`, **keine freien Hex**; Interaktionen über **`@/components/ui/button`** (`variant`/`size`), sofern nicht ausnahmslos nötig.
- Shell (Sidebar/Header/Responsive): **`AppShell`**, **`AppSidebar`**, **`AppHeader`** — siehe `DESIGN.md` Abschnitt Shell.
