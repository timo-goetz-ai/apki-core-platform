/**
 * Workflow Kategorie-System — Operations Center
 *
 * Nummerierung: [Kategorie-Nr]_[Laufende Nr]_[Kuerzel]
 * Beispiel: 17_030_AI → Kategorie 17 (AI), Workflow Nr. 030
 */

/* ── Schedule Tags ─────────────────────────────────────────────────────────── */

export interface ScheduleTag {
  key: string;
  label: string;
  icon: string;
  color: string;
}

export const SCHEDULE_TAGS: Record<string, ScheduleTag> = {
  RT:   { key: 'RT',   label: 'Realtime',     icon: '\u26A1', color: 'var(--accent-green)' },
  MIN:  { key: 'MIN',  label: 'Minutlich',     icon: '\uD83D\uDD04', color: 'var(--accent-blue)' },
  HOR:  { key: 'HOR',  label: 'Stundlich',     icon: '\uD83D\uDD50', color: 'var(--accent-blue)' },
  DAY:  { key: 'DAY',  label: 'Taglich',       icon: '\uD83D\uDCC5', color: 'var(--accent-amber)' },
  WEEK: { key: 'WEEK', label: 'Wochentlich',   icon: '\uD83D\uDCC6', color: 'var(--accent-purple)' },
  MON:  { key: 'MON',  label: 'Monatlich',     icon: '\uD83D\uDDD3\uFE0F', color: 'var(--text-secondary)' },
  QRT:  { key: 'QRT',  label: 'Quartalsweise', icon: '\uD83D\uDCCA', color: 'var(--text-secondary)' },
  YEAR: { key: 'YEAR', label: 'Jahrlich',      icon: '\uD83D\uDDC2\uFE0F', color: 'var(--text-muted)' },
  MAN:  { key: 'MAN',  label: 'Manuell',       icon: '\uD83D\uDD90\uFE0F', color: 'var(--text-muted)' },
};

/* ── Categories ────────────────────────────────────────────────────────────── */

export interface Category {
  nr: number;
  key: string;
  label: string;
  emoji: string;
}

export interface CategoryGroup {
  label: string;
  color: string;
  emoji: string;
  categories: Category[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: 'Core Operations',
    color: 'var(--accent-blue)',
    emoji: '\uD83D\uDD35',
    categories: [
      { nr: 1,  key: 'DATA',    label: 'Datenverarbeitung',  emoji: '\uD83D\uDCE6' },
      { nr: 2,  key: 'REPORT',  label: 'Reporting',          emoji: '\uD83D\uDCCA' },
      { nr: 3,  key: 'INTEG',   label: 'Integrations',       emoji: '\uD83D\uDD17' },
      { nr: 4,  key: 'NOTIFY',  label: 'Benachrichtigungen', emoji: '\uD83D\uDD14' },
      { nr: 5,  key: 'KNOW',    label: 'Knowledge',          emoji: '\uD83D\uDCDA' },
      { nr: 6,  key: 'CONTENT', label: 'Content',            emoji: '\u270F\uFE0F' },
      { nr: 7,  key: 'ADMIN',   label: 'Admin-Tasks',        emoji: '\u2699\uFE0F' },
    ],
  },
  {
    label: 'Business & Operations',
    color: 'var(--accent-green)',
    emoji: '\uD83D\uDFE2',
    categories: [
      { nr: 8,  key: 'CRM',     label: 'CRM / Sales',       emoji: '\uD83D\uDCBC' },
      { nr: 9,  key: 'MKTG',    label: 'Marketing',         emoji: '\uD83D\uDCE3' },
      { nr: 10, key: 'FIN',     label: 'Finance / Billing',  emoji: '\uD83D\uDCB0' },
      { nr: 11, key: 'HR',      label: 'HR / People',        emoji: '\uD83D\uDC65' },
      { nr: 12, key: 'SUPPORT', label: 'Customer Support',   emoji: '\uD83C\uDFA7' },
      { nr: 13, key: 'ECOM',    label: 'E-Commerce',         emoji: '\uD83D\uDED2' },
    ],
  },
  {
    label: 'Technik & Infrastruktur',
    color: 'var(--accent-amber)',
    emoji: '\uD83D\uDFE1',
    categories: [
      { nr: 14, key: 'MON',    label: 'Monitoring',         emoji: '\uD83D\uDCE1' },
      { nr: 15, key: 'SEC',    label: 'Security',           emoji: '\uD83D\uDD12' },
      { nr: 16, key: 'DEVOPS', label: 'DevOps / CI/CD',     emoji: '\uD83D\uDE80' },
      { nr: 27, key: 'BACKUP', label: 'Backup & Recovery',  emoji: '\uD83D\uDCBE' },
    ],
  },
  {
    label: 'KI & Automatisierung',
    color: '#f97316',
    emoji: '\uD83D\uDFE0',
    categories: [
      { nr: 17, key: 'AI',      label: 'AI / Machine Learning', emoji: '\uD83E\uDD16' },
      { nr: 18, key: 'SCRAPE',  label: 'Scraping / Crawling',   emoji: '\uD83D\uDD77\uFE0F' },
      { nr: 19, key: 'ENRICH',  label: 'Enrichment',            emoji: '\uD83D\uDD0D' },
      { nr: 20, key: 'ORCH',    label: 'Orchestration',         emoji: '\uD83C\uDFAF' },
    ],
  },
  {
    label: 'Kommunikation',
    color: 'var(--accent-red)',
    emoji: '\uD83D\uDD34',
    categories: [
      { nr: 21, key: 'COMM',    label: 'Communication',    emoji: '\uD83D\uDCAC' },
      { nr: 22, key: 'COLLAB',  label: 'Collaboration',    emoji: '\uD83E\uDD1D' },
      { nr: 23, key: 'APPROVE', label: 'Approval / Freigaben', emoji: '\u270B' },
    ],
  },
  {
    label: 'Strategie & Planung',
    color: 'var(--accent-purple)',
    emoji: '\uD83D\uDFE3',
    categories: [
      { nr: 24, key: 'ANALYTICS', label: 'Analytics',           emoji: '\uD83D\uDCC8' },
      { nr: 25, key: 'LEGAL',     label: 'Compliance / Legal',  emoji: '\u2696\uFE0F' },
      { nr: 26, key: 'PM',        label: 'Project Management',  emoji: '\uD83D\uDCCB' },
    ],
  },
];

