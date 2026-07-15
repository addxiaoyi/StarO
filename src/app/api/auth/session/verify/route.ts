/**
 * 会话验证 API
 *
 * 提供当前会话验证和刷新功能
 */

import { getAuth } from "@/lib/auth";
import type { NextRequest } from "next/server";

/**
 * POST /api/auth/session/verify - 验证当前会话是否有效
 *
 * 可用于：
 * - 定期检查会话有效性
 * - 在敏感操作前验证会话
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getAuth();

    // 获取会话信息
    const sessionInfo = (await auth.api.getSession({
      headers: req.headers,
    })) as { user?: { id?: string; email?: string | null; name?: string | null; role?: string | null } } | null;

    if (!sessionInfo || !sessionInfo.user) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: "会话无效或已过期",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 检查会话是否过期
    const sessionData = sessionInfo as { session?: { expiresAt?: string | number | Date } };
    const expiresAt = sessionData.session?.expiresAt;
    if (expiresAt) {
      const expiryDate = new Date(expiresAt as string | number | Date);
      if (expiryDate.getTime() < Date.now()) {
        return new Response(
          JSON.stringify({
            valid: false,
            message: "会话已过期",
            expiredAt: expiresAt,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        user: {
          id: sessionInfo.user.id,
          email: sessionInfo.user.email,
          name: sessionInfo.user.name,
          role: sessionInfo.user.role,
        },
        expiresAt: expiresAt,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[session/verify] POST error:", error);
    return new Response(
      JSON.stringify({
        valid: false,
        message: "验证失败",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export const dynamic = "force-dynamic";
