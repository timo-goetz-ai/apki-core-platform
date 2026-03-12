import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "../hetzner-client.js";
import { execSync } from "child_process";
import * as path from "path";

export interface Args {
  server_id: number;
  command: string;
  ssh_key_path?: string;
}

export const definition: Tool = {
  name: "ssh_command",
  description:
    "Execute a command on a Hetzner Cloud server via SSH. Requires SSH key setup.",
  inputSchema: {
    type: "object",
    properties: {
      server_id: {
        type: "number",
        description: "The ID of the server",
      },
      command: {
        type: "string",
        description: "The shell command to execute on the server",
      },
      ssh_key_path: {
        type: "string",
        description:
          "Path to SSH private key (optional, defaults to ~/.ssh/id_rsa)",
      },
    },
    required: ["server_id", "command"],
  },
};

export async function execute(args: Args) {
  if (!args.server_id || typeof args.server_id !== "number") {
    throw new Error("server_id is required and must be a number");
  }
  if (!args.command || typeof args.command !== "string") {
    throw new Error("command is required and must be a string");
  }

  const client = getHetznerClient();

  // Get server details to get IP address
  const serverResponse = await client.getServer(args.server_id);
  const server = serverResponse.server;
  const serverIp = server.public_net?.ipv4?.ip;

  if (!serverIp) {
    throw new Error(`Server ${args.server_id} has no public IP address`);
  }

  try {
    // Determine SSH key path
    const keyPath =
      args.ssh_key_path || path.join(process.env.HOME || "~", ".ssh/id_rsa");
    const timeout = parseInt(process.env.SSH_TIMEOUT || "30", 10) * 1000;
    const commandStr = args.command;

    // Execute SSH command
    const output = execSync(
      `ssh -i ${keyPath} -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@${serverIp} '${commandStr.replace(
        /'/g,
        "'\\'''"
      )}'`,
      {
        timeout,
        encoding: "utf-8",
      }
    );

    return {
      server_id: args.server_id,
      server_ip: serverIp,
      command: args.command,
      status: "success",
      stdout: output.trim(),
      stderr: "",
      exit_code: 0,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Check if it's a timeout or other specific error
    if (err.message.includes("ETIMEDOUT")) {
      throw new Error(
        `SSH command timed out. Server ${args.server_id} may not be running or reachable. Try again or check server status with 'get_server_status'.`
      );
    }

    if (err.message.includes("no such file or directory")) {
      throw new Error(
        `SSH key not found at ${args.ssh_key_path || "~/.ssh/id_rsa"}. Set up SSH key or provide path via ssh_key_path parameter.`
      );
    }

    // For other errors, return the stderr/stdout
    const match = (err as any).stderr?.match(/stderr:\s*(.*)/);
    const stderr = match ? match[1] : err.message;

    return {
      server_id: args.server_id,
      server_ip: serverIp,
      command: args.command,
      status: "failed",
      stdout: (err as any).stdout || "",
      stderr: stderr,
      exit_code: (err as any).status || 1,
      error: err.message,
    };
  }
}
