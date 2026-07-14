/**
 * Database connection pool monitoring for PostgreSQL
 *
 * Monitors:
 * - Active connections
 * - Idle connections
 * - Connection wait time
 * - Query execution time
 * - Connection errors
 */

import { trace, SpanStatusCode, metrics } from "@opentelemetry/api";

// Create meter for database metrics
const meter = metrics.getMeter("starx-oauth-db");

// Connection pool metrics
const activeConnections = meter.createObservableGauge("db.pool.active_connections", {
  description: "Number of currently active connections",
  unit: "connections",
});

const idleConnections = meter.createObservableGauge("db.pool.idle_connections", {
  description: "Number of idle connections in the pool",
  unit: "connections",
});

const totalConnections = meter.createObservableGauge("db.pool.total_connections", {
  description: "Total number of connections in the pool",
  unit: "connections",
});

const queryDuration = meter.createHistogram("db.query.duration_ms", {
  description: "Duration of database queries",
  unit: "ms",
  advice: {
    explicitBucketBoundaries: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000],
  },
});

const connectionErrors = meter.createCounter("db.connection.errors", {
  description: "Number of connection errors",
});

// Store pool state for metrics observation
interface PoolState {
  activeCount: number;
  idleCount: number;
  totalCount: number;
  waitingClients: number;
  lastError?: string;
  lastQueryTime?: number;
}

let currentPoolState: PoolState = {
  activeCount: 0,
  idleCount: 0,
  totalCount: 0,
  waitingClients: 0,
};

// Register metric callbacks
activeConnections.addCallback((result) => {
  result.observe(currentPoolState.activeCount);
});

idleConnections.addCallback((result) => {
  result.observe(currentPoolState.idleCount);
});

totalConnections.addCallback((result) => {
  result.observe(currentPoolState.totalCount);
});

/**
 * Update pool state from pg.Pool metrics
 */
export function updatePoolMetrics(poolMetrics: Partial<PoolState>) {
  currentPoolState = { ...currentPoolState, ...poolMetrics };
}

/**
 * Wrap a database operation with monitoring
 */
export async function withMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  const tracer = trace.getTracer("starx-oauth-db");

  return tracer.startActiveSpan(`db.${operationName}`, async (span) => {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      // Record query duration
      queryDuration.record(duration, { operation: operationName });

      // Add span attributes
      span.setAttribute("db.operation", operationName);
      span.setAttribute("db.duration_ms", duration);
      span.setAttribute("db.status", "success");
      span.setStatus({ code: SpanStatusCode.OK });

      currentPoolState.lastQueryTime = duration;

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record error
      connectionErrors.add(1, { operation: operationName });

      // Update pool state with error
      currentPoolState.lastError = error instanceof Error ? error.message : String(error);

      // Add error attributes to span
      span.setAttribute("db.operation", operationName);
      span.setAttribute("db.duration_ms", duration);
      span.setAttribute("db.status", "error");
      span.setAttribute("db.error", currentPoolState.lastError);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: currentPoolState.lastError,
      });

      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Get current pool statistics for health check
 */
export function getPoolStats(): PoolState & {
  health: "healthy" | "warning" | "unhealthy";
  message: string;
} {
  const { activeCount, idleCount, totalCount, waitingClients, lastError } = currentPoolState;

  // Determine health status
  let health: "healthy" | "warning" | "unhealthy" = "healthy";
  let message = "Database connection pool is healthy";

  if (lastError) {
    health = "unhealthy";
    message = `Database error: ${lastError}`;
  } else if (waitingClients > 10) {
    health = "warning";
    message = `High connection wait queue: ${waitingClients} clients waiting`;
  } else if (totalCount > 0 && activeCount / totalCount > 0.8) {
    health = "warning";
    message = `High connection utilization: ${Math.round((activeCount / totalCount) * 100)}%`;
  } else if (totalCount > 0 && idleCount === 0) {
    health = "warning";
    message = "No idle connections available";
  }

  return {
    activeCount,
    idleCount,
    totalCount,
    waitingClients,
    lastError,
    health,
    message,
  };
}
