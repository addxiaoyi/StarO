/**
 * Shared database pool module
 * Provides a typed database connection pool for use across the application
 */

import { Pool, PoolClient } from "pg";
import { dbPoolConfig } from "./db-config";

let pgPool: Pool | null = null;

export type { Pool, PoolClient };

/**
 * Get or create the shared PostgreSQL connection pool
 */
export function getPool(): Pool | null {
  if (process.env.DATABASE_URL) {
    if (!pgPool) {
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ...dbPoolConfig,
        client_encoding: "utf8",
        application_name: process.env.OTEL_SERVICE_NAME || "starx-oauth",
      });

      pgPool.on("error", (err) => {
        console.error("[db-pool] idle client error", err);
      });
    }
    return pgPool;
  }
  return null;
}

/**
 * Close the database pool (call on server shutdown)
 */
export async function closePool(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
}
