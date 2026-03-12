import axios, { AxiosInstance, AxiosError } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

interface CloudflareConfig {
  apiKey: string;
  email: string;
  timeout?: number;
}

export class CloudflareClient {
  private client: AxiosInstance;

  constructor(config: CloudflareConfig) {
    if (!config.apiKey) {
      throw new Error("CLOUDFLARE_API_KEY environment variable is required");
    }
    if (!config.email) {
      throw new Error("CLOUDFLARE_EMAIL environment variable is required");
    }

    this.client = axios.create({
      baseURL: "https://api.cloudflare.com/client/v4",
      timeout: (config.timeout || 30) * 1000,
      headers: {
        "X-Auth-Key": config.apiKey,
        "X-Auth-Email": config.email,
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const data = error.response.data as any;
      const errors = data?.errors || [];
      const message =
        errors.length > 0
          ? errors.map((e: any) => e.message).join("; ")
          : error.message || "Unknown Cloudflare API error";
      throw new Error(`Cloudflare API Error (${error.response.status}): ${message}`);
    } else if (error.request) {
      throw new Error(`Network error: ${error.message}`);
    } else {
      throw new Error(error.message);
    }
  }

  // Zone operations
  async listZones(params?: { name?: string; page?: number; per_page?: number }) {
    const response = await this.client.get("/zones", { params });
    return response.data;
  }

  async getZone(zoneId: string) {
    const response = await this.client.get(`/zones/${zoneId}`);
    return response.data;
  }

  // DNS Record operations
  async listDnsRecords(zoneId: string, params?: { type?: string; name?: string; page?: number; per_page?: number }) {
    const response = await this.client.get(`/zones/${zoneId}/dns_records`, { params: { ...params, per_page: params?.per_page || 100 } });
    return response.data;
  }

  async getDnsRecord(zoneId: string, recordId: string) {
    const response = await this.client.get(`/zones/${zoneId}/dns_records/${recordId}`);
    return response.data;
  }

  async createDnsRecord(zoneId: string, record: {
    type: string;
    name: string;
    content: string;
    ttl?: number;
    proxied?: boolean;
    priority?: number;
    comment?: string;
  }) {
    const response = await this.client.post(`/zones/${zoneId}/dns_records`, {
      ...record,
      ttl: record.ttl || 1,
    });
    return response.data;
  }

  async updateDnsRecord(zoneId: string, recordId: string, record: {
    type?: string;
    name?: string;
    content?: string;
    ttl?: number;
    proxied?: boolean;
    priority?: number;
    comment?: string;
  }) {
    const response = await this.client.patch(`/zones/${zoneId}/dns_records/${recordId}`, record);
    return response.data;
  }

  async deleteDnsRecord(zoneId: string, recordId: string) {
    const response = await this.client.delete(`/zones/${zoneId}/dns_records/${recordId}`);
    return response.data;
  }

  // Connection verification
  async verifyConnection() {
    const response = await this.client.get("/user");
    return response.data;
  }
}

// Singleton
let clientInstance: CloudflareClient | null = null;

export function getCloudflareClient(): CloudflareClient {
  if (!clientInstance) {
    const apiKey = process.env.CLOUDFLARE_API_KEY;
    const email = process.env.CLOUDFLARE_EMAIL;
    if (!apiKey || !email) {
      throw new Error(
        "CLOUDFLARE_API_KEY and CLOUDFLARE_EMAIL environment variables are required."
      );
    }

    const timeout = process.env.API_TIMEOUT
      ? parseInt(process.env.API_TIMEOUT, 10)
      : 30;

    clientInstance = new CloudflareClient({ apiKey, email, timeout });
  }

  return clientInstance;
}
