import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getPool } from "../db-client.js";

export interface Args {
  query: string;
  params?: unknown[];
  database_url?: string;
}

export const definition: Tool = {
  name: "execute_query",
  description: "Execute a SQL query against a PostgreSQL database. Use database_url to target a specific database, or omit to use the default DATABASE_URL.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "SQL query to execute" },
      params: {
        type: "array",
        description: "Optional query parameters (for parameterized queries)",
        items: {},
      },
      database_url: {
        type: "string",
        description: "PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/dbname). Omit to use the default.",
      },
    },
    required: ["query"],
  },
};

export async function execute(args: Args) {
  const pool = getPool(args.database_url);
  const result = await pool.query(args.query, args.params ?? []);
  return {
    rows: result.rows,
    rowCount: result.rowCount,
    fields: result.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
  };
}
