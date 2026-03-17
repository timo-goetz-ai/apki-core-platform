'use client'

import { useState, useEffect } from 'react'

const styles: Record<string, React.CSSProperties> = {
  // NAV
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 48px',
    height: '64px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    backgroundColor: 'rgba(10,10,15,0.85)',
  },
  navLogo: {
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '0.05em',
    color: '#f1f5f9',
  },
  navLinks: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
  },
  navLink: {
    fontSize: '14px',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  navCta: {
    fontSize: '13px',
    fontWeight: 500,
    padding: '8px 20px',
    borderRadius: '8px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    cursor: 'pointer',
    border: 'none',
    transition: 'background 0.2s',
  },

  // HERO
  hero: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '0 24px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '800px',
    height: '600px',
    background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, rgba(6,182,212,0.06) 40%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
    pointerEvents: 'none',
  },
  heroLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#3b82f6',
    padding: '6px 16px',
    borderRadius: '100px',
    border: '1px solid rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(59,130,246,0.08)',
    marginBottom: '32px',
  },
  heroTitle: {
    fontSize: 'clamp(48px, 8vw, 96px)',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.0,
    color: '#f1f5f9',
    marginBottom: '12px',
  },
  heroTitleAccent: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: 'clamp(20px, 3vw, 32px)',
    fontWeight: 400,
    color: '#94a3b8',
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
    marginBottom: '20px',
    maxWidth: '600px',
  },
  heroDesc: {
    fontSize: '16px',
    color: '#64748b',
    lineHeight: 1.7,
    maxWidth: '520px',
    marginBottom: '48px',
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px',
    borderRadius: '10px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    letterSpacing: '-0.01em',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px',
    borderRadius: '10px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.2s',
    letterSpacing: '-0.01em',
  },

  // SECTIONS
  section: {
    padding: '96px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#3b82f6',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 4vw, 48px)',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: '#f1f5f9',
    lineHeight: 1.1,
    marginBottom: '20px',
  },
  sectionDesc: {
    fontSize: '17px',
    color: '#64748b',
    lineHeight: 1.7,
    maxWidth: '540px',
    marginBottom: '64px',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)',
    margin: '0 24px',
  },

  // VALUE PROPS (3 tiles)
  tilesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  tile: {
    padding: '40px',
    borderRadius: '16px',
    backgroundColor: '#111118',
    border: '1px solid rgba(255,255,255,0.06)',
    transition: 'all 0.3s',
  },
  tileIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    fontSize: '22px',
  },
  tileTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
    marginBottom: '12px',
  },
  tileDesc: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.7,
  },

  // FEATURE GRID
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '2px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  featureCard: {
    padding: '40px',
    backgroundColor: '#0a0a0f',
    transition: 'background 0.3s',
    cursor: 'default',
  },
  featureNum: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#3b82f6',
    marginBottom: '20px',
    fontFamily: 'monospace',
  },
  featureTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
    marginBottom: '10px',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.65,
  },

  // TECH STACK
  techSection: {
    padding: '96px 24px',
    backgroundColor: '#111118',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  techInner: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  techRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  techRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    alignItems: 'center',
  },
  techRowLabel: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#3b82f6',
    width: '100px',
    flexShrink: 0,
    fontFamily: 'monospace',
  },
  techTag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#94a3b8',
    letterSpacing: '0.02em',
  },

  // USE CASES
  useCaseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  useCaseCard: {
    padding: '40px',
    borderRadius: '16px',
    backgroundColor: '#111118',
    border: '1px solid rgba(255,255,255,0.06)',
    transition: 'all 0.3s',
    position: 'relative',
    overflow: 'hidden',
  },
  useCaseAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
  },
  useCaseLabel: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '16px',
    display: 'block',
  },
  useCaseTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
    marginBottom: '14px',
  },
  useCaseDesc: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: 1.7,
  },

  // CTA / CONTACT
  ctaSection: {
    padding: '120px 24px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ctaGlow: {
    position: 'absolute',
    bottom: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '400px',
    background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  ctaTitle: {
    fontSize: 'clamp(32px, 5vw, 64px)',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: '#f1f5f9',
    lineHeight: 1.1,
    marginBottom: '20px',
  },
  ctaDesc: {
    fontSize: '17px',
    color: '#64748b',
    lineHeight: 1.7,
    maxWidth: '480px',
    margin: '0 auto 16px',
  },
  ctaContact: {
    fontSize: '15px',
    color: '#94a3b8',
    marginBottom: '40px',
  },
  ctaEmail: {
    color: '#3b82f6',
    fontWeight: 500,
  },

  // FOOTER
  footer: {
    padding: '32px 48px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
  },
  footerText: {
    fontSize: '13px',
    color: '#475569',
  },
}

