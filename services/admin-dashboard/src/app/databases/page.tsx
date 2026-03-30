'use client';

import { ExternalLink, Database, Server, HardDrive } from 'lucide-react';

const DB_CARDS = [
  {
    name: 'NocoDB',
    icon: <Database size={18} color="var(--accent-blue)" />,
    status: 'online',
    description: 'Relationale Daten, 4 Bases',
    link: 'https://nocodb.automation-plus-ki.de',
    tag: 'No-Code DB',
  },
  {
    name: 'PostgreSQL',
    icon: <Database size={18} color="var(--accent-green)" />,
    status: 'online',
    description: 'homestack-postgres, 3 Datenbanken',
    link: null,
    tag: 'Intern',
  },
  {
    name: 'Redis',
    icon: <Server size={18} color="var(--accent-amber)" />,
    status: 'online',
    description: 'homestack-redis, Cache & Sessions',
    link: null,
    tag: 'Intern',
  },
];

const STORAGE_CARDS = [
  {
    name: 'Hetzner Object Storage',
    icon: <HardDrive size={18} color="var(--text-secondary)" />,
    status: 'online',
    description: 'bucket: noco-aios, S3-kompatibel',
    link: null,
    tag: 'S3',
  },
  {
    name: 'Qdrant',
    icon: <Database size={18} color="var(--accent-purple)" />,
    status: 'online',
    description: 'Vektor-Datenbank, Embeddings',
    link: 'https://qdrant.automation-plus-ki.de',
    tag: 'Vektoren',
  },
];

const NOCODB_BASES = [
  { id: 'ph47jcdl7tb4mq1', name: 'Getting Started', tables: null },
  { id: 'ps1kk1d2fm9jxd7', name: 'Bewerbungs-Automation', tables: null },
  { id: 'pwxfagcnm6bru9w', name: 'Dashboard', tables: 9 },
  { id: 'pfx0ca6docorj8n', name: 'AI_SYSTEM', tables: 6 },
];

function StatusDot({ online }: { online: boolean }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: online ? 'var(--accent-green)' : 'var(--accent-red)',
      boxShadow: online ? '0 0 6px rgba(34,197,94,0.5)' : undefined,
      flexShrink: 0,
    }} />
  );
}

function ServiceCard({ item }: { item: typeof DB_CARDS[number] | typeof STORAGE_CARDS[number] }) {
  const cardContent = (
    <div style={{
      background: 'var(--layer-2, var(--layer-2))',
      border: '1px solid var(--border, var(--layer-2))',
      borderRadius: 10, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.15s',
      cursor: item.link ? 'pointer' : 'default',
      textDecoration: 'none',
    }}
      onMouseEnter={e => { if (item.link) e.currentTarget.style.borderColor = 'var(--accent-blue, var(--accent-blue))'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border, var(--layer-2))'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--layer-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {item.icon}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary, var(--text-primary))' }}>{item.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary, var(--text-secondary))' }}>{item.description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot online={item.status === 'online'} />
          <span style={{ fontSize: 11, color: 'var(--accent-green)' }}>Online</span>
          {item.link && <ExternalLink size={12} color="var(--text-secondary, var(--text-secondary))" />}
        </div>
      </div>
      <div>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 20,
          background: 'var(--layer-3, var(--layer-2))',
          color: 'var(--text-secondary, var(--text-secondary))',
        }}>{item.tag}</span>
      </div>
    </div>
  );

  if (item.link) {
    return (
      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        {cardContent}
      </a>
    );
  }
  return cardContent;
}

export default function DatabasesPage() {
  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', fontFamily: 'var(--font-ui, inherit)' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, var(--text-primary))', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Database size={22} color="var(--accent-blue, var(--accent-blue))" />
          Datenbanken &amp; Storage
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary, var(--text-secondary))' }}>
          Datenbank-Infrastruktur und Speicher-Dienste
        </p>
      </div>

      {/* Databases */}
      <section style={{ marginBottom: 32 }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Datenbanken
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {DB_CARDS.map(item => <ServiceCard key={item.name} item={item} />)}
        </div>
      </section>

      {/* Storage */}
      <section style={{ marginBottom: 36 }}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Object Storage &amp; Vektoren
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {STORAGE_CARDS.map(item => <ServiceCard key={item.name} item={item} />)}
        </div>
      </section>

      {/* NocoDB Bases */}
      <section>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          NocoDB Bases
        </p>
        <div style={{
          background: 'var(--layer-2, var(--layer-2))',
          border: '1px solid var(--border, var(--layer-2))',
          borderRadius: 10, overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 180px 80px 100px',
            padding: '8px 18px', borderBottom: '1px solid var(--border, var(--layer-2))',
          }}>
            {['Name', 'Base ID', 'Tabellen', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
            ))}
          </div>
          {NOCODB_BASES.map((base, i) => (
            <div
              key={base.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 180px 80px 100px',
                alignItems: 'center',
                padding: '12px 18px',
                borderBottom: i < NOCODB_BASES.length - 1 ? '1px solid var(--border, var(--layer-2))' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusDot online />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary, var(--text-primary))' }}>{base.name}</span>
              </div>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary, var(--text-secondary))' }}>
                {base.id}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary, var(--text-secondary))' }}>
                {base.tables != null ? `${base.tables} Tabellen` : '—'}
              </span>
              <a
                href={`https://nocodb.automation-plus-ki.de`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                  background: 'var(--layer-3, var(--layer-2))',
                  border: '1px solid var(--border, var(--layer-2))',
                  color: 'var(--accent-blue, var(--accent-blue))',
                  textDecoration: 'none', width: 'fit-content',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--layer-3, var(--layer-2))')}
              >
                Öffnen <ExternalLink size={11} />
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
