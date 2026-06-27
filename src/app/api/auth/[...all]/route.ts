import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

function addCorsHeaders(url: URL, headers: Headers) {
  if (
    process.env.NODE_ENV === "development" &&
    ["/api/auth/oauth2/token", "/api/auth/oauth2/userinfo", "/api/auth/oauth2/register"].includes(url.pathname)
  ) {
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Headers", "authorization, content-type");
    headers.set("Cache-Control", "public, max-age=15, stale-while-revalidate=15");
  }
}

function handlerFor(method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE") {
  return async (request: Request) => {
    const handler = toNextJsHandler(getAuth())[method];
    const response = await handler(request);
    addCorsHeaders(new URL(request.url), response.headers);
    return response;
  };
}

export const GET = handlerFor("GET");
export const POST = handlerFor("POST");
export const PATCH = handlerFor("PATCH");
export const PUT = handlerFor("PUT");
export const DELETE = handlerFor("DELETE");

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  const headers = new Headers();
  addCorsHeaders(new URL(request.url), headers);
  return new NextResponse(null, { headers });
}
