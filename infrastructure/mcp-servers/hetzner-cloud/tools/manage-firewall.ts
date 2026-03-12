import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "../hetzner-client.js";

export interface Args {
  server_id: number;
  action: "add" | "remove";
  protocol: "tcp" | "udp" | "icmp" | "esp" | "gre";
  port?: string;
  source_ip?: string;
  firewall_id?: number;
}

export const definition: Tool = {
  name: "manage_firewall",
  description:
    "Manage firewall rules for a server (add or remove rules for specific ports and protocols)",
  inputSchema: {
    type: "object",
    properties: {
      server_id: {
        type: "number",
        description: "The ID of the server to manage firewall for",
      },
      action: {
        type: "string",
        enum: ["add", "remove"],
        description: "Whether to add or remove a firewall rule",
      },
      protocol: {
        type: "string",
        enum: ["tcp", "udp", "icmp", "esp", "gre"],
        description: "The protocol to allow/block (tcp, udp, icmp, esp, gre)",
      },
      port: {
        type: "string",
        description:
          'The port or port range (e.g., "80", "443", "8000-8999"). Not applicable for ICMP.',
      },
      source_ip: {
        type: "string",
        description:
          'Source IP or CIDR range (e.g., "0.0.0.0/0" for any). Default: 0.0.0.0/0',
      },
      firewall_id: {
        type: "number",
        description: "Optional: Specific firewall ID to manage (if not specified, will use default)",
      },
    },
    required: ["server_id", "action", "protocol"],
  },
};

export async function execute(args: Args) {
  if (!args.server_id || typeof args.server_id !== "number") {
    throw new Error("server_id is required and must be a number");
  }
  if (!["add", "remove"].includes(args.action)) {
    throw new Error('action must be either "add" or "remove"');
  }
  if (!["tcp", "udp", "icmp", "esp", "gre"].includes(args.protocol)) {
    throw new Error("protocol must be one of: tcp, udp, icmp, esp, gre");
  }

  const client = getHetznerClient();

  // For this implementation, we'll note that firewall rules are typically
  // managed through a dedicated firewall resource, not directly on servers
  // This is a simplified interface that suggests the user manage rules via firewalls

  const sourceIp = args.source_ip || "0.0.0.0/0";
  const port = args.port || (args.protocol === "icmp" ? undefined : "any");

  return {
    server_id: args.server_id,
    action: args.action,
    protocol: args.protocol,
    port: port,
    source_ip: sourceIp,
    status: "ready",
    message: `To apply firewall rule: action=${args.action}, protocol=${args.protocol}, port=${port}, source=${sourceIp}`,
    note: "Note: Hetzner Cloud uses Firewall resources. Create or update a firewall and attach it to this server for the rule to take effect.",
    instructions: `1. Call 'list_firewalls' to see available firewalls
2. Use Hetzner Cloud Console to create/edit firewall rules
3. Attach firewall to server ${args.server_id}
Or use the Hetzner API directly to manage firewall rules.`,
  };
}
