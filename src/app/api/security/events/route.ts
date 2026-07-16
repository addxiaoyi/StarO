/**
 * 安全事件 API
 *
 * 获取安全相关事件和统计
 */

import { getPool } from "@/lib/db";
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

const querySchema = z.object({
  type: z.enum(["login_failed", "suspicious_activity", "mfa_bypass", "all"]).default("all"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/**
 * GET /api/security/events - 获取安全事件
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const view = searchParams.get("view");

  // 如果请求的是统计数据
  if (view === "stats") {
    return getSecurityStats(req);
  }

  // 否则返回事件列表
  return getSecurityEvents(req);
}

async function getSecurityEvents(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      type: searchParams.get("type"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const pool = getPool();
    if (!pool) {
      return new Response(JSON.stringify({ events: [], total: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 从审计日志中提取安全相关事件
    const eventTypes: string[] = [];
    if (parsed.data.type === "all" || parsed.data.type === "login_failed") {
      eventTypes.push("auth.login_failed");
    }
    if (parsed.data.type === "all" || parsed.data.type === "mfa_bypass") {
      eventTypes.push("auth.two_factor_disabled", "auth.two_factor_enabled");
    }
    if (parsed.data.type === "all" || parsed.data.type === "suspicious_activity") {
      eventTypes.push("user.ban", "user.session.revoke", "api_key.delete");
    }

    if (eventTypes.length === 0) {
      return new Response(JSON.stringify({ events: [], total: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const conditions = [`event = ANY($1)`];
    const params: unknown[] = [eventTypes];
    let paramIndex = 2;

    if (parsed.data.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(new Date(parsed.data.startDate));
    }
    if (parsed.data.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(new Date(parsed.data.endDate));
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // 查询事件
    const eventsSql = `
      SELECT id, event, actor_id, actor_email, target_user_id, target_email,
             ip_address, user_agent, metadata, created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;

    const [eventsResult, countResult] = await Promise.all([
      pool.query(eventsSql, [...params, parsed.data.limit, parsed.data.offset]),
      pool.query(countSql, params),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);

    return new Response(
      JSON.stringify({
        events: eventsResult.rows,
        total,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[security/events] GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * 获取安全统计数据
 */
async function getSecurityStats(req: NextRequest) {
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

    const pool = getPool();
    if (!pool) {
      return new Response(
        JSON.stringify({
          totalFailedLogins: 0,
          totalMFAChanges: 0,
          totalSessionRevokes: 0,
          recentTrend: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 获取统计数据
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const statsSql = `
      SELECT
        event,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE created_at >= $1) as last_24h,
        COUNT(*) FILTER (WHERE created_at >= $2) as last_7d
      FROM audit_logs
      WHERE event IN ('auth.login_failed', 'auth.two_factor_enabled', 'auth.two_factor_disabled', 'user.session.revoke')
      GROUP BY event
    `;

    const result = await pool.query(statsSql, [oneDayAgo, sevenDaysAgo]);

    const stats: Record<string, { total: number; last24h: number; last7d: number }> = {};
    for (const row of result.rows) {
      stats[row.event] = {
        total: Number(row.count),
        last24h: Number(row.last_24h),
        last7d: Number(row.last_7d),
      };
    }

    return new Response(
      JSON.stringify({
        totalFailedLogins: stats["auth.login_failed"]?.total || 0,
        totalFailedLoginsLast24h: stats["auth.login_failed"]?.last24h || 0,
        totalMFAChanges: (stats["auth.two_factor_enabled"]?.total || 0) + (stats["auth.two_factor_disabled"]?.total || 0),
        totalMFAChangesLast24h: (stats["auth.two_factor_enabled"]?.last24h || 0) + (stats["auth.two_factor_disabled"]?.last24h || 0),
        totalSessionRevokes: stats["user.session.revoke"]?.total || 0,
        totalSessionRevokesLast24h: stats["user.session.revoke"]?.last24h || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[security/stats] GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const dynamic = "force-dynamic";
