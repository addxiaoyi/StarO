export const APP_NAME = "StarX-Oauth";
export const DEFAULT_CALLBACK_URL = "/dashboard";

export const oauthProviders = [
  { id: "google", label: "Google", env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { id: "github", label: "GitHub", env: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"] },
  { id: "discord", label: "Discord", env: ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"] },
  { id: "microsoft", label: "Microsoft", env: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"] },
] as const;

export const authCapabilities = [
  "邮箱和密码登录",
  "确认邮箱",
  "找回登录密码",
  "收邮件登录",
  "用设备登录",
  "登录多一步确认",
  "邮件里的 6 位数字",
  "管理已登录设备",
  "连接自己的工具",
  "确认应用访问",
  "管理成员账号",
] as const;

export function getBaseUrl() {
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

export function isProviderConfigured(envNames: readonly string[]) {
  return envNames.every((name) => hasUsableEnvValue(name));
}

export function isLocalTestMemoryDatabaseEnabled() {
  if (process.env.STARX_USE_MEMORY_DB !== "true") {
    return false;
  }

  try {
    const hostname = new URL(getBaseUrl()).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function isProductionBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function envValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function hasUsableEnvValue(name: string) {
  const value = envValue(name);
  return Boolean(value) && !isPlaceholderEnvValue(value);
}

function isPlaceholderEnvValue(value: string) {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.includes("请生成") ||
    normalized.includes("用户名") ||
    normalized.includes("密码") ||
    normalized.includes("数据库名") ||
    normalized.includes("你的") ||
    normalized.includes("replace-with") ||
    normalized.includes("example.com")
  );
}

function isValidUrl(value: string, allowedProtocols: readonly string[]) {
  try {
    const url = new URL(value);
    return allowedProtocols.includes(url.protocol);
  } catch {
    return false;
  }
}

function hasEmailTransport() {
  return hasUsableEnvValue("RESEND_API_KEY") || hasUsableEnvValue("SMTP_HOST");
}

const REQUIRED_PRODUCTION_ENV_VARS = [
  "BETTER_AUTH_SECRET",
  "DATABASE_URL",
] as const;

export function validateEnvironment() {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (process.env.NODE_ENV === "production" && !isProductionBuildPhase()) {
    const usingLocalMemoryDb = isLocalTestMemoryDatabaseEnabled();

    for (const varName of REQUIRED_PRODUCTION_ENV_VARS) {
      if (usingLocalMemoryDb && varName === "DATABASE_URL") {
        continue;
      }

      if (!hasUsableEnvValue(varName)) {
        errors.push(`[环境变量] 生产环境必须配置: ${varName}`);
      }
    }

    const baseUrl = envValue("BETTER_AUTH_URL");
    const authSecret = envValue("BETTER_AUTH_SECRET");
    const databaseUrl = envValue("DATABASE_URL");

    if (baseUrl && !isValidUrl(baseUrl, ["https:", "http:"])) {
      errors.push("[环境变量] BETTER_AUTH_URL 必须是有效的 http(s) URL");
    }

    if (authSecret && !isPlaceholderEnvValue(authSecret) && authSecret.length < 32) {
      errors.push("[环境变量] BETTER_AUTH_SECRET 至少需要 32 个字符");
    }

    if (databaseUrl && !isPlaceholderEnvValue(databaseUrl) && !isValidUrl(databaseUrl, ["postgresql:", "postgres:"])) {
      errors.push("[环境变量] DATABASE_URL 必须是有效的 PostgreSQL 连接字符串");
    }

    if (!usingLocalMemoryDb && !hasEmailTransport()) {
      errors.push("[环境变量] 生产环境必须配置 RESEND_API_KEY 或 SMTP_HOST 以发送认证邮件");
    }

    if (process.env.STARX_USE_MEMORY_DB === "true" && !usingLocalMemoryDb) {
      errors.push("[环境变量] 生产环境不能启用 STARX_USE_MEMORY_DB");
    }

    if (
      !usingLocalMemoryDb &&
      Object.keys(process.env).some((name) => name.startsWith("STARX_DEV_ADMIN_") && hasUsableEnvValue(name))
    ) {
      errors.push("[环境变量] 生产环境不能配置 STARX_DEV_ADMIN_* 本地种子账号变量");
    }
  } else if (!hasEmailTransport()) {
    warnings.push("RESEND_API_KEY/SMTP_HOST 未配置，认证邮件会写入本地 outbox");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
