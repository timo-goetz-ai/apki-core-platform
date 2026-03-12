import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getServiceById } from "@/lib/services-store";
import { checkService } from "@/lib/health-checker";
import { LogViewer } from "@/components/log-viewer";

export const dynamic = "force-dynamic";

const statusLabels = {
  online: "Online",
  offline: "Offline",
  slow: "Langsam",
};

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  slow: "bg-amber-500",
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) notFound();

  const status = await checkService(service);

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Dashboard
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          <p className="text-zinc-500 mt-1">{service.description}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <div className={`w-3 h-3 rounded-full ${statusColors[status.status]}`} />
              <span className="font-medium">{statusLabels[status.status]}</span>
            </div>
            <span className="text-sm text-zinc-500 font-mono">
              {status.responseTime}ms
            </span>
          </div>

          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Oeffnen
          </a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-sm text-zinc-500 mb-1">URL</p>
          <p className="text-sm font-mono truncate">{service.url}</p>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-sm text-zinc-500 mb-1">Health Endpoint</p>
          <p className="text-sm font-mono truncate">{service.healthEndpoint}</p>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <p className="text-sm text-zinc-500 mb-1">Kategorie</p>
          <p className="text-sm capitalize">{service.category}</p>
        </div>
      </div>

      <LogViewer serviceId={service.id} />
    </div>
  );
}
