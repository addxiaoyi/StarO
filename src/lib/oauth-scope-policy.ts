/**
 * OAuth Scope 白名单验证
 *
 * Better Auth 默认允许动态 scope，但这可能带来安全风险。
 * 此模块提供 scope 白名单验证机制。
 */

import type { Scope } from "@better-auth/oauth-provider";

/**
 * 允许的 OAuth scope 列表
 * 客户端只能请求此列表中的 scope
 */
export const ALLOWED_OAUTH_SCOPES: readonly string[] = [
  // OpenID Connect 标准 scope
  "openid",
  "profile",
  "email",
  "offline_access",

  // 用户信息 scope
  "read:user",
  "write:user",

  // 组织 scope
  "read:organization",
  "write:organization",

  // API 访问 scope (如需细分)
  "read:api",
  "write:api",
] as const;

/**
 * 危险的 scope 列表 (需要额外确认)
 */
export const SENSITIVE_OAUTH_SCOPES: readonly string[] = [
  "offline_access",   // 获取刷新令牌，可长期访问
  "write:user",       // 修改用户信息
  "write:organization", // 修改组织信息
  "write:api",        // 修改 API 配置
] as const;

/**
 * 默认请求的 scope (安全集)
 */
export const DEFAULT_OAUTH_SCOPES: readonly string[] = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "read:user",
  "read:organization",
] as const;

/**
 * 验证请求的 scope 是否在白名单内
 */
export function validateScopes(requestedScopes: string[]): {
  valid: boolean;
  invalidScopes: string[];
  sensitiveScopes: string[];
} {
  const allowedSet = new Set(ALLOWED_OAUTH_SCOPES);
  const sensitiveSet = new Set(SENSITIVE_OAUTH_SCOPES);

  const invalidScopes: string[] = [];
  const sensitiveScopes: string[] = [];

  for (const scope of requestedScopes) {
    if (!allowedSet.has(scope)) {
      invalidScopes.push(scope);
    } else if (sensitiveSet.has(scope)) {
      sensitiveScopes.push(scope);
    }
  }

  return {
    valid: invalidScopes.length === 0,
    invalidScopes,
    sensitiveScopes,
  };
}

/**
 * 过滤 scope，只保留白名单内的
 */
export function filterAllowedScopes(requestedScopes: string[]): string[] {
  const allowedSet = new Set(ALLOWED_OAUTH_SCOPES);
  return requestedScopes.filter((scope) => allowedSet.has(scope));
}

/**
 * 检查是否包含敏感 scope
 */
export function hasSensitiveScopes(scopes: string[]): boolean {
  const sensitiveSet = new Set(SENSITIVE_OAUTH_SCOPES);
  return scopes.some((scope) => sensitiveSet.has(scope));
}

/**
 * Scope 描述 (用于 UI 显示)
 */
export const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: "OpenID Connect 身份验证",
  profile: "访问你的公开个人资料 (姓名、头像等)",
  email: "访问你的邮箱地址",
  offline_access: "保持长期登录状态 (获取刷新令牌)",
  "read:user": "读取你的账号信息",
  "write:user": "修改你的账号信息",
  "read:organization": "读取你所在的组织信息",
  "write:organization": "修改你所在的组织信息",
  "read:api": "读取 API 访问权限",
  "write:api": "修改 API 访问权限",
};

/**
 * 获取 scope 的中文描述
 */
export function getScopeDescription(scope: string): string {
  return SCOPE_DESCRIPTIONS[scope] || `Scope: ${scope}`;
}
