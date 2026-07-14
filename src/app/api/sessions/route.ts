/**
 * 会话管理 API
 *
 * 提供会话列表、强制登出等功能
 */

import { getAuth } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { writeAuditLog, extractAuditContext } from "@/lib/audit-log";
import type { NextRequest } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  userId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// Session 类型
type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  emailVerified?: boolean | null;
  twoFactorEnabled?: boolean | null;
};

type SessionInfo = {
  id: string;
  userId: string;
  user?: SessionUser;
  session?: {
    id: string;
    activeOrganizationId?: string | null;
  };
};

/**
 * GET /api/sessions - 获取会话列表
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

    const searchParams = req.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      userId: searchParams.get("userId"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 管理员可以查看其他用户的会话，普通用户只能查看自己的
    const targetUserId = parsed.data.userId;
    const isAdmin = sessionInfo.user.role === "admin";
    const actualUserId = targetUserId && isAdmin ? targetUserId : sessionInfo.user.id;

    if (!actualUserId) {
      return new Response(JSON.stringify({ error: "User ID not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pool = getPool();
    if (!pool) {
      // 内存模式返回空列表
      return new Response(
        JSON.stringify({ sessions: [], total: 0, limit: parsed.data.limit, offset: parsed.data.offset }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 查询会话
    const sessionsSql = `
      SELECT s.id, s.user_id, s.ip_address, s.user_agent, s.expires_at, s.created_at,
             s.updated_at
      FROM sessions s
      WHERE s.user_id = $1
      ORDER BY s.updated_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countSql = `SELECT COUNT(*) as total FROM sessions WHERE user_id = $1`;

    const [sessionsResult, countResult] = await Promise.all([
      pool.query(sessionsSql, [actualUserId, parsed.data.limit, parsed.data.offset]),
      pool.query(countSql, [actualUserId]),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);

    const sessions = sessionsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return new Response(
      JSON.stringify({ sessions, total, limit: parsed.data.limit, offset: parsed.data.offset }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sessions] GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * DELETE /api/sessions - 撤销指定会话
 */
const deleteSchema = z.object({
  sessionId: z.string().optional(),
  allExceptCurrent: z.boolean().optional(),
});

export async function DELETE(req: NextRequest) {
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

    const body = await req.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = sessionInfo.user.id;
    const targetUserId = parsed.data.allExceptCurrent ? userId : userId;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pool = getPool();
    if (!pool) {
      return new Response(JSON.stringify({ revoked: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let revoked = 0;

    if (parsed.data.sessionId) {
      // 撤销指定会话
      const sql = `DELETE FROM sessions WHERE id = $1 AND user_id = $2`;
      const result = await pool.query(sql, [parsed.data.sessionId, targetUserId]);
      revoked = result.rowCount || 0;
    } else if (parsed.data.allExceptCurrent) {
      // 撤销除当前会话外的所有会话
      const currentSessionId = sessionInfo.session?.id;
      const sql = `
        DELETE FROM sessions
        WHERE user_id = $1
        ${currentSessionId ? "AND id != $2" : ""}
      `;
      const params = currentSessionId ? [targetUserId, currentSessionId] : [targetUserId];
      const result = await pool.query(sql, params);
      revoked = result.rowCount || 0;
    }

    // 记录审计日志
    const auditContext = extractAuditContext(req);
    await writeAuditLog({
      event: "user.session.revoke",
      actorId: userId,
      actorEmail: sessionInfo.user.email || undefined,
      metadata: { revoked, targetUserId },
      ...auditContext,
    });

    return new Response(
      JSON.stringify({ revoked, message: `已撤销 ${revoked} 个会话` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sessions] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const dynamic = "force-dynamic";
