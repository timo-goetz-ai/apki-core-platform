/**
 * Workflow Kategorie-System — Operations Center
 *
 * Nummerierung: [Kategorie-Nr]_[Laufende Nr]_[Kuerzel]
 * Beispiel: 17_020_AI → Kategorie 17 (AI), Workflow Nr. 020
 */

/* ── Schedule Tags ─────────────────────────────────────────────────────────── */

export interface ScheduleTag {
  key: string;
  label: string;
  icon: string;
  color: string;
}

export const SCHEDULE_TAGS: Record<string, ScheduleTag> = {
  RT:   { key: 'RT',   label: 'Realtime',     icon: '⚡', color: 'var(--accent-green)' },
  MIN:  { key: 'MIN',  label: 'Minütlich',    icon: '🔄', color: 'var(--accent-blue)' },
  HOR:  { key: 'HOR',  label: 'Stündlich',    icon: '🕐', color: 'var(--accent-blue)' },
  DAY:  { key: 'DAY',  label: 'Täglich',      icon: '📅', color: 'var(--accent-amber)' },
  WEEK: { key: 'WEEK', label: 'Wöchentlich',  icon: '📆', color: '#a855f7' },
  MON:  { key: 'MON',  label: 'Monatlich',    icon: '🗓️', color: 'var(--text-secondary)' },
  QRT:  { key: 'QRT',  label: 'Quartalsweise',icon: '📊', color: 'var(--text-secondary)' },
  YEAR: { key: 'YEAR', label: 'Jährlich',     icon: '🗂️', color: 'var(--text-muted)' },
  MAN:  { key: 'MAN',  label: 'Manuell',      icon: '🖐️', color: 'var(--text-muted)' },
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
    emoji: '🔵',
    categories: [
      { nr: 1,  key: 'DATA',    label: 'Datenverarbeitung',  emoji: '📦' },
      { nr: 2,  key: 'REPORT',  label: 'Reporting',          emoji: '📊' },
      { nr: 3,  key: 'INTEG',   label: 'Integrations',       emoji: '🔗' },
      { nr: 4,  key: 'NOTIFY',  label: 'Benachrichtigungen', emoji: '🔔' },
      { nr: 5,  key: 'KNOW',    label: 'Knowledge',          emoji: '📚' },
      { nr: 6,  key: 'CONTENT', label: 'Content',            emoji: '✏️' },
      { nr: 7,  key: 'ADMIN',   label: 'Admin-Tasks',        emoji: '⚙️' },
    ],
  },
  {
    label: 'Business & Operations',
    color: 'var(--accent-green)',
    emoji: '🟢',
    categories: [
      { nr: 8,  key: 'CRM',     label: 'CRM / Sales',        emoji: '💼' },
      { nr: 9,  key: 'MKTG',    label: 'Marketing',          emoji: '📣' },
      { nr: 10, key: 'FIN',     label: 'Finance / Billing',  emoji: '💰' },
      { nr: 11, key: 'HR',      label: 'HR / People',        emoji: '👥' },
      { nr: 12, key: 'SUPPORT', label: 'Customer Support',   emoji: '🎧' },
      { nr: 13, key: 'ECOM',    label: 'E-Commerce',         emoji: '🛒' },
    ],
  },
  {
    label: 'Technik & Infrastruktur',
    color: 'var(--accent-amber)',
    emoji: '🟡',
    categories: [
      { nr: 14, key: 'MON',    label: 'Monitoring',          emoji: '📡' },
      { nr: 15, key: 'SEC',    label: 'Security',            emoji: '🔒' },
      { nr: 16, key: 'DEVOPS', label: 'DevOps / CI/CD',      emoji: '🚀' },
      { nr: 27, key: 'BACKUP', label: 'Backup & Recovery',   emoji: '💾' },
    ],
  },
  {
    label: 'KI & Automatisierung',
    color: '#f97316',
    emoji: '🟠',
    categories: [
      { nr: 17, key: 'AI',     label: 'AI / Machine Learning', emoji: '🤖' },
      { nr: 18, key: 'SCRAPE', label: 'Scraping / Crawling',   emoji: '🕷️' },
      { nr: 19, key: 'ENRICH', label: 'Enrichment',            emoji: '🔍' },
      { nr: 20, key: 'ORCH',   label: 'Orchestration',         emoji: '🎯' },
    ],
  },
  {
    label: 'Kommunikation',
    color: 'var(--accent-red)',
    emoji: '🔴',
    categories: [
      { nr: 21, key: 'COMM',    label: 'Communication',        emoji: '💬' },
      { nr: 22, key: 'COLLAB',  label: 'Collaboration',        emoji: '🤝' },
      { nr: 23, key: 'APPROVE', label: 'Approval / Freigaben', emoji: '✋' },
    ],
  },
  {
    label: 'Strategie & Planung',
    color: '#a855f7',
    emoji: '🟣',
    categories: [
      { nr: 24, key: 'ANALYTICS', label: 'Analytics',          emoji: '📈' },
      { nr: 25, key: 'LEGAL',     label: 'Compliance / Legal', emoji: '⚖️' },
      { nr: 26, key: 'PM',        label: 'Project Management', emoji: '📋' },
    ],
  },
];

