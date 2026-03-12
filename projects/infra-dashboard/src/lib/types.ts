export interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: string;
  healthEndpoint: string;
  description: string;
  headers: Record<string, string>;
}

export interface ServiceStatus {
  id: string;
  status: "online" | "offline" | "slow";
  responseTime: number;
  lastChecked: string;
  statusCode?: number;
}

export interface ServicesData {
  services: ServiceConfig[];
}