/* ── Helpers ───────────────────────────────────────────────────────────────── */

/** All categories flat */
export const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap((g) => g.categories);

/** Find category by key */
export function getCategoryByKey(key: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.key === key.toUpperCase());
}

/** Find category group for a category nr */
export function getGroupForCategory(nr: number): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find((g) => g.categories.some((c) => c.nr === nr));
}

/**
 * Infer category from workflow name using pattern matching.
 * Falls back to name-based heuristics.
 */
const NAME_PATTERNS: { pattern: RegExp; key: string }[] = [
  { pattern: /trend|research|sentiment|analysis|niche|forecast|insight|scout/i, key: 'AI' },
  { pattern: /content|blog|social|publish|digest|summary|voice|image|audio|tts/i, key: 'CONTENT' },
  { pattern: /telegram|slack|email|notification|notify|approval|callback/i, key: 'COMM' },
  { pattern: /ingest|mobile|obsidian|webhook|sync/i, key: 'DATA' },
  { pattern: /monitor|health|backup|alert|status|report/i, key: 'MON' },
  { pattern: /brain|router|task|orchestr/i, key: 'ORCH' },
  { pattern: /template|hook|enrich/i, key: 'ENRICH' },
  { pattern: /embed|index|scan/i, key: 'KNOW' },
  { pattern: /deploy|devops|ci|cd/i, key: 'DEVOPS' },
  { pattern: /scrape|crawl|adzuna/i, key: 'SCRAPE' },
  { pattern: /batch|pipeline|master/i, key: 'CONTENT' },
  { pattern: /postiz|gdrive|drive/i, key: 'INTEG' },
];

export function inferCategory(name: string, directusCategory?: string): Category {
  // 1. Try Directus category field
  if (directusCategory) {
    const cat = getCategoryByKey(directusCategory);
    if (cat) return cat;
  }

  // 2. Try name pattern matching
  for (const { pattern, key } of NAME_PATTERNS) {
    if (pattern.test(name)) {
      const cat = getCategoryByKey(key);
      if (cat) return cat;
    }
  }

  // 3. Fallback
  return { nr: 7, key: 'ADMIN', label: 'Admin-Tasks', emoji: '\u2699\uFE0F' };
}

/**
 * Infer schedule tag from schedule string or workflow name.
 */
export function inferScheduleTag(schedule?: string, name?: string): ScheduleTag {
  if (!schedule && !name) return SCHEDULE_TAGS.MAN;
  const s = (schedule ?? '').toLowerCase();
  const n = (name ?? '').toLowerCase();

  if (s.includes('realtime') || s.includes('webhook') || n.includes('webhook') || n.includes('callback')) return SCHEDULE_TAGS.RT;
  if (s.includes('min') || /\/\d+\s*min/i.test(s)) return SCHEDULE_TAGS.MIN;
  if (s.includes('hour') || s.includes('stund') || /\/\d+\s*h/i.test(s)) return SCHEDULE_TAGS.HOR;
  if (s.includes('daily') || s.includes('tagl') || s.includes('day') || /\d{2}:\d{2}/.test(s)) return SCHEDULE_TAGS.DAY;
  if (s.includes('week') || s.includes('woch') || /mo|di|mi|do|fr|sa|so/i.test(s)) return SCHEDULE_TAGS.WEEK;
  if (s.includes('month') || s.includes('monat')) return SCHEDULE_TAGS.MON;
  if (s.includes('quarter') || s.includes('quartal')) return SCHEDULE_TAGS.QRT;
  if (s.includes('year') || s.includes('jahr')) return SCHEDULE_TAGS.YEAR;

  // Name-based inference
  if (n.includes('daily') || n.includes('morning') || n.includes('digest')) return SCHEDULE_TAGS.DAY;
  if (n.includes('weekly') || n.includes('summary')) return SCHEDULE_TAGS.WEEK;
  if (n.includes('telegram') || n.includes('webhook')) return SCHEDULE_TAGS.RT;

  return SCHEDULE_TAGS.MAN;
}
