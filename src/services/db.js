import { Pool } from "pg";

let cached = null;

export function getDbPool(databaseUrl) {
  if (!databaseUrl) return null;
  if (cached) return cached;
  cached = new Pool({
    connectionString: databaseUrl,
    max: 8,
    idleTimeoutMillis: 10_000
  });
  return cached;
}
