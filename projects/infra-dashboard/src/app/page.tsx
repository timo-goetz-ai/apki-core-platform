import { getServices } from "@/lib/services-store";
import { StatusGrid } from "@/components/status-grid";
import { Clock } from "@/components/clock";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const services = await getServices();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-zinc-500 mt-1">
            Hetzner CPX42 &middot; 8 vCPU &middot; 16GB RAM &middot; Nuremberg
          </p>
        </div>
        <Clock />
      </div>

      <StatusGrid services={services} />
    </div>
  );
}
