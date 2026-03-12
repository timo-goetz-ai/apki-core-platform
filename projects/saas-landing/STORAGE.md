# Ordnerstruktur – SaaS Landing

```
saas-landing/
├── apps/
│   ├── marketing/                 # Landing Page & Marketing-Site
│   │   ├── public/                # Statische Assets
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (landing)/     # Hero, Features, Pricing, CTA
│   │       │   │   ├── page.tsx
│   │       │   │   └── layout.tsx
│   │       │   ├── pricing/
│   │       │   ├── about/
│   │       │   ├── blog/
│   │       │   ├── layout.tsx
│   │       │   └── globals.css
│   │       ├── components/
│   │       │   ├── landing/       # Hero, Features, Testimonials, Footer
│   │       │   └── ui/            # Button, Card, Navbar, etc.
│   │       └── lib/
│   │
│   └── webapp/                    # SaaS-App (Dashboard, Produkt)
│       └── src/
│           ├── app/
│           │   ├── (dashboard)/   # Geschützte App-Routen
│           │   ├── login/
│           │   └── signup/
│           ├── components/
│           └── lib/
│
├── packages/                      # Shared Code
│   ├── ui/                        # Gemeinsame UI-Komponenten
│   ├── config/                    # Shared Config, Env, TS-Config
│   └── utils/                     # Helpers, Validierung, API-Client
│
├── assets/                        # Zentrale Assets
│   ├── images/
│   └── fonts/
│
├── docs/                          # Dokumentation
├── scripts/                       # Build-, Deploy-, Tool-Scripts
├── README.md
└── STORAGE.md
```

## Nächste Schritte

1. `pnpm init` oder `npm init -w apps/marketing`
2. Next.js in `apps/marketing` aufsetzen
3. Tailwind CSS / shadcn/ui integrieren
4. Landing-Bausteine: Hero, Features, Pricing, CTA, Footer
