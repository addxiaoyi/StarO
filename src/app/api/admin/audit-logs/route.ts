import { queryAuditLogs, initAuditLogTable } from "@/lib/audit-log";
import type { NextRequest } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  event: z.string().optional(),
  actorId: z.string().optional(),
  targetUserId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function POST(req: NextRequest) {
  try {
    await initAuditLogTable();
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: "Failed to initialize table" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      event: searchParams.get("event"),
      actorId: searchParams.get("actorId"),
      targetUserId: searchParams.get("targetUserId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid parameters",
          details: parsed.error.flatten(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const result = await queryAuditLogs({
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Audit log API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export const dynamic = "force-dynamic";
