/**
 * Database connection pool configuration for PostgreSQL
 *
 * Optimized settings for production workloads
 */

export const dbPoolConfig = {
  // Connection pool limits
  min: parseInt(process.env.DB_POOL_MIN || "2", 10),
  max: parseInt(process.env.DB_POOL_MAX || "10", 10),

  // Connection timeouts (ms)
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || "10000", 10),

  // Keep-alive to prevent connection drops
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,

  // Query timeout
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || "30000", 10),

  // Statement timeout
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || "60000", 10),

  // Reconnection strategy
  reconnect: {
    initial_delay_ms: 1000,
    max_delay_ms: 30000,
    failures_until_exit: 5,
  },
};

/**
 * Validate database URL and extract useful information
 */
export function parseDatabaseUrl(url: string): {
  host: string;
  port: number;
  database: string;
  user: string;
} | null {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || "5432", 10),
      database: parsed.pathname.slice(1),
      user: parsed.username,
    };
  } catch {
    return null;
  }
}

/**
 * Health check query for database monitoring
 */
export const healthCheckQuery = "SELECT 1 as health_check";
