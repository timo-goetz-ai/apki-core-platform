import { CoolifyClient } from "../coolify-client.js";

import * as listApplications from "./list-applications.js";
import * as getApplicationDetails from "./get-application-details.js";
import * as deployApplication from "./deploy-application.js";
import * as getDeploymentLogs from "./get-deployment-logs.js";
import * as setEnvironmentVariable from "./set-environment-variable.js";
import * as getEnvironmentVariables from "./get-environment-variables.js";
import * as restartApplication from "./restart-application.js";
import * as getApplicationStatus from "./get-application-status.js";
import * as viewLogs from "./view-logs.js";
import * as triggerBackup from "./trigger-backup.js";
import * as listBackups from "./list-backups.js";
import * as restoreFromBackup from "./restore-from-backup.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolModule {
  definition: ToolDefinition;
  handler: (
    client: CoolifyClient,
    params: Record<string, unknown>,
  ) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  }>;
}

export const tools: ToolModule[] = [
  listApplications,
  getApplicationDetails,
  deployApplication,
  getDeploymentLogs,
  setEnvironmentVariable,
  getEnvironmentVariables,
  restartApplication,
  getApplicationStatus,
  viewLogs,
  triggerBackup,
  listBackups,
  restoreFromBackup,
];

export const toolMap = new Map<string, ToolModule>(
  tools.map((t) => [t.definition.name, t]),
);
