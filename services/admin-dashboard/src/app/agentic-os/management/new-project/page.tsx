'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderPlus, ChevronRight, ChevronLeft, Check,
  Shield, Globe, Users, Zap, AlertTriangle, CheckCircle2,
  Building2, DollarSign, Clock, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type ProjectType = 'saas' | 'internal' | 'automation' | 'research' | 'client';
type DataSensitivity = 'public' | 'internal' | 'confidential' | 'restricted';
type GeoScope = 'de' | 'eu' | 'global';
type TeamSize = 'solo' | 'small' | 'medium' | 'large';
type SLATier = 'dev' | 'standard' | 'enterprise';

interface ProjectProfile {
  name: string;
  type: ProjectType;
  dataSensitivity: DataSensitivity;
  geoScope: GeoScope;
  budget: string;
  teamSize: TeamSize;
  sla: SLATier;
  integrations: string[];
}

interface SetupReport {
  rbac: string[];
  dsgvo: string[];
  security: string[];
  estimatedCost: string;
  serviceMix: { name: string; reason: string }[];
  warnings: string[];
}

// ── Option Configs ─────────────────────────────────────────────────────────────

const PROJECT_TYPES: { value: ProjectType; label: string; icon: string }[] = [
  { value: 'saas', label: 'SaaS Produkt', icon: '🚀' },
  { value: 'internal', label: 'Internes Tool', icon: '🏢' },
  { value: 'automation', label: 'Automation', icon: '⚡' },
  { value: 'research', label: 'Forschung / PoC', icon: '🔬' },
  { value: 'client', label: 'Kundenprojekt', icon: '🤝' },
];

const INTEGRATIONS_LIST = [
  'n8n', 'NocoDB', 'GitHub', 'Telegram', 'Cloudflare',
  'Hetzner S3', 'Mailtrap', 'Grafana', 'Prometheus', 'Coolify',
  'Qdrant', 'Ollama', 'Claude API', 'AnythingLLM',
];

// ── Report Generator ───────────────────────────────────────────────────────────

function generateReport(p: ProjectProfile): SetupReport {
  const rbac: string[] = [];
  const dsgvo: string[] = [];
  const security: string[] = [];
  const serviceMix: { name: string; reason: string }[] = [];
  const warnings: string[] = [];

  // RBAC
  if (p.teamSize === 'solo') {
    rbac.push('Single-Owner Rolle ausreichend');
  } else {
    rbac.push('Admin / Editor / Viewer Rollen anlegen');
    if (p.type === 'client') rbac.push('Separate Rollen pro Mandant empfohlen');
  }
  if (p.dataSensitivity === 'restricted' || p.dataSensitivity === 'confidential') {
    rbac.push('MFA für alle Nutzer erzwingen');
    rbac.push('Audit-Log aktivieren (NocoDB + Grafana)');
  }

  // DSGVO
  if (p.geoScope === 'de' || p.geoScope === 'eu') {
    dsgvo.push('Datenverarbeitung auf EU-Servern (Hetzner ✓)');
    dsgvo.push('Datenschutzerklärung erforderlich');
    if (p.dataSensitivity !== 'public') {
      dsgvo.push('Verarbeitungsverzeichnis führen (Art. 30 DSGVO)');
      dsgvo.push('Auftragsverarbeitungsvertrag mit Dienstleistern prüfen');
    }
  }
  if (p.geoScope === 'global') {
    dsgvo.push('Drittland-Transfer-Prüfung erforderlich (SCCs / Adequacy)');
    dsgvo.push('Lokale Datenschutzgesetze beachten (CCPA etc.)');
    warnings.push('Globaler Scope: rechtliche Prüfung vor Go-Live empfohlen');
  }

  // Security
  security.push('HTTPS via Traefik (bereits aktiv)');
  if (p.dataSensitivity === 'confidential' || p.dataSensitivity === 'restricted') {
    security.push('Secrets via Coolify Env-Vars (kein Plaintext)');
    security.push('Regelmäßige Hetzner Snapshots aktivieren');
    security.push('Penetrationstest vor Produktivbetrieb empfohlen');
  }
  if (p.integrations.includes('GitHub')) {
    security.push('Branch Protection + Required Reviews aktivieren');
  }

  // Service Mix
  serviceMix.push({ name: 'NocoDB', reason: 'Primäre Datenhaltung' });
  if (p.integrations.includes('n8n') || p.type === 'automation') {
    serviceMix.push({ name: 'n8n', reason: 'Workflow-Automatisierung' });
  }
  if (p.integrations.includes('Grafana') || p.sla !== 'dev') {
    serviceMix.push({ name: 'Grafana + Prometheus', reason: 'Monitoring & Alerting' });
  }
  if (p.integrations.includes('Qdrant')) {
    serviceMix.push({ name: 'Qdrant', reason: 'Vektor-Datenbank für AI-Features' });
  }
  if (p.integrations.includes('Mailtrap')) {
    serviceMix.push({ name: 'Mailtrap', reason: 'E-Mail-Testing & transaktionale Mails' });
  }
  if (p.integrations.includes('Hetzner S3')) {
    serviceMix.push({ name: 'Hetzner S3', reason: 'Objekt-Speicher für Files/Backups' });
  }
  if (p.integrations.includes('Coolify')) {
    serviceMix.push({ name: 'Coolify', reason: 'Deployment & Infrastruktur-Management' });
  }

  // Cost Estimation
  const budgetNum = parseInt(p.budget || '0', 10);
  let costNote = '';
  if (p.sla === 'enterprise') {
    costNote = 'Enterprise SLA: dedizierte Ressourcen, ~80–200 €/Monat zusätzlich';
  } else if (p.sla === 'standard') {
    costNote = 'Standard SLA: geteilte Infra, ~20–50 €/Monat (API-Kosten separat)';
  } else {
    costNote = 'Dev-Tier: minimale Ressourcen, ~0–10 €/Monat';
  }
  if (budgetNum > 0 && budgetNum < 50 && p.sla === 'enterprise') {
    warnings.push(`Budget (${budgetNum} €/Mo) zu niedrig für Enterprise SLA`);
  }

  return { rbac, dsgvo, security, estimatedCost: costNote, serviceMix, warnings };
}

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ['Projekt-Profil', 'Setup-Report', 'Bestätigung'];
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            i + 1 === step
              ? 'bg-[--accent-blue] text-white'
              : i + 1 < step
              ? 'bg-[--accent-green]/20 text-[--accent-green]'
              : 'bg-[--layer-3] text-[--text-muted]',
          )}>
            {i + 1 < step ? <Check size={11} /> : <span>{i + 1}</span>}
            {label}
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'w-8 h-px mx-1',
              i + 1 < step ? 'bg-[--accent-green]' : 'bg-[--border]',
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Option Button ──────────────────────────────────────────────────────────────

