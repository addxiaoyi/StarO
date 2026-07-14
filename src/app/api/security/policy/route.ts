/**
 * 安全配置 API
 *
 * 提供安全策略配置、IP 白名单管理等
 */

import { getAuth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { z } from "zod";

// Session 类型
type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type SessionInfo = {
  user: SessionUser;
  session?: {
    activeOrganizationId?: string | null;
  };
};

// 安全策略配置 schema
const securityPolicySchema = z.object({
  maxLoginAttempts: z.number().int().positive().max(20).optional(),
  lockoutDuration: z.number().int().positive().optional(), // 秒
  sessionTimeout: z.number().int().positive().optional(), // 秒
  requireMFA: z.boolean().optional(),
  allowedIPRanges: z.array(z.string()).optional(),
  blockedIPRanges: z.array(z.string()).optional(),
});

/**
 * GET /api/security/policy - 获取当前安全策略
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuth();
    const sessionInfo = (await auth.api.getSession({
      headers: req.headers,
    })) as SessionInfo | null;

    if (!sessionInfo?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 检查是否为管理员
    const isAdmin = sessionInfo.user.role === "admin";
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 从环境变量读取安全配置
    const policy = {
      maxLoginAttempts: Number(process.env.STARX_MAX_LOGIN_ATTEMPTS) || 5,
      lockoutDuration: Number(process.env.STARX_LOCKOUT_DURATION) || 900, // 15 分钟
      sessionTimeout: Number(process.env.STARX_SESSION_TIMEOUT) || 3600, // 1 小时
      requireMFA: process.env.STARX_REQUIRE_MFA === "true",
      mfaGracePeriod: Number(process.env.STARX_MFA_GRACE_PERIOD) || 0,
    };

    return new Response(JSON.stringify({ policy }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[security/policy] GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * PUT /api/security/policy - 更新安全策略
 * 注意：实际配置存储在环境变量中，此 API 仅用于管理界面
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = getAuth();
    const sessionInfo = (await auth.api.getSession({
      headers: req.headers,
    })) as SessionInfo | null;

    if (!sessionInfo?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 检查是否为管理员
    const isAdmin = sessionInfo.user.role === "admin";
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = securityPolicySchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 注意：这里返回的是建议配置，实际需要通过环境变量或配置服务应用
    // 在生产环境中，这些配置应该持久化到数据库
    const suggestedChanges = {
      envVars: {
        STARX_MAX_LOGIN_ATTEMPTS: parsed.data.maxLoginAttempts?.toString(),
        STARX_LOCKOUT_DURATION: parsed.data.lockoutDuration?.toString(),
        STARX_SESSION_TIMEOUT: parsed.data.sessionTimeout?.toString(),
        STARX_REQUIRE_MFA: parsed.data.requireMFA?.toString(),
      },
      message: "配置建议已生成，请在服务器环境中设置相应的环境变量以应用更改。",
    };

    return new Response(
      JSON.stringify({
        success: true,
        ...suggestedChanges,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[security/policy] PUT error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const dynamic = "force-dynamic";
