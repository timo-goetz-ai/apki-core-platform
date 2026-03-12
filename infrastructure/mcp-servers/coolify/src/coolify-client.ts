import axios, { AxiosInstance, AxiosError } from "axios";

export interface CoolifyConfig {
  baseUrl: string;
  token: string;
  timeout?: number;
}

export interface CoolifyApplication {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  fqdn: string | null;
  status: string;
  git_repository: string | null;
  git_branch: string | null;
  build_pack: string | null;
  ports_exposes: string | null;
  created_at: string;
  updated_at: string;
  environment?: {
    id: number;
    name: string;
    project: {
      id: number;
      uuid: string;
      name: string;
    };
  };
  [key: string]: unknown;
}

export interface CoolifyEnvVariable {
  id: number;
  uuid: string;
  key: string;
  value: string;
  is_preview: boolean;
  is_build_time: boolean;
  is_literal: boolean;
  is_multiline: boolean;
  is_shown_once: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoolifyDeployment {
  id: number;
  uuid: string;
  application_id: string;
  deployment_uuid: string;
  pull_request_id: number;
  force_rebuild: boolean;
  commit: string;
  status: string;
  is_webhook: boolean;
  created_at: string;
  updated_at: string;
  logs: string | null;
}

export interface CoolifyBackup {
  id: number;
  uuid: string;
  status: string;
  filename: string | null;
  size: number | null;
  created_at: string;
  updated_at: string;
}

export class CoolifyApiError extends Error {
  constructor(
    message: string,
    public statusCode: number | undefined,
    public endpoint: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "CoolifyApiError";
  }
}

export class CoolifyClient {
  private http: AxiosInstance;

  constructor(config: CoolifyConfig) {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");

    this.http = axios.create({
      baseURL: `${baseUrl}/api/v1`,
      timeout: config.timeout ?? 30_000,
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  }

  private handleError(error: unknown, endpoint: string): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data = error.response?.data;
      const message =
        typeof data === "object" && data !== null && "message" in data
          ? (data as { message: string }).message
          : error.message;

      throw new CoolifyApiError(
        `Coolify API error (${status ?? "network"}): ${message}`,
        status,
        endpoint,
        data,
      );
    }
    throw new CoolifyApiError(
      `Unexpected error calling ${endpoint}: ${String(error)}`,
      undefined,
      endpoint,
    );
  }

  // ── Applications ──────────────────────────────────────────────

  async listApplications(): Promise<CoolifyApplication[]> {
    try {
      const { data } = await this.http.get("/applications");
      return Array.isArray(data) ? data : [];
    } catch (err) {
      this.handleError(err, "GET /applications");
    }
  }

  async getApplication(uuid: string): Promise<CoolifyApplication> {
    try {
      const { data } = await this.http.get(`/applications/${uuid}`);
      return data;
    } catch (err) {
      this.handleError(err, `GET /applications/${uuid}`);
    }
  }

  // ── Deploy / Restart / Start / Stop ───────────────────────────

  async deployApplication(
    uuid: string,
    force?: boolean,
  ): Promise<{
    deployment_uuid: string;
    message: string;
    [key: string]: unknown;
  }> {
    try {
      const params: Record<string, string> = { uuid };
      if (force) params.force = "true";
      const { data } = await this.http.get("/deploy", { params });
      return data;
    } catch (err) {
      this.handleError(err, `GET /deploy?uuid=${uuid}`);
    }
  }

  async restartApplication(
    uuid: string,
  ): Promise<{ message: string; [key: string]: unknown }> {
    try {
      const { data } = await this.http.get(`/applications/${uuid}/restart`);
      return data;
    } catch (err) {
      this.handleError(err, `GET /applications/${uuid}/restart`);
    }
  }

  async startApplication(
    uuid: string,
  ): Promise<{ message: string; [key: string]: unknown }> {
    try {
      const { data } = await this.http.get(`/applications/${uuid}/start`);
      return data;
    } catch (err) {
      this.handleError(err, `GET /applications/${uuid}/start`);
    }
  }

  async stopApplication(
    uuid: string,
  ): Promise<{ message: string; [key: string]: unknown }> {
    try {
      const { data } = await this.http.get(`/applications/${uuid}/stop`);
      return data;
    } catch (err) {
      this.handleError(err, `GET /applications/${uuid}/stop`);
    }
  }

  // ── Logs ──────────────────────────────────────────────────────

  async getApplicationLogs(
    uuid: string,
    lines: number = 100,
  ): Promise<unknown> {
    try {
      const { data } = await this.http.get(`/applications/${uuid}/logs`, {
        params: { lines },
      });
      return data;
    } catch (err) {
      this.handleError(err, `GET /applications/${uuid}/logs`);
    }
  }

  // ── Deployments ───────────────────────────────────────────────

