"use client";

import { apiKeyClient } from "@better-auth/api-key/client";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  emailOTPClient,
  magicLinkClient,
  multiSessionClient,
  oneTapClient,
  organizationClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const googleOneTapClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export const authClient = createAuthClient({
  plugins: [
    usernameClient(),
    magicLinkClient(),
    emailOTPClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/two-factor";
      },
    }),
    passkeyClient(),
    ...(googleOneTapClientId
      ? [
          oneTapClient({
            clientId: googleOneTapClientId,
            promptOptions: {
              maxAttempts: 1,
            },
          }),
        ]
      : []),
    multiSessionClient(),
    organizationClient(),
    oauthProviderClient(),
    apiKeyClient(),
    adminClient(),
  ],
  fetchOptions: {
    onError(error) {
      if (error.error.status === 429) {
        console.warn("X-Oauth 请求被限流。");
      }
    },
  },
});

export type AuthActionResult<T = unknown> =
  | {
      data?: T;
      error?: {
        message?: string;
        status?: number;
      };
    }
  | undefined;

type AdminUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | string[] | null;
  banned?: boolean | null;
  banReason?: string | null;
  emailVerified?: boolean | null;
};

type ListUsersQuery = {
  limit?: number;
  offset?: number;
  searchValue?: string;
  searchField?: "email" | "name";
  searchOperator?: "contains" | "starts_with" | "ends_with";
};

type ListUsersResult = {
  users?: AdminUser[];
  total?: number;
  limit?: number;
  offset?: number;
};

type TwoFactorSetupResult = {
  totpURI?: string;
  backupCodes?: string[];
};

export type ApiKeyRecord = {
  id: string;
  name?: string | null;
  start?: string | null;
  prefix?: string | null;
  enabled?: boolean | null;
  requestCount?: number | null;
  remaining?: number | null;
  lastRequest?: Date | string | null;
  expiresAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

type ListApiKeysResult = {
  apiKeys?: ApiKeyRecord[];
  total?: number;
  limit?: number;
  offset?: number;
};

type SessionRecord = {
  id: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

type ListSessionsResult = {
  sessions?: SessionRecord[];
  total?: number;
  limit?: number;
  offset?: number;
};

export type SessionStatus = "active" | "inactive" | "revoked";

export type SessionWithStatus = SessionRecord & {
  status: SessionStatus;
  isCurrent?: boolean;
  isRisky?: boolean;
  canToggle?: boolean;
};

export type SessionUpdateInput = {
  /** 会话 ID */
  sessionId: string;
  /** 新状态 */
  status?: SessionStatus;
  /** 自定义过期时间 (秒) */
  expiresIn?: number;
};

export type StarXAuthClient = typeof authClient & {
  signIn: {
    email(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
    magicLink(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
    passkey(input?: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
    social(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
  };
  signUp: {
    email(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
  };
  requestPasswordReset(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
  resetPassword(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
  verifyEmail(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
  sendVerificationEmail(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
  revokeOtherSessions(input?: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
  updateSession(input: SessionUpdateInput, options?: unknown): Promise<AuthActionResult<SessionRecord>>;
  twoFactor: {
    enable(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult<TwoFactorSetupResult>>;
    sendOtp(input?: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
    verifyOtp(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
    verifyTotp(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
  };
  passkey: {
    addPasskey(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
  };
  apiKey: {
    create(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult<{ key?: string } & ApiKeyRecord>>;
    list(input?: { query?: Record<string, unknown> }, options?: unknown): Promise<AuthActionResult<ListApiKeysResult>>;
    update(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult<ApiKeyRecord>>;
    delete(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult<{ success?: boolean }>>;
  };
  admin: {
    listUsers(input?: { query?: ListUsersQuery }, options?: unknown): Promise<AuthActionResult<ListUsersResult>>;
    createUser(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
    revokeUserSessions(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
    banUser(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
    getUserSessions(input?: { query?: Record<string, unknown> }, options?: unknown): Promise<AuthActionResult<ListSessionsResult>>;
    revokeSession(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult>;
  };
  oauth2: {
    consent(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult<{ redirectURI?: string }>>;
    continue(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult<{ redirectURI?: string }>>;
  };
  updateSession(input: SessionUpdateInput, options?: unknown): Promise<AuthActionResult<SessionRecord>>;


/**
 * 创建强类型的认证客户端
 * Calls getAuth() internally to ensure proper Better Auth 实例初始化
 *
 * @returns 强类型认证客户端实例 (StarXAuthClient)
 */
export function starxAuthClient() {
  return authClient as unknown as StarXAuthClient;
}

/**
 * 会话管理相关辅助函数
 */
export const sessionsHelpers = {
  /**
   * 判定会话是否异常
   * @param session 会话信息
   * @param recentSessions 最近的其他会话列表，用于比较 IP/设备
   * @returns 是否异常
   */
  isAbnormalSession(session: SessionRecord | SessionWithStatus, recentSessions: (SessionRecord | SessionWithStatus)[], threshold = 2) {
    if (!session.ipAddress) return;
    const otherLogins = recentSessions.filter(s => s.id !== session.id && s.ipAddress);
    const sameIpCount = otherLogins.filter(s => s.ipAddress === session.ipAddress).length;
    return sameIpCount >= threshold - 1; // 含当前会话，>=2 个会话同 IP
  },

  /**
   * 获取会话状态（优先级：已给出>过期>撤销）
   */
  getStatus(session: SessionRecord | SessionWithStatus): SessionStatus {
    if ('status' in session) {
      if (session.status === 'revoked') return 'revoked';
      if (session.status === 'inactive') return 'inactive';
    }
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return 'inactive';
    }
    return 'active';
  },

  /**
   * 会话是否可切换（非自我且非已撤销）
   */
  canToggle(session: SessionRecord): boolean {
    // 暂不实现，返回 true 即可切换
    return true;
  },
};
