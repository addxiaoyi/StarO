/**
 * 组织成员管理 API
 */

import { getAuth } from "@/lib/auth";
import { writeAuditLog, extractAuditContext } from "@/lib/audit-log";
import type { NextRequest } from "next/server";
import { z } from "zod";

const addMemberSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  role: z.enum(["admin", "member"]).default("member"),
});

const updateMemberSchema = z.object({
  organizationId: z.string(),
  userId: z.string(),
  role: z.enum(["admin", "member"]),
});

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

// Organization API 类型
type OrganizationAPI = {
  addMember?: (input: { body: unknown; headers: Headers }) => Promise<unknown>;
  updateMember?: (input: { body: unknown; headers: Headers }) => Promise<unknown>;
  removeMember?: (input: { body: { organizationId: string; userId: string }; headers: Headers }) => Promise<unknown>;
};

/**
 * POST /api/organizations/members - 添加成员
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const parsed = addMemberSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const orgApi = auth.api as OrganizationAPI;
    const result = await orgApi.addMember?.({
      body: {
        organizationId: parsed.data.organizationId,
        userId: parsed.data.userId,
        role: parsed.data.role,
      },
      headers: req.headers,
    }) as { member?: unknown; error?: { message: string } } | undefined;

    if (!result || result.error) {
      return new Response(
        JSON.stringify({ error: result?.error?.message || "Failed to add member" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 记录审计日志
    const auditContext = extractAuditContext(req);
    await writeAuditLog({
      event: "organization.member.add" as never,
      actorId: sessionInfo.user.id,
      actorEmail: sessionInfo.user.email || undefined,
      targetUserId: parsed.data.userId,
      metadata: {
        organizationId: parsed.data.organizationId,
        role: parsed.data.role,
      },
      ...auditContext,
    });

    return new Response(
      JSON.stringify({ member: result.member }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[organization-members] POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * PATCH /api/organizations/members - 更新成员角色
 */
export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const orgApi = auth.api as OrganizationAPI;
    const result = await orgApi.updateMember?.({
      body: {
        organizationId: parsed.data.organizationId,
        userId: parsed.data.userId,
        role: parsed.data.role,
      },
      headers: req.headers,
    }) as { member?: unknown; error?: { message: string } } | undefined;

    if (!result || result.error) {
      return new Response(
        JSON.stringify({ error: result?.error?.message || "Failed to update member" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 记录审计日志
    const auditContext = extractAuditContext(req);
    await writeAuditLog({
      event: "organization.member.update" as never,
      actorId: sessionInfo.user.id,
      actorEmail: sessionInfo.user.email || undefined,
      targetUserId: parsed.data.userId,
      metadata: {
        organizationId: parsed.data.organizationId,
        newRole: parsed.data.role,
      },
      ...auditContext,
    });

    return new Response(
      JSON.stringify({ member: result.member }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[organization-members] PATCH error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * DELETE /api/organizations/members - 移除成员
 */
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

    const { searchParams } = req.nextUrl;
    const organizationId = searchParams.get("organizationId");
    const userId = searchParams.get("userId");

    if (!organizationId || !userId) {
      return new Response(
        JSON.stringify({ error: "organizationId and userId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const orgApi = auth.api as OrganizationAPI;
    const result = await orgApi.removeMember?.({
      body: { organizationId, userId },
      headers: req.headers,
    }) as { error?: { message: string } } | undefined;

    if (!result || result.error) {
      return new Response(
        JSON.stringify({ error: result?.error?.message || "Failed to remove member" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 记录审计日志
    const auditContext = extractAuditContext(req);
    await writeAuditLog({
      event: "organization.member.remove" as never,
      actorId: sessionInfo.user.id,
      actorEmail: sessionInfo.user.email || undefined,
      targetUserId: userId,
      metadata: { organizationId },
      ...auditContext,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[organization-members] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const dynamic = "force-dynamic";