/* ── Workflow Catalog ──────────────────────────────────────────────────────── */

export interface WorkflowCatalogEntry {
  /** n8n workflow ID */
  n8nId: string;
  /** Neues Schema-ID: [Kat-Nr]_[Lfd-Nr]_[Kürzel] */
  newId: string;
  /** Kategorie-Key (muss in CATEGORY_GROUPS existieren) */
  categoryKey: string;
  /** Schedule-Tag-Key */
  scheduleKey: string;
  /** Anzeigename (kurz, prägnant) */
  displayName: string;
  /** Was macht dieser Workflow? (1 Satz) */
  description: string;
  /** Welches Problem löst er? Welchen Nutzen bringt er? */
  benefit: string;
  /** Geschätzte Zeitersparnis pro Woche in Stunden */
  savesHoursPerWeek: number;
  /** Zeitplan-Anzeige z. B. "tägl. 08:00" */
  runFrequency: string;
  /** 4–6 kurze Tags — beschreiben den Workflow ohne Sätze */
  chips: string[];
}

export const WORKFLOW_CATALOG: WorkflowCatalogEntry[] = [
  // ── LAYER 1: DATA INGEST ────────────────────────────────────────────────
  {
    n8nId: '5Z40XFuhRrzoMjn8',
    newId: '01_010_DATA',
    categoryKey: 'DATA',
    scheduleKey: 'RT',
    displayName: 'Data Ingest Webhook',
    description: 'Zentraler Eingangs-Webhook für alle externen Datenquellen.',
    benefit: 'Kein manuelles Copy-Paste mehr — Daten landen automatisch im System.',
    savesHoursPerWeek: 2,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#echtzeit', '#daten-eingang', '#extern', '#api'],
  },
  {
    n8nId: 'Hm2vYhgiNvOoi34P',
    newId: '01_020_DATA',
    categoryKey: 'DATA',
    scheduleKey: 'RT',
    displayName: 'Mobile Ingest',
    description: 'Verarbeitet Handy-Uploads, Fotos und mobile Spracheingaben.',
    benefit: 'Unterwegs erfasste Ideen landen sofort strukturiert im System.',
    savesHoursPerWeek: 1,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#mobil', '#handy', '#upload', '#echtzeit'],
  },
  {
    n8nId: 'tyxpBpGZfWr1SXHY',
    newId: '01_030_DATA',
    categoryKey: 'DATA',
    scheduleKey: 'RT',
    displayName: 'Obsidian Sync',
    description: 'Synchronisiert Obsidian-Notizen bidirektional ins AIOS.',
    benefit: 'Wissen aus dem PKM wird automatisch für KI-Workflows nutzbar.',
    savesHoursPerWeek: 1,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#obsidian', '#notizen', '#sync', '#pkm'],
  },
  // ── LAYER 2: REPORTING ──────────────────────────────────────────────────
  {
    n8nId: 'zb9g2zj7SKptuBRq',
    newId: '02_010_REPORT',
    categoryKey: 'REPORT',
    scheduleKey: 'DAY',
    displayName: 'Daily Digest',
    description: 'Tägliche Zusammenfassung aller Aktivitäten via Telegram.',
    benefit: 'Vollständiger Überblick ohne Dashboard öffnen — direkt aufs Handy.',
    savesHoursPerWeek: 2,
    runFrequency: 'tägl. 08:00',
    chips: ['#täglich', '#zusammenfassung', '#telegram', '#08:00', '#automatisch'],
  },
  {
    n8nId: 'xxBJQVAd3CSB8ytc',
    newId: '02_020_REPORT',
    categoryKey: 'REPORT',
    scheduleKey: 'WEEK',
    displayName: 'Weekly Summary',
    description: 'Wöchentlicher Strategiebericht mit KPIs und Highlights.',
    benefit: 'Wochenrückblick automatisch — keine manuelle Auswertung nötig.',
    savesHoursPerWeek: 1.5,
    runFrequency: 'Mo. 09:00',
    chips: ['#wöchentlich', '#bericht', '#kpis', '#montag', '#strategie'],
  },
  // ── LAYER 6: CONTENT ────────────────────────────────────────────────────
  {
    n8nId: '4jCqinBKiFKJmdor',
    newId: '06_010_CONTENT',
    categoryKey: 'CONTENT',
    scheduleKey: 'RT',
    displayName: 'Content Pipeline',
    description: 'Haupt-Produktionspipeline für alle Content-Formate.',
    benefit: 'Content-Produktion von Idee bis Publish vollständig automatisiert.',
    savesHoursPerWeek: 5,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#content', '#pipeline', '#ki-gestützt', '#multi-format'],
  },
  {
    n8nId: '7a35eb371a664a54',
    newId: '06_020_CONTENT',
    categoryKey: 'CONTENT',
    scheduleKey: 'RT',
    displayName: 'Content Enrichment',
    description: 'Reichert Content mit Metadaten, Keywords und SEO-Daten an.',
    benefit: 'Automatische Qualitätssteigerung ohne manuelles Nacharbeiten.',
    savesHoursPerWeek: 2,
    runFrequency: 'on_demand',
    chips: ['#sub-workflow', '#anreicherung', '#seo', '#metadaten', '#qualität'],
  },
  {
    n8nId: 'xptdJvE2eiTNTtK0',
    newId: '06_030_CONTENT',
    categoryKey: 'CONTENT',
    scheduleKey: 'RT',
    displayName: 'Multi Hook Generator',
    description: 'Generiert 5–10 Hook-Varianten für jeden Content-Typ.',
    benefit: 'Mehr A/B-Optionen ohne Kreativ-Aufwand — höhere Klickrate.',
    savesHoursPerWeek: 3,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#hooks', '#varianten', '#social-media', '#ki'],
  },
  {
    n8nId: '01c513e059034263',
    newId: '06_040_CONTENT',
    categoryKey: 'CONTENT',
    scheduleKey: 'RT',
    displayName: 'Template Engine',
    description: 'Erstellt Content auf Basis vordefierter Templates.',
    benefit: 'Konsistenter Brand-Voice ohne jedes Mal neu formulieren.',
    savesHoursPerWeek: 2,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#templates', '#brand-voice', '#automatisch', '#skalierbar'],
  },
  {
    n8nId: 'OrnQY2MvsHEvxkKq',
    newId: '06_050_CONTENT',
    categoryKey: 'CONTENT',
    scheduleKey: 'RT',
    displayName: 'Fish Audio TTS',
    description: 'Konvertiert Text zu Audio via Fish Audio TTS.',
    benefit: 'Podcast- und Voice-Content ohne Studio oder Sprechzeit.',
    savesHoursPerWeek: 3,
    runFrequency: 'on_demand',
    chips: ['#tts', '#audio', '#stimme', '#fish-audio', '#podcast'],
  },
  {
    n8nId: '54K5vv1JsBh0qOd3',
    newId: '06_060_CONTENT',
    categoryKey: 'CONTENT',
    scheduleKey: 'RT',
    displayName: 'Voice AI Agent',
    description: 'KI-Agent für die Produktion von Audio-Inhalten.',
    benefit: 'Vollautomatische Voice-Content-Pipeline (noch in Entwicklung).',
    savesHoursPerWeek: 0,
    runFrequency: 'on_demand',
    chips: ['#voice', '#ki-agent', '#audio', '#in-entwicklung', '#openrouter'],
  },
  {
    n8nId: 'JiIy6P0XDxT0fq9M',
    newId: '06_070_CONTENT',
    categoryKey: 'CONTENT',
    scheduleKey: 'MAN',
    displayName: 'Content Trigger',
    description: 'Manueller Auslöser für die Content-Produktionspipeline.',
    benefit: 'Sofortiger Content-Start auf Knopfdruck ohne technisches Wissen.',
    savesHoursPerWeek: 0.5,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#trigger', '#manuell', '#content-start', '#steuerung'],
  },
  // ── LAYER 8: CRM ─────────────────────────────────────────────────────────
  {
    n8nId: 'auto-bewerbung-v1',
    newId: '08_010_CRM',
    categoryKey: 'CRM',
    scheduleKey: 'RT',
    displayName: 'Bewerbungs Creator',
    description: 'Erstellt KI-optimierte Bewerbungsunterlagen automatisch.',
    benefit: 'Professionelle Bewerbungen in Minuten statt Stunden.',
    savesHoursPerWeek: 1,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#bewerbung', '#ki', '#job-scout', '#personalisiert'],
  },
  // ── LAYER 14: MONITORING ─────────────────────────────────────────────────
  {
    n8nId: 's9QO3zVWQQCdeWIY',
    newId: '14_010_MON',
    categoryKey: 'MON',
    scheduleKey: 'MAN',
    displayName: 'Status Report',
    description: 'Generiert einen vollständigen System-Status-Report.',
    benefit: 'Sofortiger Überblick über alle Services ohne manuelles Prüfen.',
    savesHoursPerWeek: 0.5,
    runFrequency: 'on_demand',
    chips: ['#manuell', '#status', '#system', '#report', '#infra'],
  },
  // ── LAYER 16: DEVOPS ─────────────────────────────────────────────────────
  {
    n8nId: 'l0KwW79yZZnRX5LI',
    newId: '16_010_DEVOPS',
    categoryKey: 'DEVOPS',
    scheduleKey: 'DAY',
    displayName: 'Workflow Index Sync',
    description: 'Aktualisiert täglich den Workflow-Index in Directus.',
    benefit: 'Dashboard immer aktuell — kein manuelles Pflegen nötig.',
    savesHoursPerWeek: 1,
    runFrequency: 'tägl. 06:00',
    chips: ['#täglich', '#directus', '#index', '#sync', '#06:00'],
  },
  {
    n8nId: 'rSu4WTtg0njYzgGy',
    newId: '16_020_DEVOPS',
    categoryKey: 'DEVOPS',
    scheduleKey: 'RT',
    displayName: 'System Logger',
    description: 'Loggt alle System-Events und erstellt einen Audit-Trail.',
    benefit: 'Vollständige Nachvollziehbarkeit aller Aktionen im System.',
    savesHoursPerWeek: 1,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#logging', '#audit-trail', '#system', '#compliance'],
  },
  {
    n8nId: '4xOegjEpSe8Jmruv',
    newId: '16_030_DEVOPS',
    categoryKey: 'DEVOPS',
    scheduleKey: 'RT',
    displayName: 'AIOS Discovery',
    description: 'Erkennt automatisch neue Services und Agenten im System.',
    benefit: 'Keine manuelle Service-Registrierung — Plug & Play für neue Komponenten.',
    savesHoursPerWeek: 0.5,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#discovery', '#services', '#agenten', '#plug-and-play'],
  },
  {
    n8nId: 'o9Bee0DoJoGp3fl9',
    newId: '16_040_DEVOPS',
    categoryKey: 'DEVOPS',
    scheduleKey: 'RT',
    displayName: 'Workflow Control',
    description: 'Startet und stoppt Workflows via Telegram-Befehl.',
    benefit: 'Vollständige Workflow-Steuerung vom Handy aus, jederzeit.',
    savesHoursPerWeek: 0.5,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#telegram', '#steuerung', '#remote', '#devops'],
  },
  // ── LAYER 17: AI ─────────────────────────────────────────────────────────
  {
    n8nId: 'FA8BIXRqmY9PTrT0',
    newId: '17_010_AI',
    categoryKey: 'AI',
    scheduleKey: 'RT',
    displayName: 'AI Chat Router',
    description: 'Leitet Chat-Anfragen intelligent an den passenden KI-Agenten.',
    benefit: 'Jede Anfrage landet beim richtigen Agenten — kein manuelles Routing.',
    savesHoursPerWeek: 2,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#ki-routing', '#agenten', '#chat', '#intelligent'],
  },
  {
    n8nId: 'fEYWN4pWhRcG2tLg',
    newId: '17_020_AI',
    categoryKey: 'AI',
    scheduleKey: 'DAY',
    displayName: 'Trend Monitor',
    description: 'Analysiert täglich aktuelle Trends via Gemini 2.0 Flash.',
    benefit: 'Tägliche Markt-Trends ohne stundenlange Recherche — direkt nutzbar.',
    savesHoursPerWeek: 3,
    runFrequency: 'tägl. 08:00',
    chips: ['#täglich', '#trends', '#gemini', '#research', '#08:00'],
  },
  {
    n8nId: 'Vx1Aea5glbogJxg6',
    newId: '17_030_AI',
    categoryKey: 'AI',
    scheduleKey: 'WEEK',
    displayName: 'Sentiment Tracker',
    description: 'Wöchentliche Sentiment-Analyse von Markt und Community.',
    benefit: 'Stimmungsbild der Zielgruppe automatisch — bessere Content-Entscheidungen.',
    savesHoursPerWeek: 2,
    runFrequency: 'Mo. 08:00',
    chips: ['#wöchentlich', '#sentiment', '#markt', '#gemini', '#montag'],
  },
  {
    n8nId: 'I6LcxlyMM8TU7A7V',
    newId: '17_040_AI',
    categoryKey: 'AI',
    scheduleKey: 'DAY',
    displayName: 'Content Opportunity',
    description: 'Leitet täglich Content-Chancen aus Trend-Daten ab.',
    benefit: 'Konkrete Content-Ideen mit Potenzial — nie mehr Ideenmangel.',
    savesHoursPerWeek: 3,
    runFrequency: 'tägl. 09:30',
    chips: ['#täglich', '#content-chancen', '#trends', '#gemini', '#09:30'],
  },
  // ── LAYER 19: ENRICHMENT ─────────────────────────────────────────────────
  {
    n8nId: 'lAu959jDE7Y7HkH1',
    newId: '19_010_ENRICH',
    categoryKey: 'ENRICH',
    scheduleKey: 'MAN',
    displayName: 'Nischen Scanner',
    description: 'Scannt und analysiert potenzielle Nischenmärkte.',
    benefit: 'Fundierte Nischen-Entscheidungen statt Bauchgefühl.',
    savesHoursPerWeek: 2,
    runFrequency: 'on_demand',
    chips: ['#manuell', '#nischen', '#markt-analyse', '#ki', '#strategie'],
  },
  {
    n8nId: 'qP4WDOQuBXdNs8uy',
    newId: '19_020_ENRICH',
    categoryKey: 'ENRICH',
    scheduleKey: 'RT',
    displayName: 'Nische Aktiviert',
    description: 'Aktiviert eine analysierte Nische für die Content-Pipeline.',
    benefit: 'Nahtloser Übergang von Analyse zu Produktion — kein manueller Schritt.',
    savesHoursPerWeek: 1,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#nischen', '#aktivierung', '#pipeline-start', '#automatisch'],
  },
  // ── LAYER 20: ORCHESTRATION ──────────────────────────────────────────────
  {
    n8nId: 'm56QPPIYRvHTWVY3',
    newId: '20_010_ORCH',
    categoryKey: 'ORCH',
    scheduleKey: 'RT',
    displayName: 'AI Brain Core',
    description: 'Zentraler KI-Orchestrator — das Herzstück des AIOS.',
    benefit: 'Alle KI-Agenten arbeiten koordiniert und kontextbewusst zusammen.',
    savesHoursPerWeek: 5,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#ki-kern', '#orchestrator', '#kritisch', '#zentral'],
  },
  {
    n8nId: '1H2YFTEAFBr4znki',
    newId: '20_020_ORCH',
    categoryKey: 'ORCH',
    scheduleKey: 'RT',
    displayName: 'Task Brain',
    description: 'Task-Routing und Auftragsverwaltung für alle Agenten.',
    benefit: 'Aufgaben werden automatisch priorisiert und dem richtigen Agenten zugewiesen.',
    savesHoursPerWeek: 3,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#task-routing', '#priorisierung', '#agenten', '#ki'],
  },
  // ── LAYER 21: COMMUNICATION ──────────────────────────────────────────────
  {
    n8nId: 'alzvePshdHaw1Znu',
    newId: '21_010_COMM',
    categoryKey: 'COMM',
    scheduleKey: 'RT',
    displayName: 'Telegram Callback',
    description: 'Verarbeitet alle eingehenden Telegram-Button-Callbacks.',
    benefit: 'Interaktive Telegram-Bots ohne Code-Änderungen beim Hinzufügen neuer Aktionen.',
    savesHoursPerWeek: 1,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#telegram', '#callback', '#buttons', '#interaktiv'],
  },
  {
    n8nId: '1J1wYVB9T7sklbOQ',
    newId: '21_020_COMM',
    categoryKey: 'COMM',
    scheduleKey: 'RT',
    displayName: 'Telegram Assistant',
    description: 'KI-gestützter Chat-Assistent direkt in Telegram.',
    benefit: 'KI-Unterstützung jederzeit per Telegram — kein Browser nötig.',
    savesHoursPerWeek: 2,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#telegram', '#ki-assistent', '#chat', '#24/7'],
  },
  // ── LAYER 23: APPROVAL ───────────────────────────────────────────────────
  {
    n8nId: 'bzUMo8BENjHRyvbk',
    newId: '23_010_APPROVE',
    categoryKey: 'APPROVE',
    scheduleKey: 'RT',
    displayName: 'Telegram Approval',
    description: 'Freigabe-Workflow für Content und Aktionen via Telegram.',
    benefit: 'Genehmigungen direkt am Handy — kein Einloggen ins Dashboard nötig.',
    savesHoursPerWeek: 1.5,
    runFrequency: 'on_demand',
    chips: ['#webhook', '#freigabe', '#telegram', '#genehmigung', '#mobil'],
  },
  // ── LAYER 24: ANALYTICS ──────────────────────────────────────────────────
  {
    n8nId: 'r9SjBZvHXrxK2xA2',
    newId: '24_010_ANALYTICS',
    categoryKey: 'ANALYTICS',
    scheduleKey: 'MAN',
    displayName: 'Research Data',
    description: 'Aggregiert und visualisiert alle Research-Daten.',
    benefit: 'Vollständiger Forschungsüberblick auf Abruf — keine manuelle Auswertung.',
    savesHoursPerWeek: 1,
    runFrequency: 'on_demand',
    chips: ['#manuell', '#research', '#daten', '#analytics', '#aggregation'],
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

/** Find catalog entry by n8n workflow ID */
export function getCatalogEntry(n8nId: string): WorkflowCatalogEntry | undefined {
  return WORKFLOW_CATALOG.find((e) => e.n8nId === n8nId);
}

/**
 * Infer category from workflow name using pattern matching.
 * Falls back to name-based heuristics.
 */
const NAME_PATTERNS: { pattern: RegExp; key: string }[] = [
  { pattern: /trend|research|sentiment|analysis|niche|forecast|insight|scout/i, key: 'AI' },
  { pattern: /content|blog|social|publish|digest|summary|voice|image|audio|tts|hook|template/i, key: 'CONTENT' },
  { pattern: /telegram|callback|assistant|chat_router/i, key: 'COMM' },
  { pattern: /approval|approve|freigabe/i, key: 'APPROVE' },
  { pattern: /ingest|mobile|obsidian|webhook.*data/i, key: 'DATA' },
  { pattern: /monitor|health|alert|status_report/i, key: 'MON' },
  { pattern: /brain|router|task.*brain|discovery|orchestr/i, key: 'ORCH' },
  { pattern: /enrich|nisch/i, key: 'ENRICH' },
  { pattern: /logger|devops|ci|cd|index.*sync|workflow.*control/i, key: 'DEVOPS' },
  { pattern: /scrape|crawl|adzuna/i, key: 'SCRAPE' },
  { pattern: /bewerbung|job.*scout/i, key: 'CRM' },
  { pattern: /analytics|report.*data/i, key: 'ANALYTICS' },
];

export function inferCategory(name: string, directusCategory?: string): Category {
  // 1. Try Directus category field
  if (directusCategory) {
    const cat = getCategoryByKey(directusCategory);
    if (cat) return cat;

    // Map German Directus categories to keys
    const categoryMap: Record<string, string> = {
      'daten': 'DATA',
      'devops': 'DEVOPS',
      'system': 'ORCH',
      'ki-chat': 'COMM',
      'content': 'CONTENT',
      'voice': 'CONTENT',
      'job-scout': 'CRM',
    };
    const mapped = categoryMap[directusCategory.toLowerCase()];
    if (mapped) {
      const cat2 = getCategoryByKey(mapped);
      if (cat2) return cat2;
    }
  }

  // 2. Try name pattern matching
  for (const { pattern, key } of NAME_PATTERNS) {
    if (pattern.test(name)) {
      const cat = getCategoryByKey(key);
      if (cat) return cat;
    }
  }

  // 3. Fallback
  return { nr: 7, key: 'ADMIN', label: 'Admin-Tasks', emoji: '⚙️' };
}

/**
 * Infer schedule tag from schedule string or workflow name.
 */
export function inferScheduleTag(schedule?: string, name?: string): ScheduleTag {
  if (!schedule && !name) return SCHEDULE_TAGS.MAN;
  const s = (schedule ?? '').toLowerCase();
  const n = (name ?? '').toLowerCase();

  if (s === 'on_demand' || s.includes('webhook') || n.includes('webhook') || n.includes('callback') || s.includes('sub-workflow')) return SCHEDULE_TAGS.RT;
  if (s.includes('realtime')) return SCHEDULE_TAGS.RT;
  if (s.includes('min') || /\/\d+\s*min/i.test(s)) return SCHEDULE_TAGS.MIN;
  if (s.includes('hour') || s.includes('stund') || /\/\d+\s*h/i.test(s)) return SCHEDULE_TAGS.HOR;
  if (s.includes('daily') || s.includes('taeg') || s.includes('tägl') || /taeglich|täglich/.test(s) || /\d{2}:\d{2}/.test(s)) return SCHEDULE_TAGS.DAY;
  if (s.includes('mo.') || s.includes('week') || s.includes('woch') || /^mo\b/i.test(s)) return SCHEDULE_TAGS.WEEK;
  if (s.includes('month') || s.includes('monat')) return SCHEDULE_TAGS.MON;
  if (s.includes('quarter') || s.includes('quartal')) return SCHEDULE_TAGS.QRT;
  if (s.includes('year') || s.includes('jahr')) return SCHEDULE_TAGS.YEAR;
  if (s === 'manual' || s === 'manuell') return SCHEDULE_TAGS.MAN;

  // Name-based inference
  if (n.includes('daily') || n.includes('morning') || n.includes('digest')) return SCHEDULE_TAGS.DAY;
  if (n.includes('weekly') || n.includes('summary')) return SCHEDULE_TAGS.WEEK;

  return SCHEDULE_TAGS.MAN;
}
