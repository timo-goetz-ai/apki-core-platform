'use client';
import { useState, useEffect } from 'react';
import { HardDrive, Cloud, RefreshCw, FolderOpen, FileText } from 'lucide-react';

interface S3Data {
  bucket: string; region: string; keyCount: number; totalSizeMB: number;
  folders: Record<string, { count: number; size: number }>;
  recentObjects: Array<{ key: string; size: number; lastModified: string }>;
  error?: string;
}

export default function FilesPage() {
  const [s3, setS3] = useState<S3Data | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/storage/s3');
      setS3(await r.json());
    } catch { setS3(null); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const panel: React.CSSProperties = {
    background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px',
  };
  const fmt = (bytes: number) => bytes > 1024*1024 ? `${(bytes/1024/1024).toFixed(1)} MB` : bytes > 1024 ? `${(bytes/1024).toFixed(0)} KB` : `${bytes} B`;

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'var(--font-ui)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 600, margin: 0 }}>Storage & Dateien</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>Hetzner Object Storage · S3-kompatibel</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'var(--layer-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
          <RefreshCw size={13} /> Aktualisieren
        </button>
      </div>

      {/* Storage overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: <HardDrive size={16} />, label: 'Gesamt-Objekte', value: loading ? '…' : String(s3?.keyCount ?? '–'), color: 'var(--accent-blue)' },
          { icon: <Cloud size={16} />, label: 'Gesamt-Größe', value: loading ? '…' : `${s3?.totalSizeMB ?? 0} MB`, color: 'var(--accent-green)' },
          { icon: <FolderOpen size={16} />, label: 'Verzeichnisse', value: loading ? '…' : String(Object.keys(s3?.folders ?? {}).length), color: 'var(--accent-amber)' },
        ].map(card => (
          <div key={card.label} style={{ ...panel, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--layer-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: card.color, fontFamily: 'var(--font-mono)' }}>{card.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {s3?.error && (
        <div style={{ ...panel, marginBottom: 20, color: 'var(--accent-amber)', fontSize: 13 }}>
          ⚠️ {s3.error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Folders */}
        <div style={panel}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={14} /> Verzeichnisse
          </h3>
          {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Lade…</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(s3?.folders ?? {}).map(([name, info]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: 'var(--layer-2)' }}>
                  <FolderOpen size={13} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)', flex: 1 }}>{name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{info.count} Obj.</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{fmt(info.size)}</span>
                </div>
              ))}
              {Object.keys(s3?.folders ?? {}).length === 0 && !s3?.error && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Bucket leer oder kein Zugriff</div>
              )}
            </div>
          )}
        </div>

        {/* Recent objects */}
        <div style={panel}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={14} /> Neueste Dateien
          </h3>
          {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Lade…</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(s3?.recentObjects ?? []).map((obj, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, background: 'var(--layer-2)' }}>
                  <FileText size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{obj.key}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{fmt(obj.size)}</span>
                </div>
              ))}
              {(s3?.recentObjects ?? []).length === 0 && !s3?.error && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keine Dateien gefunden</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bucket info */}
      <div style={{ ...panel, marginTop: 16 }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Bucket-Konfiguration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Bucket', value: s3?.bucket ?? 'noco-aios' },
            { label: 'Region', value: s3?.region ?? 'fsn1' },
            { label: 'Endpoint', value: 'fsn1.your-objectstorage.com' },
            { label: 'Provider', value: 'Hetzner Object Storage' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>{item.label}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
