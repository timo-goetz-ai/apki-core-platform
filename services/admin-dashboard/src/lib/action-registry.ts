// ── AIOS Command Registry ─────────────────────────────────────────────────────
// Shared between the API route and any UI consumers (CommandPalette, etc.)

export interface CommandDef {
  intent: string;
  description: string;
  params?: Record<string, string>;
  example?: string;
  category: 'navigation' | 'deployment' | 'workflow' | 'monitoring' | 'ai';
  navigate?: string;
}

export const COMMAND_REGISTRY: CommandDef[] = [
  // Navigation
  { intent: 'open_cockpit',          description: 'Open the main cockpit dashboard',  category: 'navigation', navigate: '/' },
  { intent: 'open_claude_workspace', description: 'Open Claude AI workspace',         category: 'navigation', navigate: '/claude-workspace' },
  { intent: 'open_deployments',      description: 'Open deployments page',            category: 'navigation', navigate: '/deployments' },
  { intent: 'open_workflows',        description: 'Open n8n workflows',               category: 'navigation', navigate: '/workflows' },
  { intent: 'open_analytics',        description: 'Open analytics / Grafana',         category: 'navigation', navigate: '/analytics' },

  // Deployment
  {
    intent: 'deploy_app',
    description: 'Deploy a Coolify application by UUID',
    params: { uuid: 'string — Coolify application UUID' },
    example: '{ "uuid": "abc-123" }',
    category: 'deployment',
  },
  {
    intent: 'restart_app',
    description: 'Restart a Coolify application',
    params: { uuid: 'string — Coolify application UUID' },
    category: 'deployment',
  },
  {
    intent: 'get_deployments',
    description: 'List all Coolify deployments and their status',
    category: 'deployment',
  },

  // Workflow
  {
    intent: 'list_workflows',
    description: 'List all n8n workflows from NocoDB registry',
    category: 'workflow',
  },
  {
    intent: 'run_workflow',
    description: 'Trigger an n8n workflow via webhook',
    params: { workflowId: 'string — n8n workflow ID or name' },
    category: 'workflow',
  },

  // Monitoring
  {
    intent: 'get_service_status',
    description: 'Get health status of all core services',
    category: 'monitoring',
  },
  {
    intent: 'get_logs',
    description: 'Fetch recent error logs from NocoDB',
    category: 'monitoring',
  },

  // AI
  {
    intent: 'ask_ai',
    description: 'Send a message to the AIOS AI assistant',
    params: { message: 'string — question or command' },
    example: '{ "message": "Which services are down?" }',
    category: 'ai',
  },
];
