const DEFAULT_BASE_URL = "https://auth.star-web.top";
const REQUEST_TIMEOUT_MS = Number(process.env.STARX_SMOKE_TIMEOUT_MS || "10000");

type MetadataExpectations = {
  issuer: string;
  authorization_endpoint: string;
  jwks_uri: string;
};

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

function normalizeBaseUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fetchWithTimeout(path: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = new URL(path, `${baseUrl}/`);

  try {
    return await fetch(url, {
      headers: {
        "User-Agent": "starx-oauth-deployment-smoke/1.0",
      },
      redirect: "manual",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`expected JSON content-type, got "${contentType || "missing"}"`);
  }

  const body: unknown = await response.json();
  if (!isRecord(body)) {
    throw new Error("expected JSON object response");
  }

  return body;
}

function requireEqual(metadata: Record<string, unknown>, expectations: MetadataExpectations) {
  for (const [key, expectedValue] of Object.entries(expectations)) {
    if (metadata[key] !== expectedValue) {
      throw new Error(`${key} expected "${expectedValue}", got "${String(metadata[key])}"`);
    }
  }
}

async function runCheck(name: string, check: () => Promise<string>): Promise<CheckResult> {
  try {
    const detail = await check();
    return { name, ok: true, detail };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { name, ok: false, detail };
  }
}

async function checkHealth() {
  const response = await fetchWithTimeout("/api/health");
  if (response.status !== 200) {
    throw new Error(`expected HTTP 200, got ${response.status}`);
  }

  const body = await readJson(response);
  if (body.status !== "ok") {
    throw new Error(`expected status "ok", got "${String(body.status)}"`);
  }

  return "health endpoint returned status ok";
}

async function checkMetadata(path: string, expectations: MetadataExpectations) {
  const response = await fetchWithTimeout(path);
  if (response.status !== 200) {
    throw new Error(`expected HTTP 200, got ${response.status}`);
  }

  const metadata = await readJson(response);
  requireEqual(metadata, expectations);
  return `${path} returned expected issuer and endpoints`;
}

async function checkSessionEndpoint() {
  const response = await fetchWithTimeout("/api/auth/get-session");
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 404) {
    throw new Error("expected Better Auth session route, got HTTP 404");
  }

  if (contentType.includes("text/html")) {
    throw new Error(`expected non-HTML auth response, got ${contentType}`);
  }

  return `/api/auth/get-session returned HTTP ${response.status}`;
}

async function checkSecurityHeaders() {
  const response = await fetchWithTimeout("/");
  if (response.status < 200 || response.status >= 400) {
    throw new Error(`expected homepage HTTP 2xx/3xx, got ${response.status}`);
  }

  const headers = response.headers;
  const csp = headers.get("content-security-policy") || "";
  const permissions = headers.get("permissions-policy") || "";
  const failures: string[] = [];

  if (headers.has("x-powered-by")) {
    failures.push(`x-powered-by should be absent, got "${headers.get("x-powered-by")}"`);
  }
  if (!csp.includes("base-uri 'self'")) {
    failures.push("CSP missing base-uri 'self'");
  }
  if (!csp.includes("object-src 'none'")) {
    failures.push("CSP missing object-src 'none'");
  }
  if (!csp.includes("frame-ancestors 'none'")) {
    failures.push("CSP missing frame-ancestors 'none'");
  }
  if (headers.get("x-frame-options") !== "DENY") {
    failures.push(`X-Frame-Options expected DENY, got "${headers.get("x-frame-options") || "missing"}"`);
  }
  if (headers.get("x-content-type-options") !== "nosniff") {
    failures.push(
      `X-Content-Type-Options expected nosniff, got "${headers.get("x-content-type-options") || "missing"}"`,
    );
  }
  if (headers.get("referrer-policy") !== "strict-origin-when-cross-origin") {
    failures.push(`Referrer-Policy expected strict-origin-when-cross-origin, got "${headers.get("referrer-policy") || "missing"}"`);
  }
  for (const directive of ["camera=()", "microphone=()", "geolocation=()", "payment=()", "usb=()"]) {
    if (!permissions.includes(directive)) {
      failures.push(`Permissions-Policy missing ${directive}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("; "));
  }

  return "homepage has expected security headers";
}

const baseUrl = normalizeBaseUrl(process.env.STARX_SMOKE_BASE_URL || process.env.BETTER_AUTH_URL || DEFAULT_BASE_URL);
const expectations = {
  issuer: `${baseUrl}/api/auth`,
  authorization_endpoint: `${baseUrl}/api/auth/oauth2/authorize`,
  jwks_uri: `${baseUrl}/api/auth/jwks`,
};

async function main() {
  const checks = [
    runCheck("health", checkHealth),
    runCheck("openid-discovery", () => checkMetadata("/.well-known/openid-configuration", expectations)),
    runCheck("oauth-authorization-server", () => checkMetadata("/.well-known/oauth-authorization-server/api/auth", expectations)),
    runCheck("better-auth-openid-discovery", () => checkMetadata("/api/auth/.well-known/openid-configuration", expectations)),
    runCheck("session-route", checkSessionEndpoint),
    runCheck("security-headers", checkSecurityHeaders),
  ];

  const results = await Promise.all(checks);
  const failures = results.filter((result) => !result.ok);

  console.log(`Deployment smoke target: ${baseUrl}`);
  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"} ${result.name}: ${result.detail}`);
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

void main();
