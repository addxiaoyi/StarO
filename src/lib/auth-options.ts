import { apiKey } from "@better-auth/api-key";
import { oauthProvider } from "@better-auth/oauth-provider";
import { passkey } from "@better-auth/passkey";
import type { BetterAuthOptions } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  bearer,
  emailOTP,
  jwt,
  magicLink,
  multiSession,
  oneTap,
  organization,
  twoFactor,
  username,
} from "better-auth/plugins";
import { APP_NAME, getBaseUrl, isProviderConfigured, oauthProviders } from "./app-config";
import { sendAuthEmail } from "./email";

export const DEVELOPMENT_ADMIN_USER_ID = "starx-dev-admin";
export const DEVELOPMENT_ADMIN_ACCOUNT_RECORD_ID = "starx-dev-admin-credential";
// Generated with Better Auth's default password hasher for the local-only password: Password123!
export const DEFAULT_DEVELOPMENT_ADMIN_PASSWORD_HASH =
  "ad8f7a0c6f8c9d6c78a4a950718356be:3f69c1536f8626ec47b33948e990a3a759c0dbbd7017f45305b3ca018c0423ea6c9e45955a2c733ef113052bf4181d213f2b0f42d88a63c8d186701caf1210ae";

type CreateAuthOptionsInput = {
  database?: BetterAuthOptions["database"];
};

function getTrustedOrigins(baseURL: string) {
  const origins = new Set([baseURL]);

  try {
    const url = new URL(baseURL);
    const alternateHost =
      url.hostname === "localhost"
        ? "127.0.0.1"
        : url.hostname === "127.0.0.1"
          ? "localhost"
          : null;

    if (alternateHost) {
      origins.add(`${url.protocol}//${alternateHost}${url.port ? `:${url.port}` : ""}`);
    }
  } catch {
    return [baseURL];
  }

  return [...origins];
}

