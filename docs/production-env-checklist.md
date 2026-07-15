# Production Environment Checklist

Date: 2026-07-07
Service: `starx-oauth`
Production origin: `https://auth.star-web.top`

## Required At Runtime

| Variable | Required value | Placeholder risk |
| --- | --- | --- |
| `NODE_ENV` | `production` | Any `development` value exposes dev behavior and should block release. |
| `BETTER_AUTH_SECRET` | Long random secret, at least 32 characters; generate with `openssl rand -hex 32`. | Values like `change-me`, Chinese placeholder text, or short demo strings are rejected by the app. |
| `BETTER_AUTH_URL` | `https://auth.star-web.top` | Localhost, example domains, or malformed URLs break issuer/callback metadata. |
| `DATABASE_URL` | PostgreSQL URL with the production database host, database, user, and password. | `postgresql://用户名...`, `example`, empty strings, or memory DB values are rejected in production runtime. |
| `EMAIL_FROM` | Verified sender, for example `X-Oauth <noreply@star-web.top>`. | Blank or unverified senders can make sign-in/reset email delivery fail even when SMTP/API credentials exist. |
| `RESEND_API_KEY` or `SMTP_HOST` | At least one real email transport must be configured. | Empty `RESEND_API_KEY=` or placeholder SMTP host leaves auth email flows unusable. |

## Email Transport Options

Use Resend:

| Variable | Required value | Placeholder risk |
| --- | --- | --- |
| `RESEND_API_KEY` | Real production Resend API key. | Empty string is treated as not configured. |

Use SMTP:

| Variable | Required value | Placeholder risk |
| --- | --- | --- |
| `SMTP_HOST` | Real SMTP hostname. | Placeholder host leaves runtime configured but mail undeliverable. |
| `SMTP_PORT` | SMTP port, usually `465`, `587`, or provider-specific value. | Wrong port causes delivery timeouts. |
| `SMTP_USER` | SMTP account/user if provider requires auth. | Demo values can trigger auth failures or lockouts. |
| `SMTP_PASS` | SMTP password/token if provider requires auth. | Never commit this value or echo it in logs. |

## Production Optional

| Variable | Use when | Notes |
| --- | --- | --- |
| `STARX_ADMIN_USER_IDS` | Grant admin access to known Better Auth user IDs. | Keep this as user IDs, not emails or names. |
| `STARX_FIRST_ADMIN_EMAIL` | One-time first admin seed job. | Set only while running `npm run db:seed-admin`. |
| `STARX_FIRST_ADMIN_NAME` | One-time first admin seed job. | Remove after seeding if the deployment system keeps env values globally. |
| `STARX_FIRST_ADMIN_PASSWORD` | One-time first admin seed job. | Remove immediately after seed succeeds. |
| `STARX_FIRST_ADMIN_PASSWORD_HASH` | Seed with a pre-hashed password instead of plain password. | Prefer secret-manager injection, not checked-in files. |
| `STARX_ALLOW_DYNAMIC_CLIENT_REGISTRATION` | Enable anonymous dynamic OAuth client registration. | Default is disabled in production; set to `true` only after product/security review. |
| OAuth provider client IDs/secrets | Enable Google, GitHub, Discord, or Microsoft sign-in. | Client secrets must stay server-only and must not use `NEXT_PUBLIC_` names. |

## Must Not Be Set In Production

| Variable | Why |
| --- | --- |
| `STARX_DEV_ADMIN_EMAIL` | Dev-only seed identity; production runtime rejects it. |
| `STARX_DEV_ADMIN_NAME` | Dev-only seed identity; production runtime rejects it. |
| `STARX_DEV_ADMIN_PASSWORD` | Dev-only password; production runtime rejects it. |
| `STARX_USE_MEMORY_DB` | Local E2E/dev helper only; production runtime rejects memory DB mode. |

## Post-Deploy Smoke

Run after every deployment:

```bash
STARX_SMOKE_BASE_URL=https://auth.star-web.top npm run smoke:deployment
```

Expected checks:

- `/api/health` returns HTTP 200 JSON with `status: "ok"`.
- `/.well-known/openid-configuration` returns issuer `${BETTER_AUTH_URL}/api/auth`.
- `/.well-known/oauth-authorization-server/api/auth` returns matching OAuth metadata.
- `/api/auth/.well-known/openid-configuration` remains available for Better Auth clients.
- `/api/auth/get-session` is handled by Better Auth instead of returning 404 HTML.
- `/` includes the app security headers and does not expose `X-Powered-By`.
