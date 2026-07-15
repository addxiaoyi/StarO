/**
 * 会话工具函数
 * 提供会话相关的类型定义和辅助函数
 *
 * @module session-utils
 * @filesdepends auth.ts
 */

import type { StarXSession } from "./auth";

/**
 * 会话状态枚举
 */
export enum SessionStatus {
  Active = "active",
  Expired = "expired",
  Revoked = "revoked",
  Unknown = "unknown",
}

/**
 * 会话设备信息
 */
export interface SessionDevice {
  id: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  isCurrent?: boolean;
}

/**
 * 会话列表响应
 */
export interface SessionListResponse {
  sessions: SessionDevice[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * 会话撤销响应
 */
export interface SessionRevokeResponse {
  revoked: number;
  message: string;
}

/**
 * 解析 User-Agent 字符串，提取设备信息
 */
export function parseUserAgent(userAgent: string | null | undefined): {
  browser: string;
  os: string;
  device: string;
} {
  if (!userAgent) {
    return { browser: "Unknown", os: "Unknown", device: "Unknown" };
  }

  const ua = userAgent.toLowerCase();

  // 浏览器检测
  let browser = "Unknown";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  // 操作系统检测
  let os = "Unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os") || ua.includes("macos")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  // 设备类型检测
  let device = "Desktop";
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    device = "Mobile";
  }
  if (ua.includes("tablet") || ua.includes("ipad")) {
    device = "Tablet";
  }

  return { browser, os, device };
}

/**
 * 判断会话是否过期
 */
export function isSessionExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return false;
  const expiryDate = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return expiryDate < new Date();
}

/**
 * 获取会话状态
 */
export function getSessionStatus(
  expiresAt: Date | string | null | undefined,
  isCurrent?: boolean
): "active" | "expired" | "revoked" {
  if (isCurrent) return "active";
  if (isSessionExpired(expiresAt)) return "expired";
  return "active";
}

/**
 * 格式化会话时长描述
 */
export function formatSessionDuration(createdAt: Date | string | null | undefined): string {
  if (!createdAt) return "未知时长";

  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} 天前`;
  }
  if (diffHours > 0) {
    return `${diffHours} 小时前`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes} 分钟前`;
  }
  return "刚刚";
}

/**
 * 危险等级枚举
 */
export type RiskLevel = "none" | "low" | "medium" | "high";

/**
 * 获取会话的风险级别描述/建议
 */
export function getSessionRiskLevel(
  session: SessionDevice,
  recentSessions: SessionDevice[] = [],
): { level: RiskLevel; advice: string } {
  if (session.isCurrent) {
    return { level: "none", advice: "当前设备，安全。" };
  }

  const risky = isRiskySession(session, recentSessions);

  if (risky) {
    return { level: "high", advice: "该会话可能存在风险，建议立即检查并撤销。" };
  }

  const expired = isSessionExpired(session.expiresAt);
  if (expired) {
    return { level: "medium", advice: "会话已过期，请重新登录。" };
  }

  const createdDays = (() => {
    if (!session.createdAt) return 0;
    const created = typeof session.createdAt === "string" ? new Date(session.createdAt) : session.createdAt;
    const diffMs = new Date().getTime() - created.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  })();

  if (createdDays > 30) {
    return { level: "low", advice: "该会话使用超过 30 天，建议定期更新会话。" };
  }

  return { level: "none", advice: "正常会话。" };
}
  session: StarXSession | null | undefined
): {
  id: string | null;
  email: string | null;
  name: string | null;
  role: string | null;
  emailVerified: boolean | null;
  twoFactorEnabled: boolean | null;
} {
  return {
    id: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    name: session?.user?.name ?? null,
    role: session?.user?.role ?? null,
    emailVerified: session?.user?.emailVerified ?? null,
    twoFactorEnabled: session?.user?.twoFactorEnabled ?? null,
  };
}

/**
 * 检查会话是否属于异常登录（风险提示）
 * 基于近期登录的位置/设备信息判断
 */
export function isRiskySession(
  session: SessionDevice,
  recentSessions: SessionDevice[] = [],
  sameIpThreshold = 1,
): boolean {
  if (!session.ipAddress) return false;

  // 实时/当前会话忽略风险标记
  if (session.isCurrent) return false;

  // 统计相同 IP 的活跃会话数量（不含自己）
  const sessionsFromSameIp = recentSessions.filter(
    s => s.id !== session.id && s.ipAddress === session.ipAddress && !s.isCurrent,
  );
  return sessionsFromSameIp.length >= sameIpThreshold;
}
  const role = session?.user?.role;
  if (!role) return false;
  if (typeof role === "string") return role === "admin";
  if (Array.isArray(role)) return role.includes("admin");
  return false;
}

/**
 * 验证会话是否有效
 */
export function isValidSession(session: StarXSession | null | undefined): session is StarXSession {
  if (!session) return false;
  if (!session.user) return false;
  if (!session.user.id) return false;
  return true;
}
