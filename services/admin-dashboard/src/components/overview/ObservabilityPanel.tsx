"use client";

import { ExternalLink, LineChart } from "lucide-react";
import Link from "next/link";

const GRAFANA_BASE =
  process.env.NEXT_PUBLIC_GRAFANA_URL?.replace(/\/$/, "") ??
  "https://grafana.automation-plus-ki.de";

function explorePrometheus(expr: string): string {
  const left = encodeURIComponent(
    JSON.stringify({
      datasource: "prometheus",
      queries: [{ refId: "A", expr, range: true, instant: false }],
      range: { from: "now-1h", to: "now" },
    })
  );
  return `${GRAFANA_BASE}/explore?left=${left}&orgId=1`;
}

function exploreLoki(query: string): string {
  const left = encodeURIComponent(
    JSON.stringify({
      datasource: "loki",
      queries: [{ refId: "A", expr: query, queryType: "range", maxLines: 500 }],
      range: { from: "now-1h", to: "now" },
    })
  );
  return `${GRAFANA_BASE}/explore?left=${left}&orgId=1`;
}

const LINKS: { label: string; href: string; hint?: string; internal?: boolean }[] = [
  {
    label: "Prometheus Explore (crew up)",
    href: explorePrometheus('up{job=~".*crew.*|.*crew-api.*"}'),
    hint: "job-Label an scrape_configs anpassen",
  },
  {
    label: "Loki Explore (n8n error)",
    href: exploreLoki('{container="homestack-n8n"} |= "error"'),
    hint: "container-Label aus Promtail prüfen",
  },
  {
    label: "Loki (Crew JSON)",
    href: exploreLoki('{container=~".*crew.*"} | json | event_type != ""'),
    hint: "Nach crew_manager JSON-Logs",
  },
  {
    label: "Monitoring (Dashboard)",
    href: "/monitoring",
    internal: true,
  },
];

export function ObservabilityPanel() {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <LineChart size={13} color="var(--accent-blue)" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
          Observability
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {LINKS.map((item) =>
          item.internal ? (
            <Link
              key={item.label}
              href={item.href}
              title={item.hint}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 7,
                fontSize: 11,
                color: "var(--text-secondary)",
                background: "var(--layer-1)",
                border: "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              <span style={{ flex: 1, lineHeight: 1.3 }}>{item.label}</span>
              <ExternalLink size={10} color="var(--text-muted)" />
            </Link>
          ) : (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              title={item.hint}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                borderRadius: 7,
                fontSize: 11,
                color: "var(--text-secondary)",
                background: "var(--layer-1)",
                border: "1px solid var(--border)",
                textDecoration: "none",
              }}
            >
              <span style={{ flex: 1, lineHeight: 1.3 }}>{item.label}</span>
              <ExternalLink size={10} color="var(--text-muted)" />
            </a>
          )
        )}
      </div>
      <p
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          marginTop: 8,
          lineHeight: 1.35,
        }}
      >
        Grafana:{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>{GRAFANA_BASE}</span>
        . Optional <span style={{ fontFamily: "var(--font-mono)" }}>NEXT_PUBLIC_GRAFANA_URL</span>.
        PromQL/LogQL: <span style={{ fontFamily: "var(--font-mono)" }}>docs/operations/OBSERVABILITY_QUERIES.md</span>
      </p>
    </section>
  );
}
