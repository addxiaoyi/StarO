import { API_KEY_TABLE_NAME } from "@better-auth/api-key";
import pg from "pg";

type QueryResult<T> = {
  rows: T[];
};

type QueryablePool = {
  query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
  end(): Promise<void>;
};

type ConnectionCodeRow = {
  id: string;
  name: string | null;
  enabled: boolean | null;
  requestCount: number | null;
  rateLimitEnabled: boolean | null;
  rateLimitMax: number | null;
  lastRequest: Date | string | null;
  expiresAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type MonitorAlert = {
  level: "warn" | "critical";
  code: string;
  connectionCodeId: string;
  name: string;
  message: string;
};

const { Pool } = pg as unknown as {
  Pool: new (config: { connectionString: string }) => QueryablePool;
};

const args = new Set(process.argv.slice(2));
const warnOnly = args.has("--warn-only");

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function positiveNumberEnv(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return value;
}

function ratioEnv(name: string, fallback: number) {
  const value = positiveNumberEnv(name, fallback);

  if (value > 1) {
    throw new Error(`${name} must be between 0 and 1.`);
  }

  return value;
}

function toDate(value: Date | string | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysToMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

async function tableExists(pool: QueryablePool, tableName: string) {
  const result = await pool.query<{ exists: boolean }>(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = current_schema()
          and table_name = $1
      ) as exists
    `,
    [tableName],
  );

  return Boolean(result.rows[0]?.exists);
}

function pushAlert(alerts: MonitorAlert[], row: ConnectionCodeRow, level: MonitorAlert["level"], code: string, message: string) {
  alerts.push({
    level,
    code,
    connectionCodeId: row.id,
    name: row.name || "未命名连接码",
    message,
  });
}

async function main() {
  const pool = new Pool({ connectionString: requiredEnv("DATABASE_URL") });
  const expiryWarnDays = positiveNumberEnv("STARX_CONNECTION_CODE_EXPIRY_WARN_DAYS", 14);
  const staleDays = positiveNumberEnv("STARX_CONNECTION_CODE_STALE_DAYS", 90);
  const highUsageRatio = ratioEnv("STARX_CONNECTION_CODE_HIGH_USAGE_RATIO", 0.8);

  try {
    if (!(await tableExists(pool, API_KEY_TABLE_NAME))) {
      throw new Error("Better Auth connection-code table is missing. Run npm run db:migration:apply first.");
    }

    const result = await pool.query<ConnectionCodeRow>(
      `
        select
          id,
          name,
          enabled,
          "requestCount" as "requestCount",
          "rateLimitEnabled" as "rateLimitEnabled",
          "rateLimitMax" as "rateLimitMax",
          "lastRequest" as "lastRequest",
          "expiresAt" as "expiresAt",
          "createdAt" as "createdAt",
          "updatedAt" as "updatedAt"
        from apikey
        order by "updatedAt" desc
      `,
    );

    const now = new Date();
    const expiryWarnMs = daysToMs(expiryWarnDays);
    const staleMs = daysToMs(staleDays);
    const alerts: MonitorAlert[] = [];
    let enabledCount = 0;
    let disabledCount = 0;
    let expiredCount = 0;
    let neverUsedCount = 0;

    for (const row of result.rows) {
      const enabled = row.enabled !== false;
      const lastRequest = toDate(row.lastRequest);
      const expiresAt = toDate(row.expiresAt);
      const createdAt = toDate(row.createdAt);
      const requestCount = Number(row.requestCount ?? 0);
      const rateLimitMax = Number(row.rateLimitMax ?? 0);

      if (enabled) {
        enabledCount++;
      } else {
        disabledCount++;
      }

      if (!lastRequest) {
        neverUsedCount++;
      }

      if (expiresAt && expiresAt.getTime() <= now.getTime()) {
        expiredCount++;
        if (enabled) {
          pushAlert(alerts, row, "critical", "expired-enabled", "连接码已过期但仍处于可使用状态，请撤销或重新创建。");
        }
      } else if (enabled && expiresAt && expiresAt.getTime() - now.getTime() <= expiryWarnMs) {
        pushAlert(alerts, row, "warn", "expires-soon", `连接码将在 ${expiryWarnDays} 天内到期，请确认是否需要延长或撤销。`);
      }

      if (enabled && lastRequest && now.getTime() - lastRequest.getTime() >= staleMs) {
        pushAlert(alerts, row, "warn", "stale-code", `连接码已超过 ${staleDays} 天未使用，请确认是否仍需要保留。`);
      }

      if (enabled && !lastRequest && createdAt && now.getTime() - createdAt.getTime() >= staleMs) {
        pushAlert(alerts, row, "warn", "never-used", `连接码创建超过 ${staleDays} 天仍未使用，请确认是否撤销。`);
      }

      if (enabled && row.rateLimitEnabled !== false && rateLimitMax > 0 && requestCount / rateLimitMax >= highUsageRatio) {
        pushAlert(alerts, row, "warn", "high-window-usage", "连接码在当前限流窗口内请求量接近上限，请检查调用方是否异常。");
      }
    }

    const report = {
      checkedAt: now.toISOString(),
      thresholds: {
        expiryWarnDays,
        staleDays,
        highUsageRatio,
      },
      summary: {
        total: result.rows.length,
        enabled: enabledCount,
        disabled: disabledCount,
        expired: expiredCount,
        neverUsed: neverUsedCount,
        alerts: alerts.length,
      },
      alerts,
    };

    console.log(JSON.stringify(report, null, 2));

    if (alerts.length > 0 && !warnOnly) {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
