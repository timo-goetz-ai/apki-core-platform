import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCloudflareClient } from "../cloudflare-client.js";

export interface Args {}

export const definition: Tool = {
  name: "verify_token",
  description: "Verify that the Cloudflare API connection is valid by checking user info.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function execute(_args: Args) {
  const client = getCloudflareClient();
  const response = await client.verifyConnection();

  return {
    valid: response.success,
    email: response.result?.email,
    name: response.result?.first_name
      ? `${response.result.first_name} ${response.result.last_name}`
      : response.result?.email,
    message: response.success
      ? "Cloudflare API connection is valid"
      : "Connection verification failed",
  };
}
