// 安全响应头配置
const SECURITY_HEADERS: Record<string, string> = {
  "X-XSS-Protection": "1; mode=block",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-hashes'; " +  // 允许 hash 验证的内联脚本
    "style-src 'self' 'unsafe-inline'; " +   // Tailwind 需要
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'self'; " +
    "base-uri 'self'; " +
    "form-action 'self';",
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 添加安全响应头
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // 防止 HTTP 降级攻击 - 确保使用 HTTPS
  const proto = request.headers.get("x-forwarded-proto");
  if (proto === "http" && process.env.NODE_ENV === "production") {
    return NextResponse.redirect(
      new URL(request.url).toString().replace("http://", "https://"),
      301,
    );
  }

  return response;
}

export const config = {
  matcher: [
    // 匹配所有路径，除了静态资源和 Next.js 内部路径
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
