/**
 * 会话撤销 API
 *
 * 提供撤销指定会话或所有其他会话的功能
 */

import { getAuth } from "@/lib/auth";
import { getPool } from "@/lib/db";
import type { NextRequest } from "next/server";
import { z } from "zod";

const revokeSchema = z.object({
  sessionId: z.string().uuid().optional(),
  allExceptCurrent: z.boolean().optional(),
  userId: z.string().uuid().optional(),
});

type SessionInfo = {
  user?: {
    id?: string;
    role?: string | null;
    email?: string | null;
  };
  session?: {
    id?: string;
  };
};

/**
 * POST /api/auth/session/revoke - 撤销会话
 *
 * 请求体:
 * - sessionId: 要撤销的会话 ID（可选）
 * - allExceptCurrent: 撤销除当前会话外的所有会话（可选）
 * - userId: 目标用户 ID（仅管理员可用）
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getAuth();

    // 获取当前会话
    const sessionInfo = (await auth.api.getSession({
      headers: req.headers,
    })) as SessionInfo | null;

    if (!sessionInfo?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 解析请求体
    const body = await req.json().catch(() => ({}));
    const parsed = revokeSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const currentUserId = sessionInfo.user.id;
    const currentSessionId = sessionInfo.session?.id;
    const isAdmin = sessionInfo.user.role === "admin";

    // 确定目标用户
    let targetUserId = currentUserId;
    if (parsed.data.userId && isAdmin) {
      targetUserId = parsed.data.userId;
    } else if (parsed.data.userId && parsed.data.userId !== currentUserId) {
      // 非管理员不能撤销其他用户的会话
      return new Response(
        JSON.stringify({ error: "Forbidden: Cannot revoke other users' sessions" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const pool = getPool();
    if (!pool) {
      return new Response(
        JSON.stringify({
          revoked: 0,
          message: "Database not configured",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let revoked = 0;

    if (parsed.data.sessionId) {
      // 撤销指定会话
      // 确保只能撤销自己的会话（除非是管理员）
      const sql = `
        DELETE FROM sessions
        WHERE id = $1 AND user_id = $2
      `;
      const result = await pool.query(sql, [parsed.data.sessionId, targetUserId]);
      revoked = result.rowCount || 0;
    } else if (parsed.data.allExceptCurrent) {
      // 撤销除当前会话外的所有会话
      if (currentSessionId) {
        const sql = `
          DELETE FROM sessions
          WHERE user_id = $1 AND id != $2
        `;
        const result = await pool.query(sql, [targetUserId, currentSessionId]);
        revoked = result.rowCount || 0;
      }
    } else if (!parsed.data.sessionId && !parsed.data.allExceptCurrent) {
      return new Response(
        JSON.stringify({ error: "Must specify either sessionId or allExceptCurrent" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        revoked,
        message: revoked > 0 ? `已撤销 ${revoked} 个会话` : "没有会话被撤销",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[session/revoke] POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const dynamic = "force-dynamic";
