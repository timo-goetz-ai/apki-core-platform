import { getCategories, getServices } from "@/lib/services-store";
import { StatusGrid } from "@/components/status-grid";
import { N8NPanel } from "@/components/n8n-panel";
import { Clock } from "@/components/clock";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [services, categories] = await Promise.all([
    getServices(),
    getCategories(),
  ]);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AIOS Dashboard</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Hetzner CPX42 &middot; <HETZNER_HOST> &middot; {services.length} Services
          </p>
        </div>
        <Clock />
      </div>

      <StatusGrid services={services} categories={categories} />

      <div className="h-px bg-zinc-800" />

      <N8NPanel />
    </div>
  );
}
