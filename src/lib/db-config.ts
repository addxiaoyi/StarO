/**
 * Database connection pool configuration for PostgreSQL
 *
 * Optimized settings for production workloads
 */

// 环境变量验证
const validateNumber = (env: string | undefined, defaultValue: number, min: number, max: number): number => {
  if (!env) return defaultValue;
  const parsed = parseInt(env, 10);
  if (isNaN(parsed)) return defaultValue;
  return Math.min(max, Math.max(min, parsed));
};

export const dbPoolConfig = {
  // Connection pool limits
  min: validateNumber(process.env.DB_POOL_MIN, 2, 0, 20),
  max: validateNumber(process.env.DB_POOL_MAX, 10, 1, 100),

  // Connection timeouts (ms)
  idleTimeoutMillis: validateNumber(process.env.DB_IDLE_TIMEOUT, 30000, 1000, 300000),
  connectionTimeoutMillis: validateNumber(process.env.DB_CONNECT_TIMEOUT, 10000, 1000, 60000),

  // Keep-alive to prevent connection drops
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,

  // Query timeout
  query_timeout: validateNumber(process.env.DB_QUERY_TIMEOUT, 30000, 1000, 300000),

  // Statement timeout
  statement_timeout: validateNumber(process.env.DB_STATEMENT_TIMEOUT, 60000, 1000, 600000),

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