const features = [
  {
    num: '01',
    title: 'Admin Dashboard',
    desc: 'Zentrale Steuereinheit. Status, Chat, Monitoring — alles auf einen Blick.',
  },
  {
    num: '02',
    title: '19 MCP Server',
    desc: 'Model Context Protocol. KI-Tools für jeden Service, vollständig integriert.',
  },
  {
    num: '03',
    title: 'n8n Workflows',
    desc: 'Visuelle Automatisierung. 500+ Integrationen ohne eine Zeile Code.',
  },
  {
    num: '04',
    title: 'NocoDB',
    desc: 'Datenbank-Interface. Kein SQL nötig — strukturierte Daten, sofort nutzbar.',
  },
  {
    num: '05',
    title: 'Grafana + Prometheus',
    desc: 'Live-Monitoring. Jede Metrik in Echtzeit, Alerts und Dashboards inklusive.',
  },
  {
    num: '06',
    title: 'Authentik SSO',
    desc: 'Zentrales Login. Ein Account, alle Services — sicher und komfortabel.',
  },
]

const techStack = [
  {
    label: 'Infra',
    tags: ['Hetzner CPX42', 'Docker', 'Coolify', 'Traefik'],
  },
  {
    label: 'Backend',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'Redis'],
  },
  {
    label: 'AI',
    tags: ['Claude AI', 'Gemini', 'DeepSeek', 'Ollama (lokal)'],
  },
  {
    label: 'DevOps',
    tags: ['GitHub Actions', 'Cloudflare DNS'],
  },
]

