/** Humanize n8n workflow names like "30_310_TREND_MONITOR" → "Trend Monitor" */
export function humanizeWorkflowName(name: string): string {
  return name
    .replace(/^\d+_\d+_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export type WorkflowGroup = 'Research' | 'Content' | 'Automation' | 'Monitoring' | 'Other';

const LAYER_TO_GROUP: Record<string, WorkflowGroup> = {
  '100_INGEST': 'Automation',
  '200_BRAIN': 'Automation',
  '300_RESEARCH': 'Research',
  '400_CONTENT': 'Content',
  '500_HUMAN': 'Content',
};

const NAME_PATTERNS: { pattern: RegExp; group: WorkflowGroup }[] = [
  { pattern: /health|backup|monitor|alert|cron/i, group: 'Monitoring' },
  { pattern: /trend|research|sentiment|analysis|scout/i, group: 'Research' },
  { pattern: /content|blog|social|publish|digest|summary/i, group: 'Content' },
  { pattern: /ingest|telegram|mobile|webhook/i, group: 'Automation' },
];

export function getWorkflowGroup(layer?: string, name?: string): WorkflowGroup {
  if (layer && LAYER_TO_GROUP[layer]) return LAYER_TO_GROUP[layer];
  if (name) {
    for (const { pattern, group } of NAME_PATTERNS) {
      if (pattern.test(name)) return group;
    }
  }
  return 'Other';
}

export const WORKFLOW_GROUPS: WorkflowGroup[] = ['Research', 'Content', 'Automation', 'Monitoring', 'Other'];

export const GROUP_META: Record<WorkflowGroup, { color: string; description: string }> = {
  Research: { color: 'var(--accent-blue)', description: 'Trends, Marktanalyse, Sentiment' },
  Content: { color: 'var(--accent-purple)', description: 'Content Pipeline, Publishing' },
  Automation: { color: 'var(--accent-green)', description: 'Ingest, Webhooks, Bots' },
  Monitoring: { color: 'var(--accent-amber)', description: 'Health Checks, Backups' },
  Other: { color: 'var(--text-muted)', description: 'Sonstige Workflows' },
};
