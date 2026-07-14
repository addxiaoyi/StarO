/**
 * 组织管理 API
 *
 * 提供组织创建、成员管理等功能
 */

import { getAuth } from "@/lib/auth";
import { writeAuditLog, extractAuditContext } from "@/lib/audit-log";
import type { NextRequest } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
});

const updateSchema = z.object({
  organizationId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
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
  listOrganizations?: (input: { headers: Headers }) => Promise<unknown>;
  createOrganization?: (input: { body: unknown; headers: Headers }) => Promise<unknown>;
  updateOrganization?: (input: { body: unknown; headers: Headers }) => Promise<unknown>;
  deleteOrganization?: (input: { body: { organizationId: string }; headers: Headers }) => Promise<unknown>;
};

/**
 * GET /api/organizations - 获取用户的组织列表
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

    // 使用 Better Auth 的 organization API
    const orgApi = auth.api as OrganizationAPI;
    const orgList = await orgApi.listOrganizations?.({
      headers: req.headers,
    });

    if (!orgList) {
      return new Response(JSON.stringify({ organizations: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(orgList), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[organizations] GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/organizations - 创建组织
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
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = sessionInfo.user.id;
    const orgApi = auth.api as OrganizationAPI;

    // 使用 Better Auth 的 organization API 创建组织
    const result = await orgApi.createOrganization?.({
      body: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
      },
      headers: req.headers,
    }) as { organization?: { id: string }; error?: { message: string } } | undefined;

    if (!result || result.error) {
      return new Response(
        JSON.stringify({ error: result?.error?.message || "Failed to create organization" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 记录审计日志
    const auditContext = extractAuditContext(req);
    await writeAuditLog({
      event: "organization.create" as never,
      actorId: userId,
      actorEmail: sessionInfo.user.email || undefined,
      targetUserId: userId,
      metadata: { organizationName: parsed.data.name, organizationId: result.organization?.id },
      ...auditContext,
    });

    return new Response(
      JSON.stringify({ organization: result.organization }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[organizations] POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * PATCH /api/organizations - 更新组织
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
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const orgApi = auth.api as OrganizationAPI;
    const result = await orgApi.updateOrganization?.({
      body: {
        organizationId: parsed.data.organizationId,
        name: parsed.data.name,
        description: parsed.data.description,
      },
      headers: req.headers,
    }) as { organization?: unknown; error?: { message: string } } | undefined;

    if (!result || result.error) {
      return new Response(
        JSON.stringify({ error: result?.error?.message || "Failed to update organization" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ organization: result.organization }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[organizations] PATCH error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * DELETE /api/organizations - 删除组织
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

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: "organizationId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const orgApi = auth.api as OrganizationAPI;
    const result = await orgApi.deleteOrganization?.({
      body: { organizationId },
      headers: req.headers,
    }) as { error?: { message: string } } | undefined;

    if (!result || result.error) {
      return new Response(
        JSON.stringify({ error: result?.error?.message || "Failed to delete organization" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 记录审计日志
    const auditContext = extractAuditContext(req);
    await writeAuditLog({
      event: "organization.delete" as never,
      actorId: sessionInfo.user.id,
      actorEmail: sessionInfo.user.email || undefined,
      metadata: { organizationId },
      ...auditContext,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[organizations] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const dynamic = "force-dynamic";
