const SERVICES = [
  { name: "n8n",         url: "https://n8n.automation-plus-ki.de",        color: "text-orange-400" },
  { name: "Grafana",     url: "https://grafana.automation-plus-ki.de",     color: "text-yellow-400" },
  { name: "NocoDB",      url: "https://nocodb.automation-plus-ki.de",      color: "text-purple-400" },
  { name: "AppFlowy",    url: "https://appflowy.automation-plus-ki.de",    color: "text-green-400" },
  { name: "Agents",      url: "https://agents.automation-plus-ki.de",      color: "text-sky-400" },
  { name: "Coolify",     url: "https://coolify.automation-plus-ki.de",     color: "text-pink-400" },
  { name: "Qdrant",      url: "https://qdrant.automation-plus-ki.de",      color: "text-teal-400" },
];

export function ServiceLinks() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
      {SERVICES.map((s) => (
        <a
          key={s.name}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center px-3 py-2 rounded-lg bg-[var(--layer-2)] border border-[var(--border)] hover:border-sky-500 transition-colors text-sm font-medium ${s.color}`}
        >
          {s.name}
        </a>
      ))}
    </div>
  );
}
