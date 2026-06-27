import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "starx-oauth",
    version: process.env.npm_package_version || "1.0.0",
  };

  return NextResponse.json(health, { status: 200 });
}
