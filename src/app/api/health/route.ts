import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthCheckResult {
  status: "ok" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  checks?: {
    database?: {
      status: "ok" | "degraded" | "unhealthy";
      message?: string;
    };
    memory?: {
      status: "ok" | "degraded" | "unhealthy";
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export async function GET(request: Request): Promise<NextResponse<HealthCheckResult>> {
  // 限制详细信息的访问（可选认证检查）
  const authHeader = request.headers.get("authorization");
  const internalToken = process.env.HEALTH_CHECK_TOKEN;
  const isInternalRequest = internalToken && authHeader === `Bearer ${internalToken}`;

  const memoryUsage = process.memoryUsage();
  const memoryPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  // Memory check - Node.js heap can grow, warn only if extremely high
  // heapUsed/heapTotal shows how much of current heap is used, not total system memory
  const memoryCheck = {
    status: memoryPercentage > 98 ? "unhealthy" as const : memoryPercentage > 95 ? "degraded" as const : "ok" as const,
    used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    percentage: Math.round(memoryPercentage),
  };

  // Overall status
  const overallStatus =
    memoryCheck.status === "unhealthy" ? "unhealthy" : memoryCheck.status === "degraded" ? "degraded" : "ok";

  const health: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "starx-oauth",
    // 只在内部请求时显示版本信息
    version: isInternalRequest ? (process.env.npm_package_version || "1.0.0") : undefined,
    checks: isInternalRequest ? {
      memory: memoryCheck,
    } : undefined,
  };

  const httpStatus = overallStatus === "unhealthy" ? 503 : overallStatus === "degraded" ? 200 : 200;

  return NextResponse.json(health, { status: httpStatus });
}
