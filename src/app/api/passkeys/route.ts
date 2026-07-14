/**
 * Passkey 管理 API
 *
 * 提供 Passkey 的注册、列表、删除等功能
 */

import { getAuth } from "@/lib/auth";
import { writeAuditLog, extractAuditContext } from "@/lib/audit-log";
import type { NextRequest } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1).max(100).default("我的 Passkey"),
});

const deleteSchema = z.object({
  passkeyId: z.string(),
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

// Passkey API 类型
type PasskeyAPI = {
  listPasskeys?: (input: { headers: Headers }) => Promise<unknown>;
  registerPasskey?: (input: { body: unknown; headers: Headers }) => Promise<unknown>;
  deletePasskey?: (input: { body: { passkeyId: string }; headers: Headers }) => Promise<unknown>;
};

/**
 * GET /api/passkeys - 获取用户的 Passkey 列表
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

    // 获取用户的 Passkey 列表
    const passkeyApi = auth.api as PasskeyAPI;
    const passkeys = await passkeyApi.listPasskeys?.({
      headers: req.headers,
    }) as { passkeys?: unknown[] } | undefined;

    return new Response(
      JSON.stringify({
        passkeys: passkeys?.passkeys || [],
        count: passkeys?.passkeys?.length || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[passkeys] GET error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/passkeys - 注册新的 Passkey
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

    const body = await req.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = sessionInfo.user.id;
    const email = sessionInfo.user.email;

    // 使用 Better Auth 的 passkey API 注册
    const passkeyApi = auth.api as PasskeyAPI;
    const result = await passkeyApi.registerPasskey?.({
      body: {
        name: parsed.data.name,
        userName: email || userId,
        userEmail: email,
      },
      headers: req.headers,
    }) as { credentialId?: string; error?: { message: string } } | undefined;

    if (!result || result.error) {
      return new Response(
        JSON.stringify({ error: result?.error?.message || "Failed to register passkey" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 记录审计日志
    const auditContext = extractAuditContext(req);
    await writeAuditLog({
      event: "passkey.registered",
      actorId: userId,
      actorEmail: email || undefined,
      metadata: { passkeyName: parsed.data.name },
      ...auditContext,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Passkey 注册成功",
        credentialId: result.credentialId,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[passkeys] POST error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * DELETE /api/passkeys - 删除 Passkey
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

    const body = await req.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid parameters", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = sessionInfo.user.id;
    const email = sessionInfo.user.email;

    // 使用 Better Auth 的 passkey API 删除
    const passkeyApi = auth.api as PasskeyAPI;
    const result = await passkeyApi.deletePasskey?.({
      body: { passkeyId: parsed.data.passkeyId },
      headers: req.headers,
    }) as { error?: { message: string } } | undefined;

    if (!result || result.error) {
      return new Response(
        JSON.stringify({ error: result?.error?.message || "Failed to delete passkey" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 记录审计日志
    const auditContext = extractAuditContext(req);
    await writeAuditLog({
      event: "passkey.deleted",
      actorId: userId,
      actorEmail: email || undefined,
      metadata: { passkeyId: parsed.data.passkeyId },
      ...auditContext,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Passkey 已删除" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[passkeys] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const dynamic = "force-dynamic";
