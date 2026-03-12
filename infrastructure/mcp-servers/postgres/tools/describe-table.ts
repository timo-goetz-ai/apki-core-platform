import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getPool } from "../db-client.js";

export interface Args {
  table: string;
  schema?: string;
  database_url?: string;
}

export const definition: Tool = {
  name: "describe_table",
  description: "Get the column definitions of a table. Use database_url to target a specific database.",
  inputSchema: {
    type: "object",
    properties: {
      table: { type: "string", description: "Table name" },
      schema: { type: "string", description: "Schema name (default: public)" },
      database_url: {
        type: "string",
        description: "PostgreSQL connection string. Omit to use the default DATABASE_URL.",
      },
    },
    required: ["table"],
  },
};

export async function execute(args: Args) {
  const pool = getPool(args.database_url);
  const schema = args.schema ?? "public";
  const result = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, args.table],
  );
  return { schema, table: args.table, columns: result.rows };
}
