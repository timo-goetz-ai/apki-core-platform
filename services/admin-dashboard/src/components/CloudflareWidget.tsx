"use client";

import { useEffect, useState, useCallback } from "react";
import { Globe, Shield, Wifi, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";

interface Zone {
  id: string; name: string; status: string;
  plan: string; phishingDetected: boolean; modifiedOn: string;
}
interface Tunnel {
  id: string; name: string; status: string;
  createdAt: string; connections: number;
}

const zoneStatusColor: Record<string, string> = {
  active:   "text-emerald-400",
  pending:  "text-amber-400",
  inactive: "text-red-400",
  moved:    "text-zinc-500",
};

const tunnelStatusColor: Record<string, string> = {
  healthy:   "bg-emerald-500",
  degraded:  "bg-amber-400",
  down:      "bg-red-500",
  inactive:  "bg-zinc-600",
};

export function CloudflareWidget() {
  const [zones, setZones]     = useState<Zone[]>([]);
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<"zones" | "tunnels">("zones");

  const load = useCallback(async () => {
    try {
      const [zRes, tRes] = await Promise.all([
        fetch("/api/cloudflare/zones"),
        fetch("/api/cloudflare/tunnels"),
      ]);
      const [zData, tData] = await Promise.all([zRes.json(), tRes.json()]);
      if (zData.error && !zData.zones?.length) throw new Error(zData.error);
      setZones(zData.zones ?? []);
      setTunnels(tData.tunnels ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 120_000); return () => clearInterval(iv); }, [load]);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
         className="rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
              <path d="M20.5 21.8H8.2l-.3-1.1 1.8-3.3H26c.4 1.9-.7 4.4-5.5 4.4z" fill="#F6821F"/>
              <path d="M21.3 17.4l-1.8 3.3H9.7l.3 1.1H20.5c4.8 0 5.9-2.5 5.5-4.4H21.3z" fill="#FBAD41"/>
              <path d="M13.2 24.2H7.1l-.2-.8 1.2-2.3h7.6c.3 1.4-.4 3.1-2.5 3.1z" fill="#F6821F"/>
              <path d="M13.7 21.1l-1.2 2.3H7.3l.2.8h5.7c2.1 0 2.8-1.7 2.5-3.1H13.7z" fill="#FBAD41"/>
            </svg>
          </div>
          <h2 className="font-semibold text-white">Cloudflare</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            {(["zones", "tunnels"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  tab === t ? "bg-orange-500/20 text-orange-300" : "text-zinc-500 hover:text-zinc-300"
                }`}>
                {t === "zones" ? `Domains (${zones.length})` : `Tunnels (${tunnels.length})`}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {error?.includes("nicht gesetzt") ? (
          <div className="px-5 py-8 text-center">
            <AlertCircle className="w-7 h-7 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-amber-300 mb-1">Cloudflare nicht konfiguriert</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Setze <code className="text-orange-400">CLOUDFLARE_API_TOKEN</code> und{" "}
              <code className="text-orange-400">CLOUDFLARE_ACCOUNT_ID</code> in Coolify
            </p>
          </div>
        ) : tab === "zones" ? (
          zones.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Keine Domains gefunden
            </div>
          ) : (
            zones.map(z => (
              <div key={z.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{z.name}</span>
                      {z.phishingDetected && <Shield className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{z.plan}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${zoneStatusColor[z.status] ?? "text-zinc-400"}`}>
                    {z.status}
                  </span>
                  <a href={`https://dash.cloudflare.com/${z.id}`} target="_blank" rel="noopener noreferrer"
                     className="text-zinc-600 hover:text-zinc-300 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )
        ) : (
          tunnels.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Keine Tunnels gefunden
            </div>
          ) : (
            tunnels.map(t => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3">
                  <Wifi className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-white">{t.name}</span>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {t.connections} Verbindung{t.connections !== 1 ? "en" : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${tunnelStatusColor[t.status] ?? "bg-zinc-600"}`} />
                  <span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{t.status}</span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
