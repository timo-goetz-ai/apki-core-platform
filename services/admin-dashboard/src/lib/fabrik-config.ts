/** Konfiguration „Agenten-Fabrik“ — Stationen + Ausrüstung (nur UI, keine Secrets). */

export interface FabrikLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FabrikStation {
  id: string;
  short: string;
  title: string;
  metaphor: string;
  accent: string;
  links: FabrikLink[];
  agentFocus: string[];
}

export const FABRIK_STATIONS: FabrikStation[] = [
  {
    id: 'werkzeug',
    short: 'A',
    title: 'Gebäude A · Werkzeugkiste',
    metaphor: 'APIs, interne Tools und Greifzangen fürs Operative.',
    accent: '#60a5fa',
    links: [
      { label: 'Tools', href: '/tools' },
      { label: 'API Explorer', href: '/api-explorer' },
      { label: 'Services', href: '/services' },
      { label: 'Deployments', href: '/deployments' },
    ],
    agentFocus: ['HTTP/Webhooks', 'Healthchecks', 'Runbooks'],
  },
  {
    id: 'markt',
    short: 'M',
    title: 'Marktplatz · Meinungen & Flows',
    metaphor: 'Workflows, Research und Content — Austausch & Richtung.',
    accent: '#a78bfa',
    links: [
      { label: 'Workflows', href: '/workflows' },
      { label: 'Knowledge', href: '/knowledge' },
      { label: 'Content Factory', href: '/content-factory' },
      { label: 'Batch Production', href: '/batch-production' },
    ],
    agentFocus: ['Orchestrierung', 'Research-Output', 'Freigaben'],
  },
  {
    id: 'fabrik',
    short: 'F',
    title: 'Fabrik · Plugins, Rules, Skills',
    metaphor: 'MCPs, IDE-Skills, Regeln — schwere Ausstattung.',
    accent: '#f97316',
    links: [
      { label: 'MCP Plattform', href: '/mcp-plattform' },
      { label: 'Claude Workspace', href: '/claude-workspace' },
      { label: 'Raycast', href: '/raycast-workspace' },
      { label: 'Settings', href: '/settings' },
    ],
    agentFocus: ['MCP-Tools', 'Cursor/Claude Rules', 'Skills & Plugins'],
  },
  {
    id: 'triebwerk',
    short: 'T',
    title: 'Triebwerk · Crews & Tasks',
    metaphor: 'Crew-Läufe, Tasks, Live-Telemetrie.',
    accent: '#34d399',
    links: [
      { label: 'Agent Teams', href: '/agents' },
      { label: 'Engine Room · Agents', href: '/agentic-os/engine-room/agents' },
      { label: 'Agentic OS', href: '/agentic-os' },
      { label: 'Registry', href: '/agentic-os/registry' },
    ],
    agentFocus: ['CrewAI', 'Rollen & Goals', 'Task-Outputs'],
  },
];

export const CREW_LOADOUT: Record<string, { stationIds: string[]; kit: string[] }> = {
  'Content Researcher': {
    stationIds: ['markt', 'werkzeug'],
    kit: ['NocoDB Trends', 'RSS/Scanner', 'API Explorer'],
  },
  'Writer & SEO': {
    stationIds: ['markt', 'fabrik'],
    kit: ['Content Factory', 'Prompts/Templates', 'Postiz'],
  },
  'Audience Analyst': {
    stationIds: ['markt', 'triebwerk'],
    kit: ['Workflows', 'Crew Research Tasks'],
  },
  'Opportunity Scorer': {
    stationIds: ['markt', 'werkzeug'],
    kit: ['Knowledge', 'Metriken'],
  },
  'Trend Analyst': {
    stationIds: ['markt'],
    kit: ['Research-Tabellen', 'n8n 300er Layer'],
  },
  'Content Strategist': {
    stationIds: ['markt', 'fabrik'],
    kit: ['Planning', 'Skills-Doku'],
  },
  'Senior Researcher': {
    stationIds: ['werkzeug', 'markt'],
    kit: ['Docs/APIs', 'Tiefenrecherche-Flows'],
  },
  'Synthesis Specialist': {
    stationIds: ['triebwerk', 'markt'],
    kit: ['Crew Kickoff', 'Synthese-Prompts'],
  },
  'Research Analyst': {
    stationIds: ['werkzeug', 'triebwerk'],
    kit: ['Quick Research Crew', 'Tools'],
  },
};
