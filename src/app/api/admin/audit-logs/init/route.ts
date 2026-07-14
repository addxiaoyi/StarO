import { initAuditLogTable } from "@/lib/audit-log";
import type { NextRequest } from "next/server";

export async function POST(_req: NextRequest) {
  try {
    await initAuditLogTable();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to init audit log table:", error);
    return Response.json({ ok: false, error: "Failed to initialize table" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
