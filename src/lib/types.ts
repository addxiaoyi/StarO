/**
 * 集中式类型导出
 *
 * 本模块统一导出所有公共类型定义
 *
 * @module types
 * @see auth.ts - StarXSession 定义
 * @see auth-client.ts - StarXAuthClient, AuthActionResult, ApiKeyRecord 定义
 * @see session-utils.ts - SessionDevice, SessionStatus 等定义
 */

// Re-export all types from source modules
export type { StarXSession } from "./auth";

export type {
  AuthActionResult,
  ApiKeyRecord,
  StarXAuthClient,
} from "./auth-client";

export type {
  SessionDevice,
  SessionListResponse,
  SessionRevokeResponse,
  SessionStatus,
} from "./session-utils";

// Also export the type (not just enum)
export type { SessionStatus } from "./session-utils";

/**
 * API 通用响应类型
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    status?: number;
    details?: unknown;
  };
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * 用户基本信息
 */
export interface UserProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  emailVerified?: boolean | null;
  twoFactorEnabled?: boolean | null;
  role?: string | string[] | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

/**
 * 审计日志事件类型
 */
export type AuditEventType =
  | "user.login"
  | "user.logout"
  | "user.register"
  | "user.password_change"
  | "user.password_reset"
  | "user.email_verify"
  | "user.session.revoke"
  | "user.two_factor.enable"
  | "user.two_factor.disable"
  | "admin.user.ban"
  | "admin.user.unban"
  | "admin.user.create"
  | "admin.api_key.create"
  | "admin.api_key.delete"
  | "oauth.authorize"
  | string;
