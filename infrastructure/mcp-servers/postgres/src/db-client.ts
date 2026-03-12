import pg from "pg";

const { Pool } = pg;

const poolCache = new Map<string, pg.Pool>();

export function getPool(databaseUrl?: string): pg.Pool {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "No database_url provided and DATABASE_URL environment variable is not set",
    );
  }

  if (!poolCache.has(url)) {
    poolCache.set(url, new Pool({ connectionString: url, max: 3 }));
  }
  return poolCache.get(url)!;
}
