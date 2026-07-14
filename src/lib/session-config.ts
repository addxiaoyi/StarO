/**
 * 会话管理配置
 *
 * 通过环境变量控制会话行为，支持以下配置：
 *
 * STARX_MAX_SESSIONS
 *   最大并发会话数，默认 10
 *   设置为 null 表示不限制
 *
 * STARX_SESSION_EXPIRES_IN
 *   会话过期时间（秒），默认 604800 (7 天)
 *   用户在此期间无活动后会话将过期
 *
 * STARX_JWT_EXPIRES_IN
 *   JWT 令牌过期时间（秒），默认 3600 (1 小时)
 *   用于 API 认证的短效令牌
 *
 * STARX_REFRESH_EXPIRES_IN
 *   刷新令牌过期时间（秒），默认 604800 (7 天)
 *   用于获取新的 JWT 令牌
 *
 * 示例 .env 配置:
 * ```env
 * STARX_MAX_SESSIONS=5
 * STARX_SESSION_EXPIRES_IN=86400
 * STARX_JWT_EXPIRES_IN=1800
 * STARX_REFRESH_EXPIRES_IN=259200
 * ```
 */

export const SESSION_CONFIG_DEFAULTS = {
  maxSessions: 10,
  sessionExpiresIn: 60 * 60 * 24 * 7,    // 7 天
  jwtExpiresIn: 60 * 60,                   // 1 小时
  refreshExpiresIn: 60 * 60 * 24 * 7,     // 7 天
};

export interface SessionConfig {
  maxSessions: number;
  sessionExpiresIn: number;
  jwtExpiresIn: number;
  refreshExpiresIn: number;
}

/**
 * 解析会话配置（从环境变量）
 */
export function getSessionConfig(): SessionConfig {
  return {
    maxSessions: Number(process.env.STARX_MAX_SESSIONS) || SESSION_CONFIG_DEFAULTS.maxSessions,
    sessionExpiresIn: Number(process.env.STARX_SESSION_EXPIRES_IN) || SESSION_CONFIG_DEFAULTS.sessionExpiresIn,
    jwtExpiresIn: Number(process.env.STARX_JWT_EXPIRES_IN) || SESSION_CONFIG_DEFAULTS.jwtExpiresIn,
    refreshExpiresIn: Number(process.env.STARX_REFRESH_EXPIRES_IN) || SESSION_CONFIG_DEFAULTS.refreshExpiresIn,
  };
}

/**
 * 格式化时间
 */
export function formatExpiresIn(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时`;
  return `${Math.floor(seconds / 86400)} 天`;
}
