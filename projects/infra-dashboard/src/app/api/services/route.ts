import { NextRequest, NextResponse } from "next/server";
import {
  getServices,
  addService,
  updateService,
  deleteService,
} from "@/lib/services-store";
import type { ServiceConfig } from "@/lib/types";

export async function GET() {
  const services = await getServices();
  return NextResponse.json({ services });
}

export async function POST(request: NextRequest) {
  try {
    const body: ServiceConfig = await request.json();
    if (!body.id || !body.name || !body.url) {
      return NextResponse.json(
        { error: "id, name, and url are required" },
        { status: 400 }
      );
    }
    const service: ServiceConfig = {
      id: body.id,
      name: body.name,
      url: body.url,
      icon: body.icon || "globe",
      category: body.category || "other",
      healthEndpoint: body.healthEndpoint || body.url,
      description: body.description || "",
      headers: body.headers || {},
    };
    await addService(service);
    return NextResponse.json({ service }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await updateService(id, updates);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await deleteService(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