  async listDeployments(
    uuid?: string,
  ): Promise<CoolifyDeployment[]> {
    try {
      const params: Record<string, string> = {};
      if (uuid) params.uuid = uuid;
      const { data } = await this.http.get("/deployments", { params });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      this.handleError(err, "GET /deployments");
    }
  }

  async getDeployment(deploymentUuid: string): Promise<CoolifyDeployment> {
    try {
      const { data } = await this.http.get(`/deployments/${deploymentUuid}`);
      return data;
    } catch (err) {
      this.handleError(err, `GET /deployments/${deploymentUuid}`);
    }
  }

  // ── Environment Variables ─────────────────────────────────────

  async listEnvVariables(uuid: string): Promise<CoolifyEnvVariable[]> {
    try {
      const { data } = await this.http.get(`/applications/${uuid}/envs`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      this.handleError(err, `GET /applications/${uuid}/envs`);
    }
  }

  async createEnvVariable(
    uuid: string,
    key: string,
    value: string,
    options?: {
      is_preview?: boolean;
      is_build_time?: boolean;
      is_literal?: boolean;
    },
  ): Promise<{ message: string; [key: string]: unknown }> {
    try {
      const { data } = await this.http.post(`/applications/${uuid}/envs`, {
        key,
        value,
        is_preview: options?.is_preview ?? false,
        is_build_time: options?.is_build_time ?? false,
        is_literal: options?.is_literal ?? false,
      });
      return data;
    } catch (err) {
      this.handleError(err, `POST /applications/${uuid}/envs`);
    }
  }

  async updateEnvVariable(
    uuid: string,
    key: string,
    value: string,
  ): Promise<{ message: string; [key: string]: unknown }> {
    try {
      const { data } = await this.http.patch(`/applications/${uuid}/envs`, {
        key,
        value,
      });
      return data;
    } catch (err) {
      this.handleError(err, `PATCH /applications/${uuid}/envs`);
    }
  }

  async deleteEnvVariable(
    uuid: string,
    envUuid: string,
  ): Promise<{ message: string; [key: string]: unknown }> {
    try {
      const { data } = await this.http.delete(`/applications/${uuid}/envs`, {
        data: { uuid: envUuid },
      });
      return data;
    } catch (err) {
      this.handleError(err, `DELETE /applications/${uuid}/envs`);
    }
  }

  // ── Databases & Backups ───────────────────────────────────────

  async listDatabases(): Promise<unknown[]> {
    try {
      const { data } = await this.http.get("/databases");
      return Array.isArray(data) ? data : [];
    } catch (err) {
      this.handleError(err, "GET /databases");
    }
  }

  async getDatabase(uuid: string): Promise<unknown> {
    try {
      const { data } = await this.http.get(`/databases/${uuid}`);
      return data;
    } catch (err) {
      this.handleError(err, `GET /databases/${uuid}`);
    }
  }

  async listBackups(databaseUuid: string): Promise<CoolifyBackup[]> {
    try {
      const { data } = await this.http.get(
        `/databases/${databaseUuid}/backups`,
      );
      return Array.isArray(data) ? data : [];
    } catch (err) {
      this.handleError(err, `GET /databases/${databaseUuid}/backups`);
    }
  }

  async triggerBackup(
    databaseUuid: string,
  ): Promise<{ message: string; [key: string]: unknown }> {
    try {
      const { data } = await this.http.post(
        `/databases/${databaseUuid}/backups`,
      );
      return data;
    } catch (err) {
      this.handleError(err, `POST /databases/${databaseUuid}/backups`);
    }
  }

  async listBackupExecutions(): Promise<unknown[]> {
    try {
      const { data } = await this.http.get("/backup-executions");
      return Array.isArray(data) ? data : [];
    } catch (err) {
      this.handleError(err, "GET /backup-executions");
    }
  }

  async restartDatabase(
    uuid: string,
  ): Promise<{ message: string; [key: string]: unknown }> {
    try {
      const { data } = await this.http.get(`/databases/${uuid}/restart`);
      return data;
    } catch (err) {
      this.handleError(err, `GET /databases/${uuid}/restart`);
    }
  }

  // ── Resources / Services ──────────────────────────────────────

  async listServices(): Promise<unknown[]> {
    try {
      const { data } = await this.http.get("/services");
      return Array.isArray(data) ? data : [];
    } catch (err) {
      this.handleError(err, "GET /services");
    }
  }

  async getService(uuid: string): Promise<unknown> {
    try {
      const { data } = await this.http.get(`/services/${uuid}`);
      return data;
    } catch (err) {
      this.handleError(err, `GET /services/${uuid}`);
    }
  }

  // ── Health ────────────────────────────────────────────────────

  async healthCheck(): Promise<string> {
    try {
      const { data } = await this.http.get("/healthcheck");
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch (err) {
      this.handleError(err, "GET /healthcheck");
    }
  }

  async version(): Promise<string> {
    try {
      const { data } = await this.http.get("/version");
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch (err) {
      this.handleError(err, "GET /version");
    }
  }
}
