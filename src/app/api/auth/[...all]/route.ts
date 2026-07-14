import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

const devCorsPaths = ["/api/auth/oauth2/token", "/api/auth/oauth2/userinfo", "/api/auth/oauth2/register"];

function shouldAddDevelopmentCors(url: URL) {
  return process.env.NODE_ENV === "development" && devCorsPaths.includes(url.pathname);
}

function isTrustedDevelopmentOrigin(origin: string | null) {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function addCorsHeaders(url: URL, headers: Headers, origin: string | null) {
  if (shouldAddDevelopmentCors(url)) {
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Origin", isTrustedDevelopmentOrigin(origin) ? origin! : "http://localhost:3000");
    headers.set("Access-Control-Allow-Headers", "authorization, content-type");
    headers.set("Cache-Control", "no-store");
    headers.set("Vary", "Origin");
  }
}

function handlerFor(method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE") {
  return async (request: Request) => {
    const handler = toNextJsHandler(getAuth())[method];
    const response = await handler(request);
    const url = new URL(request.url);

    if (!shouldAddDevelopmentCors(url)) {
      return response;
    }

    const headers = new Headers(response.headers);
    addCorsHeaders(url, headers, request.headers.get("origin"));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

export const GET = handlerFor("GET");
export const POST = handlerFor("POST");
export const PATCH = handlerFor("PATCH");
export const PUT = handlerFor("PUT");
export const DELETE = handlerFor("DELETE");

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const headers = new Headers();
  const url = new URL(request.url);

  if (!shouldAddDevelopmentCors(url)) {
    return new NextResponse(null, { status: 204 });
  }

  addCorsHeaders(url, headers, request.headers.get("origin"));
  return new NextResponse(null, { headers });
}
