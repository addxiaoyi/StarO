# StarX-Oauth Release Review Draft

This draft is a reviewer-facing map for the current local changes. It groups the work into coherent commit slices, gives a PR description, and lists the verification evidence that should travel with the release.

## Suggested Commit Order

1. Rebuild product shell and ordinary-user auth pages
   - Files: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/sign-in`, `src/app/sign-up`, `src/app/forgot-password`, `src/app/reset-password`, `src/app/two-factor`, `src/app/verify-email`, `src/components/auth`, `src/components/motion`, `src/components/ui`.
   - Scope: StarX-Oauth branding, ordinary-user copy, reduced-motion-safe GSAP motion, current email-confirmation wording, and shared UI primitives.

2. Add Better Auth runtime, email, and protected account flows
   - Files: `src/app/api/auth`, `src/lib/auth.ts`, `src/lib/auth-options.ts`, `src/lib/auth-client.ts`, `src/lib/email.ts`, `src/lib/friendly-auth-copy.ts`, `src/lib/app-config.ts`, `src/types/pg.d.ts`.
   - Scope: shared auth option factory, memory/PostgreSQL runtime selection, local memory admin seed, auth email templates, client method typing, and friendly error copy.

3. Add account center, member management, application access, and OAuth helper pages
   - Files: `src/app/dashboard`, `src/components/dashboard`, `src/app/admin`, `src/components/admin`, `src/app/applications`, `src/components/applications`, `src/app/oauth`, `src/components/oauth`, `src/app/not-found.tsx`.
   - Scope: connection-code lifecycle, signed-in account actions, member operations, application client registration/secret rotation/removal, OAuth consent/account/team helper pages, and branded not-found handling.

4. Add production maintenance and governance scripts
   - Files: `scripts/better-auth-migration.ts`, `scripts/seed-first-admin.ts`, `scripts/connection-code-monitor.ts`, `.env.example`, `docs/production-runbook.md`, `README.md`.
   - Scope: Better Auth migration generation/apply flow, first-admin seed, connection-code monitor, production env documentation, PostgreSQL backup/restore/rollback runbook, and release checks.

5. Add OAuth/OpenID metadata and warning cleanup
   - Files: `src/app/.well-known`, `src/lib/auth-options.ts`, `src/lib/auth.ts`, `README.md`, `docs/implementation-notes.md`.
   - Scope: root OAuth authorization-server metadata route, root OpenID discovery route, dynamic social-provider enablement, confirmed `oauthAuthServerConfig` silence, and documented Better Auth issuer contract.

6. Add automated regression coverage and artifact hygiene
   - Files: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `.gitignore`, `docs/verification-artifacts.md`, `docs/implementation-notes.md`.
   - Scope: public copy/layout/icon checks, reduced-motion stability, signed-in connection-code and application flows, OAuth/OpenID metadata checks, ignored Playwright artifacts, and verification evidence notes.

7. Resolve dependency audit and starter asset cleanup
   - Files: `package.json`, `package-lock.json`, `public/*.svg`.
   - Scope: `postcss` override to `8.5.15`, updated scripts/dependencies, and removal of unused starter SVG assets.

## PR Title

Complete StarX-Oauth account center, production governance, and OAuth metadata verification

## PR Summary

This change turns the starter app into a complete StarX-Oauth account center built on Next.js App Router and Better Auth. It adds the public auth pages, signed-in account center, member management, application access management, OAuth consent helper pages, production database scripts, connection-code monitoring, OAuth/OpenID discovery metadata, and browser regression coverage.

The UI copy now uses the current ordinary-user wording, including `确认邮箱`/`确认邮件` language, and the old technical or star/spark themed markers are covered by source and browser checks. Local development can run without `DATABASE_URL` through a memory adapter and optional local admin seed, while production has documented PostgreSQL migration, backup, rollback, first-admin seed, and monitoring steps.

## Reviewer Focus

- Confirm the product wording reads correctly for ordinary users across public auth pages, account center, member management, application access, and OAuth helper pages.
- Review `src/lib/auth-options.ts` carefully because it is shared by runtime auth setup and maintenance scripts.
- Check the PostgreSQL runbook before the first production migration. The local validation proves scripts typecheck and build, but it does not apply migrations to a real production database.
- Confirm third-party social login with real provider credentials before enabling those providers in production.
- Confirm the OAuth/OpenID metadata issuer contract in production: with Better Auth's default base path, `issuer` is `${BETTER_AUTH_URL}/api/auth`.
- Review connection-code monitor thresholds before connecting alerts to production notifications.

## Verification Checklist

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- `npm audit --audit-level=moderate`
- `npm ls postcss`
- Source scan for old email-confirmation wording, old technical labels, and star/spark markers.
- Source scan for common unfinished-work markers and stale expansion headings.
- Port check for local temporary servers after verification.
- Cleanup check for `test-results` and root-level temporary screenshots/logs.

## Current Automated Evidence

- Playwright public smoke covers `/`, `/sign-up`, `/verify-email`, and `/verify-email?token=test-token`.
- Playwright reduced-motion smoke verifies mobile background bands stay still.
- Playwright signed-in smoke covers connection-code creation, pause, re-enable, revoke, application creation, secret rotation, and removal.
- Playwright metadata smoke covers:
  - `/.well-known/oauth-authorization-server/api/auth`
  - `/.well-known/openid-configuration`
  - `/api/auth/.well-known/openid-configuration`
- Dependency audit reports 0 vulnerabilities after the `postcss` override.

## Manual Production Follow-Ups

- Run `npm run db:migration` and review generated SQL against the target production `DATABASE_URL`.
- Take a PostgreSQL backup, then run `npm run db:migration:apply`.
- Run `npm run db:seed-admin` with production first-admin variables, then remove `STARX_FIRST_ADMIN_PASSWORD`.
- Run `npm run monitor:connection-codes -- --warn-only` against production or staging data and wire alerts only after the output is understood.
- Validate real email delivery through Resend.
- Validate social sign-in after real Google, GitHub, Discord, or Microsoft app credentials are configured.
- Validate production metadata responses with the deployed `BETTER_AUTH_URL`.
