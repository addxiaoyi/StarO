# Release Notes Draft - 2026-07-07

## Suggested Commit

```text
fix(auth): harden production config and deployment checks
```

## Security And Production Config

- Removed the production build setting that ignored TypeScript errors.
- Added baseline security headers and disabled the Next.js `X-Powered-By` header.
- Added fail-closed production runtime validation for required env values, placeholder secrets, memory DB use, and dev admin variables.
- Disabled anonymous dynamic OAuth client registration by default in production.
- Restricted dev-only auth CORS behavior to localhost origins and set auth responses to `no-store`.

## Auth And OIDC Availability

- Kept Better Auth/OIDC metadata routes covered by E2E tests.
- Updated auth runtime setup so explicit local memory DB mode is available for E2E without weakening production checks.
- Added `npm run smoke:deployment` to verify `/api/health`, OIDC/OAuth metadata, the Better Auth session route, and security headers after deployment.

## Build, Test, And Dependency Reliability

- Removed Google Fonts network dependency from the production build by switching to system fonts.
- Updated Playwright server setup to avoid stale server reuse and seed deterministic local auth state.
- Updated stale public smoke expectations and homepage layout checks.
- Ran `npm audit fix`, updating the affected `esbuild` lockfile path and clearing the low dev advisory.

## Deployment And Docs

- Standardized PM2/ecosystem port configuration on `3002`.
- Documented production env requirements, placeholder-value risks, and post-deploy smoke verification.
- Updated the availability/security/deployment audit with fixed findings and the remaining live deployment blocker.
