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
        console.warn("StarX-Oauth 请求被限流。");
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
  };
  oauth2: {
    consent(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult<{ redirectURI?: string }>>;
    continue(input: Record<string, unknown>, options?: unknown): Promise<AuthActionResult<{ redirectURI?: string }>>;
  };
};

export function starxAuthClient() {
  return authClient as unknown as StarXAuthClient;
}
