import axios, { AxiosInstance, AxiosError } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

interface HetznerConfig {
  token: string;
  timeout?: number;
}

interface HetznerError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface HetznerResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export class HetznerClient {
  private client: AxiosInstance;
  private token: string;

  constructor(config: HetznerConfig) {
    if (!config.token) {
      throw new Error("HETZNER_TOKEN environment variable is required");
    }

    this.token = config.token;
    this.client = axios.create({
      baseURL: "https://api.hetzner.cloud/v1",
      timeout: (config.timeout || 30) * 1000,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    // Add error interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const errorData = error.response.data as Record<string, unknown>;
      const message =
        (errorData.message as string) || error.message || "Unknown error";
      const code = (errorData.code as string) || "UNKNOWN_ERROR";

      throw {
        code,
        message,
        details: errorData,
        statusCode: error.response.status,
      };
    } else if (error.request) {
      throw {
        code: "NETWORK_ERROR",
        message: `Network error: ${error.message}`,
      };
    } else {
      throw {
        code: "CLIENT_ERROR",
        message: error.message,
      };
    }
  }

  // Server operations
  async listServers() {
    const response = await this.client.get("/servers");
    return response.data;
  }

  async getServer(serverId: number) {
    const response = await this.client.get(`/servers/${serverId}`);
    return response.data;
  }

  async createServer(params: {
    name: string;
    server_type: string;
    image: string;
    ssh_keys?: number[];
    location?: string;
    networks?: number[];
    automount?: boolean;
    labels?: Record<string, string>;
  }) {
    const response = await this.client.post("/servers", {
      ...params,
      public_net: {
        ipv4: {
          enabled: true,
        },
        ipv6: {
          enabled: true,
        },
      },
    });
    return response.data;
  }

  async rebootServer(serverId: number) {
    const response = await this.client.post(
      `/servers/${serverId}/actions/reboot`,
      {}
    );
    return response.data;
  }

  async powerOnServer(serverId: number) {
    const response = await this.client.post(
      `/servers/${serverId}/actions/power_on`,
      {}
    );
    return response.data;
  }

  async powerOffServer(serverId: number) {
    const response = await this.client.post(
      `/servers/${serverId}/actions/power_off`,
      {}
    );
    return response.data;
  }

  // Volume operations
  async listVolumes() {
    const response = await this.client.get("/volumes");
    return response.data;
  }

  async getVolume(volumeId: number) {
    const response = await this.client.get(`/volumes/${volumeId}`);
    return response.data;
  }

  // Firewall operations
  async listFirewalls() {
    const response = await this.client.get("/firewalls");
    return response.data;
  }

  async getFirewall(firewallId: number) {
    const response = await this.client.get(`/firewalls/${firewallId}`);
    return response.data;
  }

  async setFirewallRules(
    firewallId: number,
    rules: {
      inbound?: Array<{
        direction: "in" | "out";
        source_ips: string[];
        destination_ips?: string[];
        protocol: "esp" | "gre" | "icmp" | "tcp" | "udp";
        port?: string;
      }>;
      outbound?: Array<{
        direction: "in" | "out";
        source_ips: string[];
        destination_ips?: string[];
        protocol: "esp" | "gre" | "icmp" | "tcp" | "udp";
        port?: string;
      }>;
    }
  ) {
    const response = await this.client.post(
      `/firewalls/${firewallId}/actions/set_rules`,
      rules
    );
    return response.data;
  }

  // Image operations
  async listImages() {
    const response = await this.client.get("/images");
    return response.data;
  }

  async getImage(imageId: number) {
    const response = await this.client.get(`/images/${imageId}`);
    return response.data;
  }

  // Snapshot operations (via server actions)
  async createImage(params: {
    server_id: number;
    type: string;
    description: string;
    labels?: Record<string, string>;
  }) {
    const response = await this.client.post("/servers/{server_id}/actions/create_image", {
      ...params,
      type: "snapshot",
    });
    return response.data;
  }

  // Action retrieval
  async getAction(actionId: number) {
    const response = await this.client.get(`/actions/${actionId}`);
    return response.data;
  }

  // Server metrics/status via console API
  async getServerMetrics(
    serverId: number,
    metric: "cpu" | "disk" | "network",
    resolution: number = 60,
    start: string = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end: string = new Date().toISOString()
  ) {
    const response = await this.client.get(
      `/servers/${serverId}/metrics?type=${metric}&resolution=${resolution}&start=${start}&end=${end}`
    );
    return response.data;
  }
}

// Export singleton instance
let clientInstance: HetznerClient | null = null;

export function getHetznerClient(): HetznerClient {
  if (!clientInstance) {
    const token = process.env.HETZNER_TOKEN;
    if (!token) {
      throw new Error(
        "HETZNER_TOKEN environment variable is required. Set it in .env or as an environment variable."
      );
    }

    const timeout = process.env.API_TIMEOUT
      ? parseInt(process.env.API_TIMEOUT, 10)
      : 30;

    clientInstance = new HetznerClient({ token, timeout });
  }

  return clientInstance;
}
