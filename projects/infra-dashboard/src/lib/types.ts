export interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: string;
  healthEndpoint: string;
  description: string;
  note?: string;
  headers: Record<string, string>;
}

export interface ServiceStatus {
  id: string;
  status: "online" | "offline" | "slow";
  responseTime: number;
  lastChecked: string;
  statusCode?: number;
  protected?: boolean;
}

export interface CategoryConfig {
  id: string;
  label: string;
  icon: string;
}

export interface ServicesData {
  services: ServiceConfig[];
  categories?: CategoryConfig[];
}

export interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  tags?: { id: string; name: string }[];
}

export interface N8NExecution {
  id: string;
  status: "success" | "error" | "waiting" | "running";
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  workflowName?: string;
}
