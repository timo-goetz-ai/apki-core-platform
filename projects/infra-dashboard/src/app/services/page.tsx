import { getServices } from "@/lib/services-store";
import { ServicesClient } from "./services-client";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getServices();
  return <ServicesClient initialServices={services} />;
}
