# StarX-Oauth Production Runbook

This runbook keeps production database and connection-code operations repeatable before a specific hosting platform is chosen. Replace paths, database URLs, and secret management commands with the deployment provider's equivalents.

## Required Secrets

- `BETTER_AUTH_SECRET`: long random value, shared by all app instances.
- `BETTER_AUTH_URL`: public origin of the deployed app.
- `DATABASE_URL`: PostgreSQL connection string with migration privileges for maintenance jobs.
- `RESEND_API_KEY` and `EMAIL_FROM`: required for real auth email delivery.
- `STARX_ADMIN_USER_IDS`: comma-separated Better Auth user IDs that should have admin access.
- `STARX_FIRST_ADMIN_EMAIL` plus either `STARX_FIRST_ADMIN_PASSWORD` or `STARX_FIRST_ADMIN_PASSWORD_HASH`: set only while seeding the first production admin.

Do not set `STARX_DEV_ADMIN_*` in production. Remove `STARX_FIRST_ADMIN_PASSWORD` after the first-admin seed succeeds.

## Backup

Create a backup immediately before every migration, seed, or manual data repair.

```powershell
$env:PGSSLMODE = "require"
New-Item -ItemType Directory -Force backups | Out-Null
pg_dump `
  --format=custom `
  --no-owner `
  --no-acl `
  --file "backups/starx-oauth-$(Get-Date -Format yyyyMMdd-HHmmss).dump" `
  $env:DATABASE_URL
```

Keep at least one backup outside the deployment host. Store backups in private storage with access logging, because auth tables contain emails, sessions, and connection-code metadata.

## Restore Drill

Practice restores on a staging database before relying on the runbook in production.

```powershell
$env:PGSSLMODE = "require"
pg_restore `
  --clean `
  --if-exists `
  --no-owner `
  --no-acl `
  --dbname $env:STAGING_DATABASE_URL `
  backups/starx-oauth-example.dump
```

After restore, run the app against staging and verify sign-in, `/dashboard`, `/admin`, `/applications`, and `/oauth/consent`.

## Migration

1. Confirm `DATABASE_URL` points at the intended production database.
2. Create a fresh backup.
3. Generate migration SQL for review.

```powershell
npm run db:migration
```

4. Review the generated file under `migrations/`. Check for destructive statements, unexpected table drops, and column type changes.
5. Apply only after review.

```powershell
npm run db:migration:apply
```

6. Run smoke checks:

```powershell
npm run typecheck
npm run build
npm run monitor:connection-codes -- --warn-only
```

## Migration Rollback

Better Auth schema migrations are generated from the current auth configuration and should be treated as forward-only unless a reviewed rollback SQL file has been prepared.

Use this order during a failed migration:

1. Stop new deployments or roll the app back to the last known compatible version.
2. Preserve logs and the failed generated SQL.
3. If data shape is uncertain, restore the pre-migration backup into a fresh database first and point staging at it.
4. For production recovery, either:
   - restore the pre-migration backup to the production database during the incident window, or
   - apply a reviewed rollback SQL file if the failure is isolated and reversible.
5. Re-run `/sign-in`, `/dashboard`, `/applications`, and `/oauth/consent` smoke checks before reopening traffic.

Never run `npm run db:migration:apply` repeatedly against production while investigating an unknown failure. Generate and review a new SQL file after every auth configuration change.

## First Admin Seed

Set these only for the seed job:

```powershell
$env:STARX_FIRST_ADMIN_EMAIL = "admin@example.com"
$env:STARX_FIRST_ADMIN_NAME = "Initial Admin"
$env:STARX_FIRST_ADMIN_PASSWORD = "replace-with-a-strong-temporary-password"
npm run db:seed-admin
```

After the seed succeeds:

- sign in as the first admin and rotate the password through the product flow.
- remove `STARX_FIRST_ADMIN_PASSWORD` from the deployment environment.
- keep `STARX_ADMIN_USER_IDS` aligned with the production admin user IDs.

## Connection-Code Monitoring

The Better Auth connection-code table stores `lastRequest`, `requestCount`, expiration, enabled state, and per-key rate-limit fields. The monitor reads those fields without changing data.

```powershell
npm run monitor:connection-codes
```

The command prints JSON and exits with code `1` when it finds alertable conditions. Use `-- --warn-only` when a CI or cron job should collect the JSON without failing the job.

```powershell
npm run monitor:connection-codes -- --warn-only
```

Tunable thresholds:

- `STARX_CONNECTION_CODE_EXPIRY_WARN_DAYS`, default `14`: warn before a code expires.
- `STARX_CONNECTION_CODE_STALE_DAYS`, default `90`: warn when an enabled code has not been used recently, or has never been used after that many days.
- `STARX_CONNECTION_CODE_HIGH_USAGE_RATIO`, default `0.8`: warn when request count reaches this share of the configured rate-limit maximum.

Recommended alert routing:

- `critical`: page the owner when an enabled code is already expired.
- `warn`: send to the service channel for soon-expiring, stale, never-used, or high-window-usage codes.

## Routine Verification

Before every release:

```powershell
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm audit --audit-level=moderate
```

After every release, verify the production app can send email, sign in, list connection codes, create an application integration, and show the OAuth consent page for a registered app.

For OAuth/OpenID metadata, verify:

- `/.well-known/oauth-authorization-server/api/auth` returns JSON.
- `/.well-known/openid-configuration` returns JSON.
- `issuer` is `${BETTER_AUTH_URL}/api/auth` with the default Better Auth base path.
- `authorization_endpoint` and `jwks_uri` point at `${BETTER_AUTH_URL}/api/auth/...`.

Post-deploy automated smoke:

```powershell
$env:STARX_SMOKE_BASE_URL = "https://auth.star-web.top"
npm run smoke:deployment
```