function isLocalBetterAuthUrl() {
  const authUrl = process.env.BETTER_AUTH_URL;

  if (!authUrl) {
    return true;
  }

  try {
    const hostname = new URL(authUrl).hostname;

    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function getDevelopmentAdminSeed() {
  const email = process.env.STARX_DEV_ADMIN_EMAIL?.trim().toLowerCase();

  if (!email || process.env.DATABASE_URL || !isLocalBetterAuthUrl()) {
    return null;
  }

  return {
    email,
    id: DEVELOPMENT_ADMIN_USER_ID,
    name: process.env.STARX_DEV_ADMIN_NAME?.trim() || "本地管理员",
    passwordHash:
      process.env.STARX_DEV_ADMIN_PASSWORD_HASH?.trim() || DEFAULT_DEVELOPMENT_ADMIN_PASSWORD_HASH,
  };
}

function getAdminUserIds() {
  const configuredIds =
    process.env.STARX_ADMIN_USER_IDS?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) ?? [];
  const seed = getDevelopmentAdminSeed();

  if (seed) {
    configuredIds.push(seed.id);
  }

  return configuredIds.length > 0 ? configuredIds : undefined;
}

function getTrustedAccountProviders() {
  return [
    "email-password",
    ...oauthProviders
      .filter((provider) => isProviderConfigured(provider.env))
      .map((provider) => provider.id),
  ];
}

export function createAuthOptions(input: CreateAuthOptionsInput = {}): BetterAuthOptions {
  const baseURL = getBaseUrl();

  return {
    appName: APP_NAME,
    baseURL,
    database: input.database,
    secret: (() => {
      const secret = process.env.BETTER_AUTH_SECRET;
      if (!secret) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("BETTER_AUTH_SECRET environment variable is required in production");
        }
        return "starx-oauth-development-secret-do-not-use-in-production";
      }
      return secret;
    })(),
    trustedOrigins: getTrustedOrigins(baseURL),
    account: {
      accountLinking: {
        trustedProviders: getTrustedAccountProviders(),
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      async sendVerificationEmail({ user, url }) {
        await sendAuthEmail({
          to: user.email,
          subject: "确认你的邮箱",
          title: "确认你的邮箱",
          body: "点击下方按钮确认这是你的邮箱，之后就可以登录账号中心。",
          actionLabel: "确认邮箱",
          actionUrl: url,
          note: "如果你没有创建或登录 StarX-Oauth 账号，可以忽略这封邮件。",
        });
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      async sendResetPassword({ user, url }) {
        await sendAuthEmail({
          to: user.email,
          subject: "找回你的登录密码",
          title: "设置新的登录密码",
          body: "点击下方按钮设置新的登录密码。为了账号安全，建议只在自己的设备上操作。",
          actionLabel: "设置新密码",
          actionUrl: url,
          note: "如果不是你发起的找回密码请求，可以忽略这封邮件。",
        });
      },
    },
    socialProviders: {
      google: {
        enabled: isProviderConfigured(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]),
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
      github: {
        enabled: isProviderConfigured(["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]),
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      },
      discord: {
        enabled: isProviderConfigured(["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"]),
        clientId: process.env.DISCORD_CLIENT_ID || "",
        clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      },
      microsoft: {
        enabled: isProviderConfigured(["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"]),
        clientId: process.env.MICROSOFT_CLIENT_ID || "",
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      },
    },
    plugins: [
      username(),
      magicLink({
        async sendMagicLink({ email, url }) {
          await sendAuthEmail({
            to: email,
            subject: "继续登录 StarX-Oauth",
            title: "继续登录",
            body: "点击下方按钮完成本次登录。不要把这封邮件转发给别人。",
            actionLabel: "继续登录",
            actionUrl: url,
            note: "如果不是你本人想登录，可以忽略这封邮件。",
          });
        },
      }),
      emailOTP({
        sendVerificationOnSignUp: false,
        async sendVerificationOTP({ email, otp, type }) {
          await sendAuthEmail({
            to: email,
            subject: "确认邮箱的 6 位数字",
            title: "输入这 6 位数字",
            body: type === "email-verification" ? "在页面中输入这 6 位数字，确认邮箱。" : "在页面中输入这 6 位数字，完成这次操作。",
            code: otp,
            note: "如果不是你本人在操作，可以忽略这封邮件。",
          });
        },
      }),
      twoFactor({
        issuer: APP_NAME,
        allowPasswordless: true,
        otpOptions: {
          async sendOTP({ user, otp }) {
            await sendAuthEmail({
              to: user.email,
              subject: "你的登录确认数字",
              title: "确认是你本人登录",
              body: "在登录页面输入这 6 位数字，完成本次登录确认。",
              code: otp,
              note: "如果不是你本人正在登录，请尽快检查账号安全。",
            });
          },
        },
      }),
      passkey(),
      oneTap(),
      multiSession(),
      bearer(),
      jwt(),
      apiKey({
        defaultPrefix: "starx_",
        requireName: true,
        references: "user",
        rateLimit: {
          enabled: true,
          timeWindow: 1000 * 60 * 60,
          maxRequests: 100,
        },
      }),
      organization({
        async sendInvitationEmail(data) {
          await sendAuthEmail({
            to: data.email,
            subject: "你收到一个团队邀请",
            title: "有人邀请你加入团队",
            body: `${data.inviter.user.email} 邀请你加入 ${data.organization.name} 团队。点击下方按钮查看详情，再决定是否加入。`,
            actionLabel: "查看团队邀请",
            actionUrl: `${baseURL}/accept-invitation/${data.id}`,
            note: "如果你不认识这个团队，或没有期待这封邀请，可以忽略这封邮件。",
          });
        },
      }),
      oauthProvider({
        loginPage: "/sign-in",
        consentPage: "/oauth/consent",
        allowDynamicClientRegistration: true,
        clientRegistrationDefaultScopes: ["openid", "profile", "email", "offline_access"],
        scopes: ["openid", "profile", "email", "offline_access", "read:user", "read:organization"],
        signup: {
          page: "/sign-up",
        },
        selectAccount: {
          page: "/oauth/select-account",
          shouldRedirect: async () => false,
        },
        postLogin: {
          page: "/oauth/select-organization",
          consentReferenceId: async ({ session }) => session.activeOrganizationId as string | undefined,
          shouldRedirect: async ({ scopes, session }) =>
            scopes.includes("read:organization") && !session.activeOrganizationId,
        },
        silenceWarnings: {
          oauthAuthServerConfig: true,
        },
      }),
      admin({
        defaultRole: "user",
        adminRoles: ["admin"],
        adminUserIds: getAdminUserIds(),
      }),
      nextCookies(),
    ],
    advanced: {
      cookiePrefix: "starx-oauth",
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
      },
    },
  };
}
