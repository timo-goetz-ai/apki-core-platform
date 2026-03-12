import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getPool } from "../db-client.js";

export interface Args {
  database_url?: string;
}

export const definition: Tool = {
  name: "list_databases",
  description: "List all accessible PostgreSQL databases on a server. Use database_url to connect to a specific server.",
  inputSchema: {
    type: "object",
    properties: {
      database_url: {
        type: "string",
        description: "PostgreSQL connection string. Omit to use the default DATABASE_URL.",
      },
    },
    required: [],
  },
};

export async function execute(args: Args) {
  const pool = getPool(args.database_url);
  const result = await pool.query(
    `SELECT datname AS name, pg_size_pretty(pg_database_size(datname)) AS size
     FROM pg_database
     WHERE datistemplate = false
     ORDER BY datname`,
  );
  return { databases: result.rows };
}
