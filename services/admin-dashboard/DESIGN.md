# Admin Dashboard — Design-Leitfaden

Kurzreferenz für UI im Service `services/admin-dashboard`. Ergänzt die Code-Konventionen in `CLAUDE.md` und im Repo-Root `CLAUDE.md`.

## Design-Tokens (CSS-Variablen)

Definiert in `src/app/globals.css`, an Tailwind angebunden in `tailwind.config.ts`.

| Token | Verwendung |
|--------|------------|
| `--layer-0` … `--layer-3` | Flächen von Body → Chrome → Karten → erhöhte Flächen |
| `--text-primary` | Haupttext |
| `--text-secondary` | sekundärer Text |
| `--text-muted` | dezent, Metadaten |
| `--border`, `--border-bright` | Trennlinien |
| `--accent-blue` | Primär-Aktion, Links, Info |
| `--accent-green` | Erfolg, „online“, positive Aktionen |
| `--accent-amber` | Warnung, degraded |
| `--accent-red` | Fehler, kritisch, offline |
| `--accent-purple` | zweiter Akzent (Charts, Kategorien) |
| `--radius` | Standard-Eckenradius |
| `--font-ui`, `--font-mono` | Outfit / IBM Plex Mono |

**Legacy (nicht in neuen Seiten nutzen, bei Refactor ersetzen):** `--accent`, `--positive`, `--warn`, `--danger`, `--surface`, `--surface2` — semantisch mit den obigen Tokens überlappend.

## Regeln für neue / geänderte UI

1. **Keine freien Hex-Werte** in neuen oder stark überarbeiteten Komponenten — nur Tokens (`var(--…)`) oder semantische Tailwind-Klassen, die auf dieselben Variablen mappen (`bg-card`, `text-primary`, … wo konfiguriert).
2. **Buttons:** `Button` aus `@/components/ui/button` mit `variant` / `size` — keine isoliert gestylten `<button>` außer in bewussten Ausnahmen (z. B. Drittanbieter-Embed).
3. **Fokus:** sichtbar halten (`focus-visible:ring`); shadcn-`Button` ist bereits vorkonfiguriert.
4. **Lucide `Image`:** als `ImageIcon` importieren, damit `jsx-a11y/alt-text` nicht mit Next/Image kollidiert.
5. **Bilder:** bevorzugt `next/image` mit `alt`-Text; dynamische externe URLs mit `unoptimized`, wenn keine `remotePatterns`-Pflege gewünscht ist.

## Shell & Responsivität

- Layout über **`AppShell`**: Sidebar ab `lg`, Mobile-Navigation als Overlay/Drawer.
- **`main`:** `pl-0 lg:pl-[240px]`, `pt-[60px]`; Header `left-0 lg:left-[240px]`.
- Primäre Nav- und Shell-Interaktionen: Mindesthöhe ~**44px** für Touch-Ziele wo sinnvoll.


## Komponenten (`src/components`)

Inline-Hex und feste Chart-/Panel-Farben sind auf **dieselben CSS-Variablen** wie in `src/app` umgestellt. **Tailwind `slate-*`/`zinc-*`** kann in Einzelfällen noch vorkommen — bei Refactors nach und nach durch `text-[--text-muted]` bzw. Layer-Klassen ersetzen.

**Hinweis:** Cloudflare-Logo-Pfade im SVG nutzen theme-kompatible Akzentfarben statt exakter Marken-Hex (Lesbarkeit im Dark/Light-Wechsel).

## Migration Bestand

- Bestehende „Neural Ops“-Seiten mit vielen Inline-`#hex`: schrittweise auf Tokens umstellen (gleiche Semantik: Grün=Erfolg, Gelb/Amber=Warnung, Rot=Fehler, Blau=Primär).
- Kontrast und Light-Mode: Tokens wechseln mit `data-theme`; nach größeren Farbumstellungen **Kontrast** (axe/Lighthouse) auf `/`, `/agents`, `/settings` prüfen.

## Button-Varianten (`@/components/ui/button`)

Zusätzlich zu `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`: **`success`** — grüner Hintergrund für Freigaben / positive Primäraktionen (`bg-[--accent-green]`, gut lesbar mit `text-[--layer-0]`).

## Verifikation

- `npm run lint`
- `npm run build`

Vor Deploy im Monorepo: gleiche Checks wie in `CLAUDE.md` beschrieben.
