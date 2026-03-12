"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Server,
  Workflow,
  Table,
  Activity,
  Database,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceForm } from "@/components/service-form";
import type { ServiceConfig } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  server: Server,
  workflow: Workflow,
  table: Table,
  activity: Activity,
  database: Database,
  globe: Globe,
};

interface ServicesClientProps {
  initialServices: ServiceConfig[];
}

export function ServicesClient({ initialServices }: ServicesClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<ServiceConfig | undefined>();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm(`Service "${id}" wirklich loeschen?`)) return;
    setDeleting(id);
    try {
      await fetch("/api/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  function handleEdit(service: ServiceConfig) {
    setEditService(service);
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditService(undefined);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-zinc-500 mt-1">
            {initialServices.length} Services konfiguriert
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neuer Service
        </button>
      </div>

      <div className="space-y-3">
        {initialServices.map((service) => {
          const Icon = iconMap[service.icon] || Globe;
          return (
            <div
              key={service.id}
              className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Icon className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-medium">{service.name}</h3>
                  <p className="text-sm text-zinc-500">{service.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 font-mono mr-4 hidden md:block">
                  {service.url.replace("https://", "")}
                </span>

                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Oeffnen"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Bearbeiten"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(service.id)}
                  disabled={deleting === service.id}
                  className={cn(
                    "p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors",
                    deleting === service.id && "opacity-50"
                  )}
                  title="Loeschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && <ServiceForm service={editService} onClose={handleClose} />}
    </div>
  );
}
