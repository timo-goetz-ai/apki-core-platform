import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "../hetzner-client.js";

export interface Args {
  // No arguments
}

export const definition: Tool = {
  name: "list_images",
  description:
    "List all available Hetzner Cloud images (operating systems and snapshots)",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function execute(_args: Args) {
  const client = getHetznerClient();
  const response = await client.listImages();

  // Separate system images from snapshots
  const systemImages = response.images.filter(
    (img: any) => img.type === "system"
  );
  const snapshots = response.images.filter(
    (img: any) => img.type === "snapshot" || img.type === "backup"
  );

  return {
    system_images: systemImages.map((image: any) => ({
      image_id: image.id,
      name: image.name,
      description: image.description,
      image_type: image.type,
      os_flavor: image.os_flavor,
      rapid_deploy: image.rapid_deploy,
      disk_size_gb: image.disk_size,
      created: image.created,
      status: image.status,
    })),
    snapshots: snapshots.map((image: any) => ({
      image_id: image.id,
      name: image.name,
      description: image.description,
      image_type: image.type,
      disk_size_gb: image.disk_size,
      created: image.created,
      status: image.status,
      source_server: image.id_deprecated || "Unknown",
    })),
    total_images: response.images.length,
    system_images_count: systemImages.length,
    snapshots_count: snapshots.length,
  };
}
