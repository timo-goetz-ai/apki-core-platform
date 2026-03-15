// MCP-Stadt — Typen & In-Memory Store

export type BezirkStatus = "online" | "degraded" | "offline";

export interface Bezirk {
  id: string;
  name: string;
  emoji: string;
  beschreibung: string;
  status: BezirkStatus;
  tools: string[];
  leiterin?: string;
  uptime_pct: number;
  tasks_heute: number;
  fehler_heute: number;
}

export interface Mitarbeiter {
  id: string;
  name: string;
  rolle: string;
  rolleEmoji: string;
  bezirk: string;
  status: "aktiv" | "onboarding" | "inaktiv";
  seit: string;
  hallucLevel: number;
  hallucScore: number;
  hallucExpires: string;
}

export interface AuditEintrag {
  id: string;
  ts: string;
  aktion: string;
  akteur: string;
  ressource: string;
  ergebnis: "OK" | "WARN" | "FEHLER";
  details?: string;
}

// ── Seed-Daten ─────────────────────────────────────────────────────────────

export const BEZIRKE_SEED: Bezirk[] = [
  {
    id: "webseite",
    name: "Webseite-Bezirk",
    emoji: "🌐",
    beschreibung: "HTML/CSS, SEO, Responsive Websites",
    status: "online",
    tools: ["html-generator", "css-optimizer", "seo-checker", "lighthouse"],
    leiterin: "Max Müller",
    uptime_pct: 99.8,
    tasks_heute: 14,
    fehler_heute: 0,
  },
  {
    id: "landingpage",
    name: "Landingpage-Bezirk",
    emoji: "📱",
    beschreibung: "Marketing-Seiten, Conversion-Optimierung",
    status: "online",
    tools: ["copy-generator", "ab-tester", "conversion-tracker", "hero-builder"],
    leiterin: "Lisa Chen",
    uptime_pct: 99.5,
    tasks_heute: 9,
    fehler_heute: 1,
  },
  {
    id: "saas",
    name: "SaaS-Bezirk",
    emoji: "💼",
    beschreibung: "SaaS-Produkte, App-Entwicklung, APIs",
    status: "online",
    tools: ["api-builder", "auth-generator", "stripe-integration", "onboarding-flow"],
    uptime_pct: 98.7,
    tasks_heute: 22,
    fehler_heute: 2,
  },
  {
    id: "zahlung",
    name: "Zahlungs-Bezirk",
    emoji: "💳",
    beschreibung: "Payment-Integration, Finanz-Flows",
    status: "degraded",
    tools: ["stripe-pay", "invoice-generator", "subscription-manager", "psd2-checker"],
    leiterin: "Lisa Chen",
    uptime_pct: 97.1,
    tasks_heute: 5,
    fehler_heute: 3,
  },
  {
    id: "devops",
    name: "DevOps-Bezirk",
    emoji: "🔐",
    beschreibung: "CI/CD, Docker, Coolify, Monitoring",
    status: "online",
    tools: ["dockerfile-gen", "github-actions", "coolify-deploy", "prometheus-exporter"],
    uptime_pct: 99.9,
    tasks_heute: 31,
    fehler_heute: 0,
  },
];

export const MITARBEITER_SEED: Mitarbeiter[] = [
  {
    id: "m001",
    name: "Anna Schmidt",
    rolle: "Bürgermeister",
    rolleEmoji: "🏛️",
    bezirk: "Alle",
    status: "aktiv",
    seit: "2025-01-15",
    hallucLevel: 7,
    hallucScore: 98,
    hallucExpires: "2026-03-01",
  },
  {
    id: "m002",
    name: "Max Müller",
    rolle: "Entwickler",
    rolleEmoji: "🔧",
    bezirk: "Webseite-Bezirk",
    status: "aktiv",
    seit: "2026-01-15",
    hallucLevel: 4,
    hallucScore: 87,
    hallucExpires: "2027-03-12",
  },
  {
    id: "m003",
    name: "Lisa Chen",
    rolle: "Operator",
    rolleEmoji: "👷",
    bezirk: "Zahlungs-Bezirk",
    status: "aktiv",
    seit: "2025-09-01",
    hallucLevel: 3,
    hallucScore: 82,
    hallucExpires: "2027-01-15",
  },
  {
    id: "m004",
    name: "Bob Wilson",
    rolle: "Security-Lead",
    rolleEmoji: "🛡️",
    bezirk: "Alle",
    status: "aktiv",
    seit: "2025-03-01",
    hallucLevel: 6,
    hallucScore: 95,
    hallucExpires: "2026-12-01",
  },
];

export const AUDIT_SEED: AuditEintrag[] = [
  {
    id: "a001",
    ts: "2026-03-15T09:12:00Z",
    aktion: "deploy_template",
    akteur: "Max Müller",
    ressource: "webseite-bezirk/templates/business",
    ergebnis: "OK",
  },
  {
    id: "a002",
    ts: "2026-03-15T08:45:00Z",
    aktion: "hallucination_test",
    akteur: "Bob Wilson",
    ressource: "mitarbeiter/lisa-chen",
    ergebnis: "OK",
    details: "Level 3 bestanden (Score 82)",
  },
  {
    id: "a003",
    ts: "2026-03-15T07:30:00Z",
    aktion: "permission_grant",
    akteur: "Anna Schmidt",
    ressource: "zahlung-bezirk/stripe-pay",
    ergebnis: "OK",
    details: "Lisa Chen — Lesezugriff",
  },
  {
    id: "a004",
    ts: "2026-03-14T17:55:00Z",
    aktion: "bezirk_error",
    akteur: "system",
    ressource: "zahlung-bezirk/psd2-checker",
    ergebnis: "WARN",
    details: "Response Time > 500ms",
  },
  {
    id: "a005",
    ts: "2026-03-14T14:20:00Z",
    aktion: "mitarbeiter_onboard",
    akteur: "Anna Schmidt",
    ressource: "mitarbeiter/max-mueller",
    ergebnis: "OK",
    details: "Übergabeprotokoll signiert",
  },
];

// ── In-Memory Store ─────────────────────────────────────────────────────────
// In Produktion: NocoDB/Postgres ersetzen

let _bezirke: Bezirk[] = [...BEZIRKE_SEED];
let _mitarbeiter: Mitarbeiter[] = [...MITARBEITER_SEED];
let _audit: AuditEintrag[] = [...AUDIT_SEED];

export const store = {
  getBezirke: () => _bezirke,
  getMitarbeiter: () => _mitarbeiter,
  getAudit: () => [..._audit].sort((a, b) => b.ts.localeCompare(a.ts)),

  addMitarbeiter: (m: Mitarbeiter) => {
    _mitarbeiter = [..._mitarbeiter, m];
    _audit = [
      {
        id: `a${Date.now()}`,
        ts: new Date().toISOString(),
        aktion: "mitarbeiter_created",
        akteur: "dashboard",
        ressource: `mitarbeiter/${m.id}`,
        ergebnis: "OK",
        details: `${m.rolleEmoji} ${m.name} — ${m.rolle}`,
      },
      ..._audit,
    ];
  },

  updateBezirkStatus: (id: string, status: BezirkStatus) => {
    _bezirke = _bezirke.map((b) => (b.id === id ? { ...b, status } : b));
  },

  logAudit: (eintrag: Omit<AuditEintrag, "id" | "ts">) => {
    _audit = [
      { id: `a${Date.now()}`, ts: new Date().toISOString(), ...eintrag },
      ..._audit,
    ];
  },
};
