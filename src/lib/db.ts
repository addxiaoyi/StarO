/**
 * Shared database pool module
 * Provides a typed database connection pool for use across the application
 */

import { Pool, PoolClient } from "pg";
import { dbPoolConfig } from "./db-config";

let pgPool: Pool | null = null;
let poolPromise: Promise<Pool | null> | null = null;
let poolCreationAttempts = 0;
const MAX_POOL_CREATION_ATTEMPTS = 3;
const POOL_CREATION_RETRY_DELAY_MS = 1000;

export type { Pool, PoolClient };

/**
 * Get or create the shared PostgreSQL connection pool
 * Returns existing pool immediately if available (synchronous)
 * For initial creation, use createPool() for async handling
 */
export function getPool(): Pool | null {
  return pgPool;
}

/**
 * Ensure pool exists (async initialization)
 * Use this for initial setup; subsequent calls return immediately
 */
export async function ensurePool(): Promise<Pool | null> {
  if (pgPool) {
    return pgPool;
  }

  if (poolPromise) {
    return poolPromise;
  }

  poolPromise = createPool();
  const pool = await poolPromise;
  poolPromise = null;
  return pool;
}

async function createPool(): Promise<Pool | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  poolCreationAttempts++;

  try {
    const newPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ...dbPoolConfig,
      client_encoding: "utf8",
      application_name: process.env.OTEL_SERVICE_NAME || "starx-oauth",
    });

    // 测试连接
    const client = await newPool.connect();
    client.release();

    pgPool = newPool;

    // 监听连接池错误
    newPool.on("error", (err) => {
      console.error("[db-pool] Unexpected error on idle client", {
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    });

    console.info("[db-pool] Connection pool created successfully");
    poolCreationAttempts = 0;

    return newPool;
  } catch (error) {
    console.error("[db-pool] Failed to create pool", {
      attempt: poolCreationAttempts,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (poolCreationAttempts < MAX_POOL_CREATION_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, POOL_CREATION_RETRY_DELAY_MS * poolCreationAttempts));
      return createPool();
    }

    poolCreationAttempts = 0;
    return null;
  }
}

/**
 * Close the database pool (call on server shutdown)
 */
export async function closePool(): Promise<void> {
  if (pgPool) {
    try {
      await pgPool.end();
      pgPool = null;
      console.info("[db-pool] Connection pool closed");
    } catch (error) {
      console.error("[db-pool] Error closing pool", error);
    }
  }
}
