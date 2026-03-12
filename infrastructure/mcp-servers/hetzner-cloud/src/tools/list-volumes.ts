import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "../hetzner-client.js";

export interface Args {
  // No arguments
}

export const definition: Tool = {
  name: "list_volumes",
  description: "List all Hetzner Cloud volumes with their attachment information",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function execute(_args: Args) {
  const client = getHetznerClient();
  const response = await client.listVolumes();

  return {
    volumes: response.volumes.map((volume: any) => ({
      volume_id: volume.id,
      name: volume.name,
      size_gb: volume.size,
      status: volume.status,
      linux_device: volume.linux_device,
      format: volume.format,
      server_id: volume.server || null,
      location: volume.location?.description,
      labels: volume.labels,
      created: volume.created,
      protection: volume.protection,
    })),
    total: response.volumes.length,
  };
}
