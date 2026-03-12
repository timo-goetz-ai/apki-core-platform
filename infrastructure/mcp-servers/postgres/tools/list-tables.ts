import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getPool } from "../db-client.js";

export interface Args {
  schema?: string;
  database_url?: string;
}

export const definition: Tool = {
  name: "list_tables",
  description: "List all tables in a PostgreSQL database. Use database_url to target a specific database.",
  inputSchema: {
    type: "object",
    properties: {
      schema: { type: "string", description: "Schema name (default: public)" },
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
  const schema = args.schema ?? "public";
  const result = await pool.query(
    `SELECT table_name, table_type
     FROM information_schema.tables
     WHERE table_schema = $1
     ORDER BY table_name`,
    [schema],
  );
  return { schema, tables: result.rows };
}
