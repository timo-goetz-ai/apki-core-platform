import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { CategoryConfig, ServiceConfig, ServicesData } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "services.json");

export async function getServicesData(): Promise<ServicesData> {
  const raw = await readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw) as ServicesData;
}

export async function getServices(): Promise<ServiceConfig[]> {
  const data = await getServicesData();
  return data.services;
}

export async function getCategories(): Promise<CategoryConfig[]> {
  const data = await getServicesData();
  return data.categories ?? [];
}

export async function getServiceById(
  id: string
): Promise<ServiceConfig | undefined> {
  const services = await getServices();
  return services.find((s) => s.id === id);
}

export async function addService(service: ServiceConfig): Promise<void> {
  const data = await getServicesData();
  if (data.services.some((s) => s.id === service.id)) {
    throw new Error(`Service with id "${service.id}" already exists`);
  }
  data.services.push(service);
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function updateService(
  id: string,
  updates: Partial<ServiceConfig>
): Promise<void> {
  const data = await getServicesData();
  const index = data.services.findIndex((s) => s.id === id);
  if (index === -1) throw new Error(`Service "${id}" not found`);
  data.services[index] = { ...data.services[index], ...updates };
  await writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function deleteService(id: string): Promise<void> {
  const data = await getServicesData();
  const filtered = data.services.filter((s) => s.id !== id);
  if (filtered.length === data.services.length)
    throw new Error(`Service "${id}" not found`);
  await writeFile(DATA_PATH, JSON.stringify({ ...data, services: filtered }, null, 2));
}
