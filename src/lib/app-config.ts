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
  return envNames.every((name) => Boolean(process.env[name]));
}

const REQUIRED_PRODUCTION_ENV_VARS = [
  "BETTER_AUTH_SECRET",
  "DATABASE_URL",
] as const;

const OPTIONAL_PRODUCTION_ENV_VARS = [
  "RESEND_API_KEY",
  "STARX_ADMIN_USER_IDS",
] as const;

export function validateEnvironment() {
  const errors: string[] = [];

  if (process.env.NODE_ENV === "production") {
    for (const varName of REQUIRED_PRODUCTION_ENV_VARS) {
      if (!process.env[varName]) {
        errors.push(`[环境变量] 生产环境必须配置: ${varName}`);
      }
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("[环境变量] 警告: RESEND_API_KEY 未配置，邮件功能将不可用");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [
      ...(process.env.RESEND_API_KEY ? [] : ["RESEND_API_KEY 未配置"]),
      ...(process.env.BETTER_AUTH_SECRET && process.env.NODE_ENV !== "production"
        ? []
        : []),
    ],
  };
}