const useCases = [
  {
    label: 'Für Agenturen',
    color: '#3b82f6',
    title: 'Automatisiere Kundenprozesse',
    desc: 'Reporting, Content-Produktion, Kommunikation — vollständig automatisiert. Skalierbar auf beliebig viele Kunden.',
  },
  {
    label: 'Für Unternehmen',
    color: '#06b6d4',
    title: 'Interne KI ohne Cloud-Risiko',
    desc: 'Sensible Daten bleiben auf deinem Server. DSGVO-konform, auditierbar, vollständig unter deiner Kontrolle.',
  },
  {
    label: 'Für Entwickler',
    color: '#8b5cf6',
    title: 'Full-Stack KI-Platform',
    desc: 'Sofort einsatzbereit. APIs, Webhooks, MCP-Server — bau darauf, was du willst.',
  },
]

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [hoveredTile, setHoveredTile] = useState<number | null>(null)
  const [hoveredUseCase, setHoveredUseCase] = useState<number | null>(null)
  const [hoveredPrimary, setHoveredPrimary] = useState(false)
  const [hoveredSecondary, setHoveredSecondary] = useState(false)

  return (
    <>
      {/* NAV */}
      <nav style={styles.nav}>
        <span style={styles.navLogo}>AUTOMATION + KI</span>
        <div style={styles.navLinks}>
          <span
            style={styles.navLink}
            onClick={() => scrollTo('platform')}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            Plattform
          </span>
          <span
            style={styles.navLink}
            onClick={() => scrollTo('usecases')}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            Use Cases
          </span>
          <span
            style={styles.navLink}
            onClick={() => scrollTo('contact')}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            Kontakt
          </span>
          <button
            style={{
              ...styles.navCta,
              backgroundColor: hoveredPrimary ? '#2563eb' : '#3b82f6',
            }}
            onClick={() => scrollTo('contact')}
            onMouseEnter={() => setHoveredPrimary(true)}
            onMouseLeave={() => setHoveredPrimary(false)}
          >
            Anfragen
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroGrid} />
        <div style={styles.heroGlow} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={styles.heroLabel}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <circle cx="4" cy="4" r="3" fill="#3b82f6" />
              <circle cx="4" cy="4" r="3" fill="#3b82f6" opacity="0.4">
                <animate attributeName="r" from="3" to="6" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </svg>
            automation-plus-ki.de
          </div>

          <h1 style={styles.heroTitle}>
            <span style={styles.heroTitleAccent}>Automation</span>
            {' '}+{' '}
            <span style={styles.heroTitleAccent}>KI</span>
          </h1>

          <p style={styles.heroSubtitle}>
            KI-Infrastruktur.{' '}
            <span style={{ color: '#f1f5f9' }}>Automatisiert.</span>{' '}
            <span style={{ color: '#f1f5f9' }}>Privat.</span>{' '}
            <span style={{ color: '#f1f5f9' }}>Souverän.</span>
          </p>

          <p style={styles.heroDesc}>
            Keine Cloud-Abhängigkeit. Kein Datenschutzproblem.
            <br />
            Vollständige KI-Infrastruktur auf deiner eigenen Hardware.
          </p>

          <div style={styles.heroButtons}>
            <button
              style={{
                ...styles.btnPrimary,
                backgroundColor: hoveredPrimary ? '#2563eb' : '#3b82f6',
                transform: hoveredPrimary ? 'translateY(-1px)' : 'none',
                boxShadow: hoveredPrimary ? '0 8px 24px rgba(59,130,246,0.35)' : 'none',
              }}
              onClick={() => scrollTo('contact')}
              onMouseEnter={() => setHoveredPrimary(true)}
              onMouseLeave={() => setHoveredPrimary(false)}
            >
              Jetzt anfragen
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              style={{
                ...styles.btnSecondary,
                borderColor: hoveredSecondary ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                color: hoveredSecondary ? '#f1f5f9' : '#94a3b8',
              }}
              onClick={() => scrollTo('platform')}
              onMouseEnter={() => setHoveredSecondary(true)}
              onMouseLeave={() => setHoveredSecondary(false)}
            >
              Mehr erfahren
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      <div style={styles.divider} />

      {/* VALUE PROPS */}
      <section style={styles.section} id="why">
        <span style={styles.sectionLabel}>Warum Automation + KI</span>
        <h2 style={{ ...styles.sectionTitle, marginBottom: '64px' }}>
          KI, die wirklich dir gehört.
        </h2>

        <div style={styles.tilesGrid}>
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              iconBg: 'rgba(59,130,246,0.1)',
              title: 'Datensouveränität',
              desc: 'Alle Daten bleiben auf deinem Server. DSGVO-konform ohne Kompromisse — keine Cloud, kein fremder Zugriff.',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              iconBg: 'rgba(6,182,212,0.1)',
              title: 'Vollautomatisierung',
              desc: 'n8n-Workflows, KI-Agenten und MCP-Server arbeiten 24/7 für dich. Keine manuellen Prozesse, kein Schlaf nötig.',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="#8b5cf6" strokeWidth="1.5"/>
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ),
              iconBg: 'rgba(139,92,246,0.1)',
              title: 'Eigene KI-Modelle',
              desc: 'Lokale LLMs mit Ollama plus Top-Cloud-Modelle — Claude, Gemini, DeepSeek. Du entscheidest, was wo läuft.',
            },
          ].map((tile, i) => (
            <div
              key={i}
              style={{
                ...styles.tile,
                transform: hoveredTile === i ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hoveredTile === i ? '0 16px 40px rgba(0,0,0,0.4)' : 'none',
                borderColor: hoveredTile === i ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
              }}
              onMouseEnter={() => setHoveredTile(i)}
              onMouseLeave={() => setHoveredTile(null)}
            >
              <div style={{ ...styles.tileIcon, backgroundColor: tile.iconBg }}>
                {tile.icon}
              </div>
              <div style={styles.tileTitle}>{tile.title}</div>
              <div style={styles.tileDesc}>{tile.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={styles.divider} />

      {/* PLATFORM / FEATURES */}
      <section style={{ ...styles.section, maxWidth: '1200px' }} id="platform">
        <span style={styles.sectionLabel}>Die Plattform</span>
        <h2 style={styles.sectionTitle}>Alles, was du brauchst.</h2>
        <p style={styles.sectionDesc}>
          Sechs spezialisierte Services, nahtlos integriert — von der Oberfläche bis zur Infrastruktur.
        </p>

        <div style={styles.featureGrid}>
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                ...styles.featureCard,
                backgroundColor: hoveredFeature === i ? '#111118' : '#0a0a0f',
              }}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div style={styles.featureNum}>{f.num}</div>
              <div style={styles.featureTitle}>{f.title}</div>
              <div style={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TECH STACK */}
      <div style={styles.techSection}>
        <div style={styles.techInner}>
          <span style={styles.sectionLabel}>Tech Stack</span>
          <h2 style={{ ...styles.sectionTitle, marginBottom: '48px' }}>
            Bewährte Technologien.
          </h2>

          <div style={styles.techRows}>
            {techStack.map((row, i) => (
              <div key={i} style={styles.techRow}>
                <span style={styles.techRowLabel}>{row.label}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {row.tags.map((tag, j) => (
                    <span key={j} style={styles.techTag}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* USE CASES */}
      <section style={styles.section} id="usecases">
        <span style={styles.sectionLabel}>Use Cases</span>
        <h2 style={styles.sectionTitle}>Für wen ist das?</h2>
        <p style={styles.sectionDesc}>
          Von der Agentur bis zum Entwickler — die Plattform passt sich deinen Anforderungen an.
        </p>

        <div style={styles.useCaseGrid}>
          {useCases.map((uc, i) => (
            <div
              key={i}
              style={{
                ...styles.useCaseCard,
                transform: hoveredUseCase === i ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hoveredUseCase === i ? '0 20px 48px rgba(0,0,0,0.5)' : 'none',
                borderColor: hoveredUseCase === i ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
              }}
              onMouseEnter={() => setHoveredUseCase(i)}
              onMouseLeave={() => setHoveredUseCase(null)}
            >
              <div
                style={{
                  ...styles.useCaseAccent,
                  background: `linear-gradient(90deg, ${uc.color}, transparent)`,
                  opacity: hoveredUseCase === i ? 1 : 0.5,
                }}
              />
              <span style={{ ...styles.useCaseLabel, color: uc.color }}>
                {uc.label}
              </span>
              <div style={styles.useCaseTitle}>{uc.title}</div>
              <div style={styles.useCaseDesc}>{uc.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={styles.divider} />

      {/* CTA / CONTACT */}
      <section style={styles.ctaSection} id="contact">
        <div style={styles.ctaGlow} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ ...styles.sectionLabel, display: 'block', marginBottom: '24px' }}>Kontakt</span>
          <h2 style={styles.ctaTitle}>
            Interesse?
            <br />
            <span style={{ color: '#94a3b8' }}>Lass uns reden.</span>
          </h2>
          <p style={styles.ctaDesc}>
            Du willst KI-Infrastruktur, die wirklich funktioniert — ohne Vendor-Lock-in, ohne Datenschutzsorgen.
          </p>
          <p style={styles.ctaContact}>
            Timo Götz — KI-Beauftragter &amp; Plattform-Architekt
            <br />
            <a
              href="mailto:ai_studio@timo-goetz-ai.de"
              style={styles.ctaEmail}
            >
              ai_studio@timo-goetz-ai.de
            </a>
          </p>
          <a
            href="mailto:ai_studio@timo-goetz-ai.de"
            style={{
              ...styles.btnPrimary,
              display: 'inline-flex',
              textDecoration: 'none',
              fontSize: '16px',
              padding: '16px 40px',
            }}
          >
            Anfrage stellen
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <span style={styles.footerText}>
          © {new Date().getFullYear()} Automation + KI — automation-plus-ki.de
        </span>
        <span style={styles.footerText}>
          Timo Götz · KI-Beauftragter
        </span>
      </footer>
    </>
  )
}
