# StarX-Oauth Availability, Security, and Deployment Audit

Date: 2026-07-07
Scope: `starx-oauth` Next.js / Better Auth application inside `D:\qwq\项目\auth-star`.

## Executive Summary

The local project is now in a releasable state for the issues found in this audit. Type checking, linting, production build, full E2E smoke coverage, and npm audit all pass locally.

The remaining blocker is deployment state: `https://auth.star-web.top` still appears to be serving an older build. The live homepage and health endpoint respond, but live auth/OIDC endpoints still return `404`, and live response headers still show `X-Powered-By: Next.js`. Redeploy the current build and re-run the deployment probes before treating production as fixed.

## Current Verification

Commands run from `D:\qwq\项目\auth-star\starx-oauth` unless noted.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass; route table includes `/.well-known/openid-configuration`, `/.well-known/oauth-authorization-server/api/auth`, and `/api/auth/[...all]` |
| `npm run test:e2e` | Pass, 12/12 |
| `npm audit --registry=https://registry.npmjs.org --json` | Pass, 0 vulnerabilities |
| `codegraph sync .` from workspace root | Synced changed files |

## Live Deployment Probe

Target: `https://auth.star-web.top`

| Endpoint | Observed result after local fixes |
| --- | --- |
| `GET /` | `200 OK`, still includes `X-Powered-By: Next.js` |
| `GET /api/health` | `200 OK`, JSON |
| `GET /.well-known/openid-configuration` | `404 Not Found` |
| `GET /api/auth/get-session` | `404 Not Found` |
| `GET /api/auth/oauth2/authorize` | `404 Not Found` |

Conclusion: local source/build is fixed, but production needs redeploy or process cleanup so nginx points at the current app build.

## Findings And Status

### F-001: Live auth/OIDC endpoints are not available

- Severity: Critical for production readiness.
- Status: Local code/build verified; still failing on live deployment until redeploy.
- Evidence:
  - Local `npm run build` route table includes the OIDC discovery and auth catch-all routes.
  - Live probes still return `404` for OIDC discovery and auth API endpoints.
- Action: Redeploy the current app and verify `/.well-known/openid-configuration`, `/.well-known/oauth-authorization-server/api/auth`, `/api/auth/get-session`, and an OAuth authorize request.

### F-002: E2E environment was inconsistent

- Severity: High.
- Status: Fixed.
- Fixes:
  - Added explicit local E2E memory mode via `STARX_USE_MEMORY_DB=true` guarded by localhost/127.0.0.1.
  - Playwright now sets `BETTER_AUTH_SECRET`, clears `DATABASE_URL`, disables stale server reuse, and uses the seeded local admin.
  - Updated stale homepage expectations to match the current page.
- Verification: `npm run test:e2e` passes 12/12, including signed-in connection-code and application integration flows.

### F-003: Default lint command failed on generated deployment output

- Severity: Medium.
- Status: Fixed.
- Fix: Added generated deployment artifacts and local tool output to ESLint global ignores.
- Verification: `npm run lint` passes with no warnings.

### F-004: Production build skipped TypeScript validation

- Severity: Medium.
- Status: Fixed.
- Fix: Removed `typescript.ignoreBuildErrors: true` from `next.config.ts`.
- Verification: `npm run build` now runs and passes Next's TypeScript step.

### F-005: Deployment port configuration was inconsistent

- Severity: Medium.
- Status: Fixed in PM2 config.
- Fix: Updated `ecosystem.config.js` from port `3000` to `3002`, matching the deployment docs and nginx examples.
- Verification: Config review; live still needs redeploy.

### F-006: Production environment validation accepted placeholders and weak values

- Severity: Medium.
- Status: Fixed.
- Fixes:
  - Rejects placeholder-like required env values.
  - Validates `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` length, and PostgreSQL URL protocol.
  - Requires Resend or SMTP email transport at production runtime.
  - Rejects production `STARX_DEV_ADMIN_*` variables and non-local memory DB mode.
  - Allows `next build` to complete without real runtime secrets, while keeping `next start` production runtime fail-closed.
- Verification: `npm run build` passes locally; production runtime validation remains active outside `phase-production-build`.

### F-007: Auth email delivery was optional in production

- Severity: High for user-facing auth flows.
- Status: Fixed at runtime validation level.
- Fix: Production runtime now requires either `RESEND_API_KEY` or `SMTP_HOST`; docs and `.env.example` include SMTP variables.
- Verification: Static checks pass. Real delivery still requires configuring and testing production email credentials.

### F-008: Dynamic OAuth client registration was enabled

- Severity: Medium.
- Status: Fixed by default.
- Fix: Anonymous dynamic client registration is enabled by default only outside production; production requires `STARX_ALLOW_DYNAMIC_CLIENT_REGISTRATION=true`.
- Product note: Signed-in application registration via `/oauth2/create-client` remains covered by E2E.

### F-009: Security headers were incomplete

- Severity: Low to Medium.
- Status: Fixed locally; still absent on live until redeploy.
- Fixes:
  - Added global headers in `next.config.ts`: CSP `base-uri`, `object-src`, `frame-ancestors`, `form-action`; `X-Frame-Options: DENY`; `X-Content-Type-Options`; `Referrer-Policy`; `Permissions-Policy`.
  - Disabled `poweredByHeader`.
- Verification: Local build passes; live headers still indicate old deployment.

### F-010: Dev-only auth CORS/cache block was risky

- Severity: Low in production, Medium if dev is exposed.
- Status: Fixed.
- Fix: Development CORS is restricted to localhost/127.0.0.1 origins and auth-related responses use `Cache-Control: no-store`; non-dev requests are not wrapped.
- Verification: Typecheck, lint, build, and E2E all pass.

### F-011: Build depended on Google Fonts network access

- Severity: Medium for CI/deploy reliability.
- Status: Fixed.
- Evidence: Playwright webServer build failed when `next/font/google` could not fetch Geist fonts.
- Fix: Removed `next/font/google` and switched to system font stacks.
- Verification: `npm run build` and `npm run test:e2e` pass without Google Fonts fetches.

### F-012: Dev-only dependency vulnerability in `esbuild`

- Severity: Low.
- Status: Fixed.
- Fix: Ran `npm audit fix`, updating the affected lockfile dependency path.
- Verification: Full `npm audit --registry=https://registry.npmjs.org --json` reports 0 vulnerabilities.

## Deployment Checklist

1. Deploy the current working tree to the production server.
2. Ensure PM2/systemd starts Next on `127.0.0.1:3002` and nginx proxies to the same port.
3. Configure production env with real values: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL`, and Resend or SMTP email transport.
4. Do not set `STARX_DEV_ADMIN_*` or `STARX_USE_MEMORY_DB` in production.
5. Run migrations and seed the first admin if needed.
6. Verify live endpoints:
   - `https://auth.star-web.top/api/health`
   - `https://auth.star-web.top/.well-known/openid-configuration`
   - `https://auth.star-web.top/.well-known/oauth-authorization-server/api/auth`
   - `https://auth.star-web.top/api/auth/get-session`
7. Confirm live headers no longer expose `X-Powered-By` and include CSP/frame/permissions headers.