function OptionBtn({
  selected, onClick, children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left',
        selected
          ? 'border-[--accent-blue] bg-[--accent-blue]/10 text-[--accent-blue]'
          : 'border-[--border] bg-[--layer-2] text-[--text-secondary] hover:border-[--text-muted]',
      )}
    >
      {children}
    </button>
  );
}

// ── Step 1: Projekt-Profil ─────────────────────────────────────────────────────

function Step1({
  profile, onChange,
}: { profile: ProjectProfile; onChange: (p: Partial<ProjectProfile>) => void }) {
  const toggleIntegration = (name: string) => {
    const has = profile.integrations.includes(name);
    onChange({ integrations: has ? profile.integrations.filter(i => i !== name) : [...profile.integrations, name] });
  };

  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider">Projektname</label>
        <Input
          value={profile.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="z.B. AI-Newsletter-Bot"
          className="max-w-sm"
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider">Projekttyp</label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_TYPES.map(t => (
            <OptionBtn key={t.value} selected={profile.type === t.value} onClick={() => onChange({ type: t.value })}>
              {t.icon} {t.label}
            </OptionBtn>
          ))}
        </div>
      </div>

      {/* Data Sensitivity */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider flex items-center gap-1.5">
          <Shield size={12} /> Datensensitivität
        </label>
        <div className="flex flex-wrap gap-2">
          {([
            { value: 'public', label: 'Öffentlich', color: 'text-[--accent-green]' },
            { value: 'internal', label: 'Intern', color: 'text-[--accent-blue]' },
            { value: 'confidential', label: 'Vertraulich', color: 'text-amber-400' },
            { value: 'restricted', label: 'Streng vertraulich', color: 'text-[--accent-red]' },
          ] as { value: DataSensitivity; label: string; color: string }[]).map(o => (
            <OptionBtn key={o.value} selected={profile.dataSensitivity === o.value} onClick={() => onChange({ dataSensitivity: o.value })}>
              <span className={o.color}>{o.label}</span>
            </OptionBtn>
          ))}
        </div>
      </div>

      {/* Geo Scope */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider flex items-center gap-1.5">
          <Globe size={12} /> Geografischer Scope
        </label>
        <div className="flex gap-2">
          {([
            { value: 'de', label: '🇩🇪 Deutschland' },
            { value: 'eu', label: '🇪🇺 EU' },
            { value: 'global', label: '🌍 Global' },
          ] as { value: GeoScope; label: string }[]).map(o => (
            <OptionBtn key={o.value} selected={profile.geoScope === o.value} onClick={() => onChange({ geoScope: o.value })}>
              {o.label}
            </OptionBtn>
          ))}
        </div>
      </div>

      {/* Team + Budget + SLA */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider flex items-center gap-1.5">
            <Users size={12} /> Team-Größe
          </label>
          <div className="flex flex-col gap-1.5">
            {([
              { value: 'solo', label: 'Solo (1)' },
              { value: 'small', label: 'Klein (2–5)' },
              { value: 'medium', label: 'Mittel (6–20)' },
              { value: 'large', label: 'Groß (20+)' },
            ] as { value: TeamSize; label: string }[]).map(o => (
              <OptionBtn key={o.value} selected={profile.teamSize === o.value} onClick={() => onChange({ teamSize: o.value })}>
                {o.label}
              </OptionBtn>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign size={12} /> Budget (€/Monat)
          </label>
          <Input
            type="number"
            value={profile.budget}
            onChange={e => onChange({ budget: e.target.value })}
            placeholder="0"
            className="w-28"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={12} /> SLA-Tier
          </label>
          <div className="flex flex-col gap-1.5">
            {([
              { value: 'dev', label: 'Dev / Intern' },
              { value: 'standard', label: 'Standard' },
              { value: 'enterprise', label: 'Enterprise' },
            ] as { value: SLATier; label: string }[]).map(o => (
              <OptionBtn key={o.value} selected={profile.sla === o.value} onClick={() => onChange({ sla: o.value })}>
                {o.label}
              </OptionBtn>
            ))}
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={12} /> Integrationen
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEGRATIONS_LIST.map(name => (
            <OptionBtn
              key={name}
              selected={profile.integrations.includes(name)}
              onClick={() => toggleIntegration(name)}
            >
              {name}
            </OptionBtn>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Setup-Report ───────────────────────────────────────────────────────

function Step2({ profile, report }: { profile: ProjectProfile; report: SetupReport }) {
  return (
    <div className="space-y-4">
      {report.warnings.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            {report.warnings.map((w, i) => (
              <p key={i} className="text-sm text-amber-300">{w}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* RBAC */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider flex items-center gap-1.5">
              <Users size={11} /> RBAC & Zugriffsrechte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {report.rbac.map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Check size={11} className="text-[--accent-green] mt-0.5 shrink-0" />
                <span className="text-xs text-[--text-secondary]">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* DSGVO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={11} /> DSGVO & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {report.dsgvo.map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Check size={11} className="text-[--accent-blue] mt-0.5 shrink-0" />
                <span className="text-xs text-[--text-secondary]">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={11} /> Security-Maßnahmen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {report.security.map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Check size={11} className="text-amber-400 mt-0.5 shrink-0" />
                <span className="text-xs text-[--text-secondary]">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Service Mix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[--text-secondary] uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={11} /> Empfohlener Service-Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {report.serviceMix.map((s, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <Zap size={11} className="text-[--accent-blue] mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-[--text-primary]">{s.name}</span>
                  <span className="text-xs text-[--text-muted] ml-1.5">{s.reason}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cost */}
      <Card>
        <CardContent className="py-3 flex items-center gap-2">
          <DollarSign size={14} className="text-[--accent-green]" />
          <span className="text-xs text-[--text-secondary]">{report.estimatedCost}</span>
          {profile.budget && (
            <Badge variant="secondary" className="ml-auto font-mono text-xs">
              Budget: {profile.budget} €/Mo
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Step 3: Bestätigung ────────────────────────────────────────────────────────

function Step3({
  profile, report,
}: { profile: ProjectProfile; report: SetupReport }) {
  const typeLabel = PROJECT_TYPES.find(t => t.value === profile.type);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg border border-[--accent-green]/30 bg-[--accent-green]/10">
        <CheckCircle2 size={16} className="text-[--accent-green]" />
        <p className="text-sm text-[--accent-green]">Alle Checks abgeschlossen — bereit zur Erstellung</p>
      </div>

      <Card>
        <CardContent className="py-4 space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Row label="Name" value={profile.name || '—'} />
            <Row label="Typ" value={`${typeLabel?.icon} ${typeLabel?.label}`} />
            <Row label="Datensensitivität" value={profile.dataSensitivity} />
            <Row label="Geo-Scope" value={profile.geoScope.toUpperCase()} />
            <Row label="Team-Größe" value={profile.teamSize} />
            <Row label="SLA-Tier" value={profile.sla} />
            {profile.budget && <Row label="Budget" value={`${profile.budget} €/Mo`} />}
          </div>
          {profile.integrations.length > 0 && (
            <div className="pt-2 border-t border-[--border]">
              <p className="text-xs text-[--text-muted] mb-1.5">Integrationen</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.integrations.map(i => (
                  <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-[--border]">
            <p className="text-xs text-[--text-muted] mb-1.5">Services ({report.serviceMix.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {report.serviceMix.map(s => (
                <Badge key={s.name} variant="info" className="text-xs">{s.name}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[--text-muted] min-w-[120px]">{label}</span>
      <span className="text-[--text-primary] font-medium">{value}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: ProjectProfile = {
  name: '',
  type: 'automation',
  dataSensitivity: 'internal',
  geoScope: 'de',
  budget: '',
  teamSize: 'solo',
  sla: 'standard',
  integrations: [],
};

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<ProjectProfile>(DEFAULT_PROFILE);
  const [report, setReport] = useState<SetupReport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const updateProfile = (partial: Partial<ProjectProfile>) => {
    setProfile(prev => ({ ...prev, ...partial }));
  };

  const goToStep2 = () => {
    if (!profile.name.trim()) return;
    setReport(generateReport(profile));
    setStep(2);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: profile.name,
        type: profile.type,
        data_sensitivity: profile.dataSensitivity,
        geo_scope: profile.geoScope,
        budget: profile.budget ? Number(profile.budget) : null,
        team_size: profile.teamSize,
        sla: profile.sla,
        integrations: profile.integrations.join(', '),
        services: report?.serviceMix.map(s => s.name).join(', ') ?? '',
        status: 'planning',
        created_at: new Date().toISOString(),
      };
      await fetch('/api/nocodb/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Erstellen');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--accent-green]/20">
          <CheckCircle2 size={28} className="text-[--accent-green]" />
        </div>
        <h2 className="text-xl font-bold text-[--text-primary]">Projekt angelegt!</h2>
        <p className="text-sm text-[--text-muted] max-w-sm">
          <span className="font-medium text-[--text-secondary]">{profile.name}</span> wurde erfolgreich in NocoDB erstellt.
        </p>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={() => { setDone(false); setStep(1); setProfile(DEFAULT_PROFILE); }}>
            Weiteres Projekt
          </Button>
          <Button onClick={() => router.push('/agentic-os/management/active-projects')}>
            Zu Active Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-[--text-primary]">
            <FolderPlus size={20} className="text-[--accent-blue]" />
            Neues Projekt anlegen
          </h1>
          <p className="mt-1 text-sm text-[--text-muted]">Human-in-the-Loop Factory Gate</p>
        </div>
        <StepIndicator step={step} />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader className="pb-3 border-b border-[--border]">
          <CardTitle className="text-sm font-semibold text-[--text-secondary]">
            {step === 1 && 'Schritt 1 — Projekt-Profil'}
            {step === 2 && 'Schritt 2 — Auto-generierter Setup-Report'}
            {step === 3 && 'Schritt 3 — Bestätigung & Erstellung'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {step === 1 && <Step1 profile={profile} onChange={updateProfile} />}
          {step === 2 && report && <Step2 profile={profile} report={report} />}
          {step === 3 && report && <Step3 profile={profile} report={report} />}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-[--accent-red]/30 bg-[--accent-red]/10">
          <AlertTriangle size={14} className="text-[--accent-red]" />
          <p className="text-sm text-[--accent-red]">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
        >
          <ChevronLeft size={14} />
          Zurück
        </Button>

        {step < 3 ? (
          <Button
            size="sm"
            onClick={step === 1 ? goToStep2 : () => setStep(3)}
            disabled={step === 1 && !profile.name.trim()}
          >
            Weiter
            <ChevronRight size={14} />
          </Button>
        ) : (
          <Button size="sm" onClick={submit} disabled={submitting}>
            {submitting ? 'Wird erstellt…' : 'Projekt erstellen'}
            <Building2 size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
