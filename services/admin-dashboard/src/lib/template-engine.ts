/**
 * Template Engine — {{VARIABLE}} substitution system
 *
 * Syntax: {{VARIABLE_NAME}} — uppercase, underscores allowed
 * System variables are auto-filled on init.
 */

export type VariableType = 'text' | 'date' | 'url' | 'email' | 'number' | 'multiline';

export interface VariableDef {
  name: string;
  type: VariableType;
  label?: string;
  default?: string;
  system?: boolean;
}

// ── System variables (auto-filled) ──────────────────────────────────────────

export const SYSTEM_VARS: VariableDef[] = [
  { name: 'DATE',    type: 'date',   label: 'Heutiges Datum',   system: true },
  { name: 'DATUM',   type: 'date',   label: 'Heutiges Datum',   system: true },
  { name: 'TIME',    type: 'text',   label: 'Aktuelle Uhrzeit', system: true },
  { name: 'USER',    type: 'text',   label: 'Nutzername',       system: true },
  { name: 'AUTOR',   type: 'text',   label: 'Autor',            system: true },
  { name: 'PROJECT', type: 'text',   label: 'Projektname',      system: true },
  { name: 'ENV',     type: 'text',   label: 'Umgebung',         system: true },
  { name: 'YEAR',    type: 'text',   label: 'Jahr',             system: true },
  { name: 'MONTH',   type: 'text',   label: 'Monat',            system: true },
];

const SYSTEM_VAR_NAMES = new Set(SYSTEM_VARS.map(v => v.name));

function getSystemValue(name: string): string {
  const now = new Date();
  switch (name) {
    case 'DATE':
    case 'DATUM':  return now.toLocaleDateString('de-DE');
    case 'TIME':   return now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    case 'YEAR':   return String(now.getFullYear());
    case 'MONTH':  return now.toLocaleDateString('de-DE', { month: 'long' });
    case 'USER':
    case 'AUTOR':  return (typeof window !== 'undefined' ? localStorage.getItem('aios_user') : null) ?? 'Timo Götz';
    case 'PROJECT': return (typeof window !== 'undefined' ? localStorage.getItem('aios_project') : null) ?? 'AI-OS';
    case 'ENV':    return process.env.NODE_ENV ?? 'production';
    default:       return '';
  }
}

// ── Core functions ────────────────────────────────────────────────────────────

/** Extract all unique {{VARIABLE}} names from template content */
export function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{([A-Z_0-9]+)\}\}/g) ?? [];
  return Array.from(new Set(matches.map(m => m.slice(2, -2))));
}

/** Replace {{VARIABLE}} with values (unfilled vars kept as-is) */
export function fillTemplate(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{([A-Z_0-9]+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`);
}

/** Initialize variable values — system vars auto-filled, user vars empty */
export function initVariableValues(vars: string[]): Record<string, string> {
  return Object.fromEntries(
    vars.map(v => [v, SYSTEM_VAR_NAMES.has(v) ? getSystemValue(v) : ''])
  );
}

/** Check if a variable name is a system variable */
export function isSystemVar(name: string): boolean {
  return SYSTEM_VAR_NAMES.has(name);
}

/** Build variable definitions for a given list of variable names */
export function buildVarDefs(names: string[]): VariableDef[] {
  return names.map(name => {
    const sys = SYSTEM_VARS.find(v => v.name === name);
    if (sys) return sys;
    return { name, type: 'text' as VariableType };
  });
}

// ── LocalStorage: Recent Templates ───────────────────────────────────────────

const LS_RECENT_KEY = 'aios_recent_templates';
const MAX_RECENT = 5;

export interface RecentTemplate {
  id: number;
  name: string;
  kategorie: string;
  usedAt: string;
}

export function getRecentTemplates(): RecentTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_RECENT_KEY) ?? '[]');
  } catch { return []; }
}

export function trackTemplateUse(template: { Id: number; Name: string; Kategorie: string }): void {
  if (typeof window === 'undefined') return;
  const recents = getRecentTemplates().filter(r => r.id !== template.Id);
  recents.unshift({ id: template.Id, name: template.Name, kategorie: template.Kategorie, usedAt: new Date().toISOString() });
  localStorage.setItem(LS_RECENT_KEY, JSON.stringify(recents.slice(0, MAX_RECENT)));
  window.dispatchEvent(new Event('aios:templates:updated'));
}

// ── JSON Export ────────────────────────────────────────────────────────────────

export function exportTemplatesAsJson(
  templates: Array<{ Id: number; Name: string; Kategorie: string; Inhalt: string; Variablen?: string; Beschreibung?: string; Tags?: string }>
): void {
  const blob = new Blob([JSON.stringify(templates, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aios-templates-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
