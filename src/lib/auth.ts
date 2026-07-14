import { memoryAdapter } from "@better-auth/memory-adapter";
import { getAuthTables } from "@better-auth/core/db";
import { Pool } from "pg";
import { betterAuth } from "better-auth";
import {
  DEFAULT_CALLBACK_URL,
  getBaseUrl,
  isLocalTestMemoryDatabaseEnabled,
  isProductionBuildPhase,
  validateEnvironment,
} from "@/lib/app-config";
import {
  createAuthOptions,
  DEVELOPMENT_ADMIN_ACCOUNT_RECORD_ID,
  getDevelopmentAdminSeed,
} from "@/lib/auth-options";
import { dbPoolConfig } from "@/lib/db-config";

if (process.env.NODE_ENV === "production" && !isProductionBuildPhase()) {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.error("[StarX-OAuth] 环境配置错误:");
    validation.errors.forEach((e) => console.error(`  - ${e}`));
    if (typeof process.exit === "function") {
      process.exit(1);
    }
  }
  validation.warnings.forEach((w) => console.warn(`[StarX-OAuth] ${w}`));
}

type StarXAuthApi = {
  getSession: (input: { headers: Headers }) => Promise<unknown>;
  getOAuthServerConfig: (...args: unknown[]) => unknown;
  getOpenIdConfig: (...args: unknown[]) => unknown;
} & Record<string, unknown>;

type StarXAuth = {
  handler: (request: Request) => Promise<Response>;
  api: StarXAuthApi;
} & Record<string, unknown>;

export type StarXSession = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    emailVerified?: boolean | null;
    twoFactorEnabled?: boolean | null;
  };
  session?: {
    activeOrganizationId?: string | null;
  };
} | null;

let cachedAuth: StarXAuth | undefined;
let pgPool: Pool | null = null;
const memoryDb: Record<string, unknown[]> = {};

type MemoryRecord = Record<string, unknown>;

function seedDevelopmentAdmin(tables: ReturnType<typeof getAuthTables>) {
  const seed = getDevelopmentAdminSeed();

  if (!seed) {
    return;
  }

  const now = new Date();
  const userModelName = tables.user.modelName;
  const accountModelName = tables.account.modelName;
  const users = memoryDb[userModelName] as MemoryRecord[];
  const accounts = memoryDb[accountModelName] as MemoryRecord[];
  const user =
    users.find((record) => record.id === seed.id) ??
    users.find((record) => record.email === seed.email);
  const userId = typeof user?.id === "string" ? user.id : seed.id;

  if (user) {
    Object.assign(user, {
      email: seed.email,
      emailVerified: true,
      name: seed.name,
      role: "admin",
      banned: false,
      banReason: null,
      banExpires: null,
      updatedAt: now,
    });
  } else {
    users.push({
      id: userId,
      email: seed.email,
      name: seed.name,
      emailVerified: true,
      image: null,
      role: "admin",
      banned: false,
      banReason: null,
      banExpires: null,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  const credentialAccount = accounts.find(
    (record) => record.userId === userId && record.providerId === "credential",
  );

  if (credentialAccount) {
    Object.assign(credentialAccount, {
      accountId: userId,
      password: seed.passwordHash,
      updatedAt: now,
    });
  } else {
    accounts.push({
      id: DEVELOPMENT_ADMIN_ACCOUNT_RECORD_ID,
      accountId: userId,
      providerId: "credential",
      userId,
      password: seed.passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }
}

function getMemoryDatabase(options: Record<string, unknown>) {
  const tables = getAuthTables(options);

  for (const table of Object.values(tables)) {
    if (!memoryDb[table.modelName]) {
      memoryDb[table.modelName] = [];
    }
  }

  seedDevelopmentAdmin(tables);

  return memoryAdapter(memoryDb);
}

function getDatabase(options: Record<string, unknown>) {
  if (isLocalTestMemoryDatabaseEnabled()) {
    return getMemoryDatabase(options);
  }

  if (process.env.DATABASE_URL) {
    if (!pgPool) {
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ...dbPoolConfig,
        // 强制 UTF8，避免数据库/客户端字符集不一致
        client_encoding: "utf8",
        // 应用名称便于日志追踪
        application_name: process.env.OTEL_SERVICE_NAME || "starx-oauth",
      });

      // 监听连接池错误，避免进程崩溃
      pgPool.on("error", (err) => {
        console.error("[db-pool] idle client error", err);
      });
    }

    return pgPool;
  }

  return getMemoryDatabase(options);
}

export function getAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }

  const authOptions = createAuthOptions();

  cachedAuth = betterAuth({
    ...authOptions,
    database: getDatabase(authOptions as Record<string, unknown>),
  }) as unknown as StarXAuth;

  return cachedAuth;
}

export const auth = new Proxy({} as StarXAuth, {
  get(_target, prop) {
    return Reflect.get(getAuth(), prop);
  },
});

export async function requireServerSession(headers: Headers) {
  const response = await fetch(`${getBaseUrl()}/api/auth/get-session`, {
    headers: {
      cookie: headers.get("cookie") || "",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as StarXSession;
}

export function redirectTarget() {
  return DEFAULT_CALLBACK_URL;
}
