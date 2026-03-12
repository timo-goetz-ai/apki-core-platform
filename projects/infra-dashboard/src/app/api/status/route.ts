import { NextResponse } from "next/server";
import { getServices } from "@/lib/services-store";
import { checkAllServices } from "@/lib/health-checker";

export const dynamic = "force-dynamic";
export const revalidate = 10;

export async function GET() {
  const services = await getServices();
  const statuses = await checkAllServices(services);
  return NextResponse.json({ statuses });
}
