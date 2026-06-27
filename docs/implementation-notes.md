# StarX-Oauth Implementation Notes

## Scope

StarX-Oauth is an independent Next.js App Router authentication center. The first version focuses on account creation, sign-in, protected account surfaces, administrator controls, OAuth consent surfaces, and reusable auth APIs for future projects.

## Current State Reading Guide

- Treat this file as a chronological engineering log. Older dated sections preserve what was true during earlier passes; they are useful evidence of decisions and regressions fixed, not a promise that the same visible copy is still current.
- The current product-copy authority is the source under `src/app`, `src/components`, `src/lib`, and the latest README. When historical notes mention older labels such as authorization, organization, connection keys, or admin console wording, verify against current source and browser evidence before using them as present-tense facts.
- The latest current-state evidence starts at:
  - `2026-06-09 Global Coverage Audit`
  - `2026-06-09 Reset Token Flow Current Evidence`
  - `2026-06-09 Branded Not Found Evidence`
  - `2026-06-09 README Ordinary Copy Refresh`
  - `2026-06-09 Current Browser Smoke Audit`
  - `2026-06-09 Final Completion Audit`
- Current screenshot artifact map: `docs/verification-artifacts.md`.
- Current visual direction: no star/sparkle/AI-assistant iconography. Use restrained account-security cues such as shield, lock, device, key, mail, member, and navigation icons.
- Current motion direction: GSAP animation uses `matchMedia`, renderable-target filtering, transform/opacity-only entrance motion, reduced-motion opt-out, `clearProps` cleanup, and mobile-light background bands.

## Reference Strategy

- Primary open-source base: Better Auth, used for the authentication engine, plugin model, session APIs, OAuth provider support, passkeys, 2FA, bearer/JWT, API keys, and admin actions.
- Reference project advantage 1: SaaS starter account experience, adapted into the protected dashboard, compact account center, and clear signed-in navigation.
- Reference project advantage 2: established auth example routing patterns, adapted into protected route redirects and callback URL handling.
- Reference project advantage 3: full-stack auth lifecycle guidance, adapted into email verification, password reset, and post-registration flow design.

## Brand Rules

- Product name, developer name, metadata, email copy, README, and UI chrome use `StarX-Oauth`.
- Template project promotion, deploy buttons, default generated assets, and old maintainer branding are intentionally removed.
- Third-party names are allowed only as dependency names, provider names, imports, or technical integration notes.
- Brand visuals avoid star/sparkle and AI-assistant motifs. Use account-security cues such as shields, locks, devices, and member icons for user-facing surfaces.

## Motion System

- Shared page-load motion is implemented with `gsap` and `@gsap/react`.
- Client animation entry points live in `src/components/motion/motion-stage.tsx` and `src/lib/gsap.ts`.
- Animation targeting uses explicit `data-motion-*` attributes so landing, auth, dashboard, and admin surfaces can share one choreography layer without hard-coding route-specific selectors into every component.
- Entrance motion is sequenced through a single GSAP timeline with labeled positions instead of independent delayed tweens.
- Entrance targets are filtered to elements that are currently renderable in the active viewport, so hidden responsive DOM is not animated.
- Motion defaults prefer transform and opacity only; layout-heavy animation is intentionally avoided.
- `prefers-reduced-motion` is respected through `gsap.matchMedia()`. When reduced motion is requested, entry animation is skipped and content renders immediately.
- Background atmosphere uses elongated light bands rather than decorative orbs so the app keeps a restrained, product-like feel.
- Long-running background band tweens pause when the document is hidden and resume when it becomes visible again.
- Mobile viewports render only the core drift/lift background bands; secondary tilt/pulse bands are desktop-only to reduce blur/gradient paint work.

## Auth Architecture

- Public auth API: `/api/auth/[...all]`.
- Server auth entry: `src/lib/auth.ts`.
- Client auth entry: `src/lib/auth-client.ts`.
- Protected account route: `/dashboard`.
- Protected admin route: `/admin`.
- OAuth support pages: `/oauth/consent`, `/oauth/select-account`, `/oauth/select-organization`.

Better Auth handles password hashing, session cookies, verification/reset links, OAuth provider callbacks, passkeys, 2FA, bearer/JWT/API key plugins, and admin actions. Business code should not hand-roll password hashes, reset tokens, or session cookies.

## Runtime Configuration

Required production variables:

```env
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
DATABASE_URL=
EMAIL_FROM=
RESEND_API_KEY=
```

Optional provider variables:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
STARX_ADMIN_USER_IDS=
```

Local development can run without `DATABASE_URL`; in that mode the memory adapter is used and data is not persistent. Production should use PostgreSQL.

### Local Auth Runtime Notes

- The local memory adapter is prewarmed from Better Auth's table schema before it is passed to `betterAuth`. This keeps local sign-up from failing with missing model errors while preserving the adapter's plain-object transaction behavior.
- Server-rendered protected pages read the current session through the same `/api/auth/get-session` route used by Better Auth, forwarding the request cookie and disabling fetch caching. This avoids App Router header adapter drift and keeps `/dashboard`, `/admin`, and OAuth helper pages aligned with the API session source of truth.
- Local email delivery logs the full message as JSON when `RESEND_API_KEY` is not configured, including verification links and OTP codes. This is development-only observability; production should use Resend through `RESEND_API_KEY`.
- Because the local memory adapter is non-persistent, editing auth code or restarting the dev server can invalidate in-memory users and sessions while old browser cookies still remain. For reliable local verification after auth code changes, create and verify a fresh test user.

## Implemented Routes

- `/sign-in`: email/password login, email-button login, configured social login, and added-device login.
- `/sign-up`: account creation with email and password.
- `/forgot-password`: password recovery email request.
- `/reset-password`: new password setup from the recovery email.
- `/verify-email`: email confirmation and resend.
- `/two-factor`: extra login confirmation.
- `/dashboard`: account center for profile, device login, extra confirmation, connection codes, signed-in devices, and sign-out.
- `/admin`: member management for adding members, handling member device login, and temporarily pausing accounts.
- `/oauth/consent`: application access confirmation.
- `/oauth/select-account`: signed-in account confirmation.
- `/oauth/select-organization`: team-information confirmation.

## Verification Checklist

Run these before handing off changes:

```bash
npm run lint
npm run typecheck
npm run build
```

Brand cleanup scan:

```bash
rg -n "<old template brand or promotional term>" . -g "!*node_modules*" -g "!package-lock.json" -g "!.next/**"
```

Manual flow checks still needed when real credentials are available:

- Email sign-up, email verification, sign-in, sign-out.
- Forgot password and reset password.
- Google and GitHub OAuth at minimum; Discord and Microsoft provider configuration checks.
- Passkey add, passkey sign-in, passkey removal.
- TOTP enable, challenge, disable; email OTP send and verify.
- User dashboard and admin role gating.
- OAuth consent redirect behavior with a registered client.

## 2026-06-08 Local Verification Evidence

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; production route table includes dynamic `/dashboard`, `/admin`, `/oauth/consent`, `/oauth/select-account`, and `/oauth/select-organization`.
- Browser sign-up on `http://localhost:3000/sign-up`: submitted `browser-ui-202606081824@example.com`, received the friendly success message `账号已创建，请先验证邮箱，再回来登录。`, and saw no console warnings or errors.
- Local verification email logging exposed a complete `actionUrl`; opening the verification URL returned a `/dashboard` callback redirect.
- Browser login with a freshly verified user reached `http://localhost:3000/dashboard`; the page showed account-center controls for passkeys, two-step verification, API keys, sessions, and sign-out with no console warnings or errors.
- Browser `/admin` as a non-admin user showed the intended `访问受限` state instead of redirecting back to login, with no console warnings or errors.
- Browser OAuth helper pages were checked while logged in:
  - `/oauth/consent?client_id=demo-app&scope=openid%20profile%20email` showed application authorization copy, requested scopes, and allow/deny buttons.
  - `/oauth/select-account` showed the verified user email and a continue button.
  - `/oauth/select-organization` showed organization-selection guidance and a continue button.
- Captured Playwright CLI screenshots include:
  - `.playwright-cli/page-2026-06-08T10-30-44-079Z.png` for successful sign-up feedback.
  - `.playwright-cli/page-2026-06-08T10-53-05-043Z.png` for the signed-in dashboard.
  - `.playwright-cli/page-2026-06-08T10-56-33-114Z.png` for the non-admin restricted state.
  - `.playwright-cli/page-2026-06-08T10-58-47-018Z.png` for OAuth consent.
  - `.playwright-cli/page-2026-06-08T11-01-15-401Z.png` for OAuth account selection.
  - `.playwright-cli/page-2026-06-08T11-03-24-920Z.png` for OAuth organization selection.

## 2026-06-08 Motion And Visual Polish Evidence

- GSAP page-load motion was kept scoped to `MotionStage` and now enables `will-change` only for entrance targets while the entrance timeline is active. Long-running background bands keep their own layer hint; static content releases the hint after animation completion.
- The global background was adjusted from radial atmosphere to restrained linear light bands so the app reads more like a focused account product surface.
- The global link reset now uses `:where(a)` to avoid overriding component-level text color utilities.
- The landing-page primary link uses the explicit `light-action` class so the white `创建账号` CTA renders with dark text instead of inheriting white link text.
- Browser verification on `http://localhost:3000/` confirmed the primary CTA computed style as `color: rgb(5, 5, 5)` on `backgroundColor: rgb(255, 255, 255)`, with no console warnings or errors.
- Browser checks for `/` desktop, `/sign-in` desktop, and `/sign-in` at `390x844` completed with no console warnings or errors after the visual/motion changes.
- Captured Playwright CLI screenshots include:
  - `.playwright-cli/page-2026-06-08T11-49-52-912Z.png` for the corrected mobile landing CTA contrast.
  - `.playwright-cli/page-2026-06-08T11-22-16-829Z.png` for desktop sign-in after motion/background changes.
  - `.playwright-cli/page-2026-06-08T11-24-14-463Z.png` for mobile sign-in after motion/background changes.

## 2026-06-08 Interaction Contract Evidence

- The dashboard and landing navigation link `应用授权` points to `/oauth/consent`, which can be opened by a signed-in user without an active OAuth request.
- `/oauth/consent` now has two explicit states:
  - Without `client_id` or `code`, it shows `现在没有待授权的应用`, explains when authorization appears, and offers `返回账号中心` instead of showing misleading allow/deny controls.
  - With request parameters such as `client_id=demo-app&scope=openid%20profile%20email`, it still shows the application authorization copy, scope summary, and `允许并继续` / `暂不允许` actions.
- Browser verification used a freshly created and verified local user `oauth-contract-20260608214807@example.com`.
- Browser checks for `/oauth/consent` and `/oauth/consent?client_id=demo-app&scope=openid%20profile%20email` completed with no console warnings or errors.
- Captured Playwright CLI screenshots include:
  - `.playwright-cli/page-2026-06-08T13-53-25-607Z.png` for the no-pending-authorization state.
  - `.playwright-cli/page-2026-06-08T13-54-27-205Z.png` for the active authorization request state.

## 2026-06-09 User Copy And Dashboard Feedback Evidence

- Registration now sends the email-verification link by default. The `emailOTP` plugin no longer sends a sign-up OTP, because `/verify-email` is link-based and ordinary users otherwise receive a code with nowhere to enter it.
- Local email delivery still prints JSON to stdout and now also appends JSONL records to `.local/email-outbox.jsonl` when `RESEND_API_KEY` is absent. `.local/` is ignored by Git and ESLint so local verification artifacts do not pollute source checks.
- Browser-facing sign-up success copy now says `账号已创建，请打开邮件里的验证按钮。`, matching the link email.
- HTTP verification with `http-contract-link-20260609-0001@example.com` confirmed:
  - `POST /api/auth/sign-up/email` returned 200 and wrote a `请验证你的邮箱` outbox record with an `actionUrl`.
  - Opening the verification `actionUrl` returned 302.
  - `POST /api/auth/sign-in/email` returned 200 after verification.
  - `GET /dashboard` returned 200 and contained `登录邮箱：http-contract-link-20260609-0001@example.com`.
  - `POST /api/auth/api-key/create` returned 200 with a `starx_` key when called with same-origin headers.
  - `POST /api/auth/revoke-other-sessions` returned 200 with `{"status":true}`.
- Dashboard copy now shows the user's name and login email instead of exposing the internal user id.
- Browser MCP verification confirmed visible dashboard text includes the login email and `已让其他设备退出登录。`, while no raw 32-character internal id is visible.
- Captured screenshot: `.playwright-mcp-dashboard-user-copy-final.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 OAuth Callback And Provider Copy Evidence

- Sign-in and landing copy now only show social login options when at least one social provider is configured in the environment. In the current local environment, the sign-in page shows email/password, email login link, and device verification; Google/GitHub/Discord/Microsoft buttons are not shown.
- Email/password sign-in no longer sends nested business callback URLs to Better Auth. The auth API request signs the user in without an automatic callback redirect, then the client router sends the user back to the original `callbackURL`. This keeps OAuth consent callbacks with query parameters from failing with `Invalid callbackURL`.
- OAuth consent scopes now render as ordinary-user permission copy instead of raw scope strings:
  - `openid` -> `确认你的登录身份`
  - `profile` -> `读取基础资料`
  - `email` -> `读取邮箱地址`
  - `read:organization` -> `读取组织信息`
- Browser MCP verification used `scope-copy-20260609-0003@example.com` and confirmed the nested sign-in callback reached `/oauth/consent?client_id=demo-app&scope=openid%20profile%20email%20read:organization`.
- Browser MCP verification confirmed the visible authorization page includes `确认你的登录身份` and `读取组织信息`, and no longer shows the raw `openid profile email` string.
- Captured screenshot: `.playwright-mcp-oauth-scope-copy.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Password Reset Evidence

- Better Auth reset-password emails generate `/api/auth/reset-password/<token>?callbackURL=/reset-password` links in this app. The auth endpoint validates the token and redirects users to `/reset-password?token=<token>`, where the existing reset form can submit the new password.
- Added `/reset-password/[token]` as a compatibility redirect to the Better Auth reset-password callback endpoint. This protects the flow if a reset link is opened in the app route shape instead of the auth API route shape.
- HTTP verification with `reset-flow-20260609-0002@example.com` confirmed:
  - Sign-up returned 200 and wrote a verification email.
  - Verification link succeeded.
  - `POST /api/auth/request-password-reset` returned 200 and wrote a `重置你的登录密码` email.
  - Reset email link redirected to `/reset-password?token=ql7GGUNobFsMZ4DuyiaHu8wU`.
  - `POST /api/auth/reset-password` returned 200.
  - Old password login returned 401.
  - New password login returned 200.
- Browser MCP verification opened a fresh reset email link, landed on `/reset-password?token=vN1vGG5NI6H0qkhNArAAoQOj`, submitted a new password through the visible form, and returned to `/sign-in`.
- HTTP verification after the browser reset confirmed the browser-submitted new password logs in with 200.
- Captured screenshot: `.playwright-mcp-reset-password-complete.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table includes dynamic `/reset-password/[token]`.

## 2026-06-09 Public Copy Consistency Evidence

- Global metadata no longer advertises social login as a default capability. The public description now says the account center supports email login, device verification, two-step verification, password recovery, and application authorization.
- `authCapabilities` was reduced to ordinary-user and currently available capability labels. Provider-specific and developer-only labels such as `Google 一键登录`, `社交账号登录`, `应用访问令牌`, and `JWT` were removed from that user-facing capability list.
- README feature copy now separates core local features from optional OAuth provider sign-in. Google/GitHub/Discord/Microsoft sign-in is described as available when provider credentials are configured.
- HTTP verification on `/` confirmed:
  - old metadata text `支持邮箱登录、社交登录` is absent.
  - new metadata text `支持邮箱登录、设备验证、两步验证、密码找回和应用授权` is present.
  - `社交账号登录` is absent from current rendered HTML in the unconfigured local environment.
- Browser MCP snapshot of `/` confirmed visible capability cards are `邮箱登录`, `邮箱登录链接`, `设备验证`, `两步验证`, `应用访问密钥`, and `管理后台`, with no default social-login card in the current local environment.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Reduced Motion And Mobile App Shell Evidence

- Reduced-motion CSS now explicitly disables smooth scrolling and releases persistent `will-change` on `.motion-band`. This matches the GSAP `matchMedia()` reduced-motion branch and avoids keeping compositor hints alive for users who prefer reduced motion.
- The signed-in AppShell navigation now uses a full-width, horizontally scrollable nav row on small screens and `shrink-0` links so navigation labels do not compress or force page-level overflow.
- Browser MCP verification at `390x844` with `prefers-reduced-motion: reduce` confirmed on `/sign-in`:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `.motion-band` computed `will-change` was `auto`.
  - `html` computed `scroll-behavior` was `auto`.
  - page body width matched the viewport with no horizontal overflow.
- Browser MCP verification at `390x844` with a signed-in user `mobile-nav-20260609-0001@example.com` confirmed on `/dashboard`:
  - `POST /api/auth/sign-in/email` returned 200 in the browser context.
  - dashboard loaded at `/dashboard`.
  - page body width did not exceed the viewport.
  - AppShell nav computed `overflow-x: auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - `html` computed `scroll-behavior` was `auto`.
- Captured screenshot: `.playwright-mcp-mobile-dashboard-reduced-motion.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Admin User Management Copy Evidence

- The admin client now loads members through Better Auth's admin `listUsers` client method with `{ query: { limit, offset, searchValue, searchField } }`.
- The management UI no longer asks ordinary admins to type a raw `用户 ID` before revoking sessions or pausing an account. Admins choose a member from `成员列表`, and the action forms submit the selected internal id through hidden inputs.
- Member search supports email and name. Member rows show readable account identity, role labels (`成员` / `管理员`), login status (`可登录` / `已暂停`), and a visible selected state.
- The create-user role field is now a select with `成员` and `管理员` labels instead of asking admins to type `user` or `admin`.
- Admin feedback now uses `role="status"` / `role="alert"` and `aria-live="polite"` like the dashboard action feedback.
- HTTP verification on a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3002` confirmed:
  - Anonymous `GET /admin` returns 307 to `/sign-in?callbackURL=/admin`.
  - Normal sign-up rejects a submitted `role` field with `FIELD_NOT_ALLOWED`, so public registration cannot self-assign admin privileges.
  - A verified, signed-in normal member has `role: "user"` in the sign-in response.
  - With a valid session cookie, `GET /admin` returns 200 and includes `访问受限` plus `没有进入管理后台的权限`, while `成员列表` is absent.
  - With that same normal-member session, `GET /api/auth/admin/list-users?limit=20&offset=0` returns 403.
- Browser MCP verification signed in `admin-restricted-20260609-0001@example.com` through same-origin fetch, opened `/admin`, and confirmed the visible restricted copy for a non-admin account.
- Captured screenshot: `.playwright-mcp-admin-restricted-after-user-list.png`.
- Full admin-list visual verification was not completed in this local memory-adapter run because admin access depends on `STARX_ADMIN_USER_IDS` and there is no stable seeded admin id across the temporary in-memory server restart.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes dynamic `/admin`.

## 2026-06-09 OAuth Consent Copy Simplification Evidence

- `/oauth/consent` no longer labels the requesting app as `应用标识`, which reads like an implementation detail. The page now shows `应用：...` and lightly normalizes hyphen/underscore app identifiers for readability.
- Unknown or custom scope names no longer render raw technical scope strings. If a scope is not in the friendly copy map, the page says `请求额外访问权限`.
- OAuth action errors now use `role="alert"` and `aria-live="polite"` so authorization failures are announced consistently with the dashboard and admin action feedback.
- Browser MCP verification used `oauth-copy-20260609-0001@example.com` on a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3004`.
- Browser MCP verification opened `/oauth/consent?client_id=demo-app&scope=openid%20profile%20email%20custom:billing` and confirmed:
  - `应用：demo app` is visible.
  - `请求额外访问权限` is visible for the unknown scope.
  - Raw `custom:billing` is not visible.
  - Old copy `应用标识` is not visible.
- Captured screenshot: `.playwright-mcp-oauth-consent-copy-simplified.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes dynamic `/oauth/consent`.

## 2026-06-09 Dashboard Connection Key Copy Evidence

- Dashboard-visible API key wording was simplified to `工具连接密钥`, so ordinary users see the feature as a way to connect their own tools, scripts, or automations instead of as an API implementation detail.
- The key creation form now asks for `用途名称` with the placeholder `例如：工作流自动化`.
- The success copy now says `连接密钥已创建，只会显示这一次，请现在复制保存。`, making the one-time display behavior explicit.
- Home-page capability cards and `authCapabilities` now use `工具连接密钥` instead of `应用访问密钥`.
- README feature copy now says `tool connection keys` for the dashboard feature; technical deployment notes still mention API keys where the implementation detail is appropriate.
- Browser MCP verification used `connection-key-copy-20260609-0001@example.com` on a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3005`.
- Browser MCP verification confirmed on `/`:
  - `工具连接密钥` is visible.
  - `应用访问密钥` is not visible.
  - Body width matched the desktop viewport without horizontal overflow.
- Browser MCP verification confirmed on `/dashboard`:
  - `工具连接密钥`, `用途名称`, and `创建连接密钥` are visible.
  - Old visible copy `应用访问密钥` / `访问密钥` is not visible before or after creating a key.
  - Creating a key through the visible form shows `连接密钥已创建，只会显示这一次，请现在复制保存。`.
  - The returned key still appears in a wrapped monospace block and does not cause horizontal overflow.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - page body width stayed within the viewport.
- Captured screenshots:
  - `.playwright-mcp-dashboard-connection-key-copy.png`
  - `.playwright-mcp-dashboard-connection-key-mobile-reduced.png`
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes dynamic `/dashboard`.

## 2026-06-09 Connection Key Copy Button Evidence

- The dashboard connection-key result now includes a visible `复制连接密钥` button next to the one-time key value.
- Successful copy changes the button state to `已复制`.
- If browser clipboard access fails, the key stays visible and the feedback tells the user to select and copy it manually.
- The result block now adds a plain-language reminder: `保存到安全的地方。离开页面后，我们不会再次显示完整内容。`
- Browser MCP verification used `copy-key-flow-20260609-0001@example.com` on a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3006`.
- Browser MCP verification confirmed:
  - Creating a key through the visible dashboard form shows `连接密钥已创建，只会显示这一次，请现在复制保存。`.
  - The returned key starts with `starx_` and remains wrapped inside the result block without desktop horizontal overflow.
  - Clicking `复制连接密钥` changes the button to `已复制`.
  - The browser clipboard text exactly matches the visible `starx_...` key.
  - There were no new console errors on the verified page.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - The key block remained wrapped, the `已复制` state stayed visible, and page body width stayed within the viewport.
- Captured screenshots:
  - `.playwright-mcp-dashboard-copy-connection-key.png`
  - `.playwright-mcp-dashboard-copy-connection-key-mobile-reduced.png`
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes dynamic `/dashboard`.

## 2026-06-09 Two-Step Verification Setup Evidence

- The dashboard two-step verification card no longer stops at a vague setup-started message. After the user enters their current password and clicks `准备开启`, the page now shows:
  - `扫码保存到验证器`
  - a QR code titled `两步验证二维码`
  - a plain instruction: `用常用验证器扫描二维码，再输入生成的 6 位验证码。`
  - `备用码` with a `复制备用码` button
  - a final `确认开启` form for the 6-digit authenticator code
- The Better Auth client typing now models the `/two-factor/enable` result as `totpURI` plus `backupCodes`, so the UI can render the actual next step instead of only reporting that setup started.
- Browser MCP verification used `two-factor-setup-20260609-0002@example.com` on a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3007`.
- Browser MCP verification confirmed the full enable flow:
  - same-origin email sign-in returned 200 with `twoFactorEnabled: false`.
  - clicking `准备开启` rendered the setup copy, a `168x168` QR code, 10 backup codes, `复制备用码`, and `确认开启`.
  - the old hollow copy `两步验证已开始设置，请按照提示完成最后确认。` was not visible.
  - clicking `复制备用码` changed the button state to `已复制`; direct clipboard read was blocked by the browser permission layer in this run, so the real clipboard text was not asserted.
  - extracting the current TOTP URI from the rendered QR component and submitting the generated 6-digit code through the visible form succeeded.
  - after confirmation, the setup UI closed and the page showed `两步验证已开启。下次登录会多一步确认。`.
- Browser MCP setup-state screenshot used `two-factor-setup-screenshot-20260609-0001@example.com` and confirmed on desktop:
  - setup instructions, QR code, backup codes, copy button, and confirm button were visible.
  - body width stayed within the viewport with no horizontal overflow.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - setup instructions, QR code, and backup codes stayed visible.
  - page body width stayed within the viewport.
- Captured screenshots:
  - `.playwright-mcp-dashboard-two-factor-setup.png`
  - `.playwright-mcp-dashboard-two-factor-mobile-reduced.png`
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes dynamic `/dashboard`.

## 2026-06-09 Two-Factor Challenge Copy Evidence

- `/two-factor` now presents the login challenge as `确认是你本人` instead of only naming the implementation feature.
- The challenge form now separates the two ways to continue:
  - default `验证器` mode shows `验证器里的 6 位验证码` and a single `用验证器登录` submit button.
  - `邮箱验证码` mode shows `发送到登录邮箱`, `邮件里的 6 位验证码`, and `用邮件验证码登录`.
- The old mixed action pair `验证并登录` plus `发送邮箱验证码` is gone, so users no longer see two unrelated-looking actions beside one generic `验证码` field.
- Challenge feedback now uses `role="status"` / `role="alert"` and `aria-live="polite"`, matching the dashboard, admin, and OAuth feedback behavior.
- Browser MCP verification used `two-factor-challenge-copy-20260609-0001@example.com` on a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3008`.
- Browser MCP verification confirmed:
  - a verified user could enable two-step verification through the dashboard setup flow.
  - after signing out, the visible email/password sign-in form redirected that user to `/two-factor`.
  - the default challenge page showed `确认是你本人`, `验证器`, `邮箱验证码`, and `验证器里的 6 位验证码`.
  - switching to `邮箱验证码` showed `发送到登录邮箱`, `邮件里的 6 位验证码`, and `用邮件验证码登录`.
  - sending the email code showed `验证码已发送到你的登录邮箱。`, changed the button to `重新发送验证码`, and rendered one `role="status"` feedback region.
  - reading the development outbox code from `.local/email-outbox.jsonl` and submitting it through the visible form completed login and reached `/dashboard`.
  - the dashboard then showed the expected account and `已开启。下次登录会多一步确认。`.
- Browser MCP desktop verification confirmed the default challenge state had no horizontal overflow.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - the `邮箱验证码` mode remained visible and usable.
  - the old mixed action copy stayed absent.
  - body and document widths matched the viewport with no horizontal overflow.
- Captured screenshots:
  - `.playwright-mcp-two-factor-challenge-default.png`
  - `.playwright-mcp-two-factor-challenge-mobile-reduced.png`
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes static `/two-factor` and dynamic `/dashboard`.

## 2026-06-09 OAuth Helper Page Copy Evidence

- `/oauth/select-account` now explains the continuation as `使用这个账号继续授权` instead of asking users to interpret a generic `继续` step.
- The account helper page now shows:
  - a `确认账号` status pill.
  - the current signed-in account under `当前账号`.
  - guidance that users should sign out first if this is not the account they want to use.
  - a primary button labeled `使用这个账号继续`.
- `/oauth/select-organization` now explains the continuation as `确认是否带上组织信息`.
- The organization helper page now shows:
  - a `组织授权` status pill.
  - plain guidance that the application wants to read team or organization information.
  - a fallback explanation: `没有看到要使用的组织？先返回账号中心确认组织设置，再回到应用重新发起授权。`
  - a primary button labeled `继续授权`.
- The shared OAuth action buttons now include lucide icons and no longer show a bare `继续` button for account or organization helper pages.
- Browser MCP verification used `oauth-helper-copy-20260609-0001@example.com` on a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3009`.
- Browser MCP desktop verification confirmed:
  - same-origin email sign-in returned 200.
  - `/oauth/select-account?code=test-code` showed `使用这个账号继续授权`, `确认账号`, the signed-in email, and `使用这个账号继续`.
  - `/oauth/select-organization?code=test-code` showed `确认是否带上组织信息`, `组织授权`, `没有看到要使用的组织`, and `继续授权`.
  - neither page rendered a button whose visible label was only `继续`.
  - both pages stayed within the desktop viewport with no horizontal overflow.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed on both helper pages:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - the new account and organization copy remained visible.
  - document width matched the viewport with no horizontal overflow.
- Captured screenshots:
  - `.playwright-mcp-oauth-select-account-copy.png`
  - `.playwright-mcp-oauth-select-organization-copy.png`
  - `.playwright-mcp-oauth-select-organization-mobile-reduced.png`
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes dynamic `/oauth/select-account` and `/oauth/select-organization`.

## 2026-06-09 New User Path Copy Evidence

- `/sign-up` now tells users up front that the last step happens in email: `填写邮箱和密码后，请打开邮箱里的验证按钮完成最后一步。`
- Successful sign-up feedback now says `账号已创建。请打开邮箱里的验证按钮，验证后就能登录账号中心。`, replacing the shorter `账号已创建，请打开邮件里的验证按钮。`
- `/forgot-password` now avoids implying that an account definitely exists for the submitted email. The page says `输入注册邮箱。如果有对应账号，我们会发送一封重置密码邮件。`
- Successful reset-link feedback now says `如果这个邮箱已有账号，我们会发送重置链接。请从邮件里的按钮继续。`, replacing the shorter `重置密码的链接已发送，请去邮箱查收。`
- `/verify-email` now gives more explicit next steps:
  - without a token: `输入注册邮箱，我们会重新发送验证邮件。`
  - after resend: `验证邮件已发送。请打开邮件里的验证按钮；如果没看到，可以检查垃圾邮件。`
  - after token verification: `邮箱已验证。现在可以返回登录，继续进入账号中心。`
- The verify-email panel feedback now uses `role="status"` / `role="alert"` and `aria-live="polite"`, matching the other auth flows.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3010`.
- Browser MCP desktop verification confirmed:
  - submitting `/sign-up` with `new-user-copy-20260609-0001@example.com` showed the new sign-up success message, one `role="status"` feedback region, and no old sign-up success copy.
  - submitting `/forgot-password` with `reset-copy-20260609-0001@example.com` showed the safer reset-link message, one `role="status"` feedback region, and no old reset-link success copy.
  - opening `/verify-email` without a token showed the new resend guidance.
  - resending verification mail for `new-user-copy-20260609-0001@example.com` showed the new resend success message, one `role="status"` feedback region, and no old resend success copy.
  - opening `/verify-email?token=...` from `.local/email-outbox.jsonl` and clicking `验证邮箱` showed `邮箱已验证。现在可以返回登录，继续进入账号中心。`
  - all checked desktop states stayed within the viewport with no horizontal overflow.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed on `/sign-up`, `/forgot-password`, and `/verify-email`:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - the new page descriptions remained visible.
  - document width matched the viewport with no horizontal overflow.
- Captured screenshots:
  - `.playwright-mcp-new-user-signup-copy.png`
  - `.playwright-mcp-forgot-password-copy.png`
  - `.playwright-mcp-verify-email-resend-copy.png`
  - `.playwright-mcp-verify-email-token-success-copy.png`
  - `.playwright-mcp-new-user-path-mobile-reduced.png`
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes static `/sign-up`, `/forgot-password`, `/verify-email`, and dynamic `/reset-password/[token]`.

## 2026-06-09 Admin Empty State And Feedback Copy Evidence

- The admin member list now distinguishes an empty account directory from an empty search result:
  - no members: `还没有成员` with guidance to use `新增用户`.
  - search miss: `没有找到匹配成员` with the applied search field/value and a suggestion to change or clear the search.
- The member search form now includes `清空搜索`, so admins can recover from a filtered empty state without editing the input manually.
- The selected-member summary now says `先从成员列表选择一个成员。` before selection and `已选择` with readable account identity after selection.
- Create/revoke/ban feedback now uses member-centered result copy:
  - created accounts name the member email/name.
  - session reset says the member's login state has expired and the next operation requires sign-in.
  - account pause says the member temporarily cannot log in.
- The old admin component copy scan confirmed these strings are no longer present in `src/components/admin/admin-client.tsx`: `尚未选择成员`, `请先选择一个成员`, `已要求 ... 重新登录`, `没有找到匹配成员。`, and `直接为成员创建账号`.
- Browser MCP verification used `admin-copy-1780980372687@example.com` on a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3011`.
- Browser MCP verification confirmed:
  - same-origin sign-up returned 200 with `role: "user"`.
  - opening the development verification link returned 200.
  - same-origin sign-in returned 200.
  - `/admin` as that normal member showed `访问受限` and `没有进入管理后台的权限`.
  - `成员列表` was absent for the non-admin account.
  - there were no browser console errors during the checked flow.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - body and document widths matched the viewport with no horizontal overflow.
- Captured screenshot: `.playwright-mcp-admin-copy-restricted-mobile-reduced.png`.
- Full admin-list visual verification is still blocked in the local memory-adapter run because `/admin` gates on `session.user.role === "admin"`, while the temporary memory database has no stable seeded admin role across server restarts.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes dynamic `/admin`.

## 2026-06-09 Sign-In Choice Copy Evidence

- `/sign-in` now describes the available choices in plainer terms: password login, login email, and already-added device verification.
- The sign-in form is grouped into three clear entry points:
  - `用密码登录`
  - `用邮件登录`
  - `用已添加的设备登录`
- The old login-link wording is no longer visible on the sign-in page: `邮箱登录链接`, `发送登录链接`, and `接收登录链接的邮箱`.
- The password submit button now says `登录账号中心`; the mail option says `发送登录邮件`; the device option says `用当前设备登录`.
- Login email success feedback now says `登录邮件已发送。请打开邮箱里的按钮继续；如果没看到，可以检查垃圾邮件。`
- Sign-in button loading state now tracks the chosen login method instead of making unrelated login buttons appear busy.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3012`.
- Browser MCP desktop verification confirmed:
  - the three new sign-in choice labels were visible.
  - the old login-link wording was absent.
  - submitting the mail-login form showed the new success feedback.
  - the success feedback rendered one `role="status"` region and no `role="alert"` region.
  - the page stayed within the desktop viewport with no horizontal overflow.
  - there were no browser console warnings or errors.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - the three new sign-in choice labels remained visible.
  - body and document widths stayed within the viewport.
- Captured screenshot: `.playwright-mcp-signin-copy-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes static `/sign-in`.

## 2026-06-09 Home Capability Copy Evidence

- Home-page capability cards no longer show terse feature names such as `邮箱登录链接`, `设备验证`, `两步验证`, `工具连接密钥`, `应用授权`, or `应用访问密钥`.
- The cards now describe ordinary user outcomes with a short explanation:
  - `邮箱和密码登录`
  - `收邮件登录`
  - `用设备登录`
  - `登录多一步确认`
  - `找回登录密码`
  - `连接自己的工具`
  - `确认应用访问`
  - `管理成员账号`
- Each capability card now includes a one-sentence explanation, for example `不想输入密码时，打开邮件里的按钮继续。` and `确认后再让第三方应用读取必要信息。`
- The landing and signed-in app navigation now use `授权应用` for the OAuth helper entry instead of the more noun-like `应用授权`.
- Global metadata copy now says the product supports email login, login email, device login, two-step confirmation, password recovery, and authorizing apps.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3013`.
- Browser MCP desktop verification confirmed:
  - all 8 capability labels and representative descriptions were present in the rendered card DOM.
  - old labels `邮箱登录链接`, `设备验证`, `两步验证`, `工具连接密钥`, `应用授权`, and `应用访问密钥` were absent from the homepage DOM.
  - desktop body/document widths stayed within the viewport, and all 8 cards had stable equal heights.
  - there were no browser console warnings or errors.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - all 8 capability labels were present.
  - body and document widths stayed within the viewport.
- Captured screenshot: `.playwright-mcp-home-capability-copy-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes static `/`.

## 2026-06-09 Dashboard Device And Confirmation Copy Evidence

- `/dashboard` now uses the same ordinary-user wording introduced on the home page:
  - `设备验证` -> `用设备登录`
  - `两步验证` -> `登录多一步确认`
  - `工具连接密钥` -> `连接自己的工具`
  - `登录设备` -> `已登录的设备`
- The device-login card now explains the action as adding the current computer or phone, with `设备名称` and `添加这台设备`.
- The login-confirmation setup now avoids raw feature naming in the main card and setup text:
  - setup errors say `登录确认`.
  - the QR code title is `登录确认二维码`.
  - the code field says `验证器里的 6 位数字`.
  - backup codes are labeled `备用登录码`.
- The other-devices action now says `退出其他设备`, and success feedback says `已让其他设备退出账号。`
- Browser MCP verification used `dashboard-copy-final-1780983479992@example.com` on a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3014`.
- Browser MCP desktop verification confirmed:
  - sign-up returned 200, email verification returned 200, and same-origin sign-in returned 200.
  - the dashboard showed `用设备登录`, `登录多一步确认`, `连接自己的工具`, `已登录的设备`, and `授权应用`.
  - old card/action labels `设备验证`, `两步验证`, `工具连接密钥`, `登录设备`, `添加当前设备`, and `确认开启` were absent from the dashboard text.
  - desktop body/document widths matched the viewport.
  - there were no browser console warnings or errors.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - the signed-in nav retained horizontal overflow handling with `overflow-x: auto`.
  - body and document widths stayed within the viewport.
- Captured screenshot: `.playwright-mcp-dashboard-device-confirm-copy-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes dynamic `/dashboard`.

## 2026-06-09 OAuth Confirm Access Copy Evidence

- `/oauth/consent` now presents OAuth consent as `确认应用访问` instead of the more technical `应用授权`.
- The active consent page now says `确认这个应用可以看到哪些信息` and `这个应用将会看到`, replacing `是否允许这个应用访问你的账号？` and `本次将访问`.
- Scope descriptions now use plainer verbs:
  - `profile` -> `查看你的基础资料`
  - `email` -> `查看你的邮箱地址`
  - `offline_access` -> `保持这次应用连接`
  - `read:organization` -> `查看组织信息`
  - unknown scopes -> `查看额外信息`
- Consent buttons now say `确认并继续` and `不继续`, replacing `允许并继续` and `暂不允许`.
- The empty state now says `现在没有需要确认的应用`, replacing `现在没有待授权的应用`.
- `/oauth/select-account` now says `使用这个账号继续` instead of `使用这个账号继续授权`.
- `/oauth/select-organization` now labels the step as `组织信息`, uses `带上组织信息继续`, and tells users to reconnect from the app if the organization is missing.
- Browser MCP verification used `oauth-confirm-copy-1780984014565@example.com` on a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3015`.
- Browser MCP desktop verification confirmed:
  - sign-up returned 200, email verification returned 200, and same-origin sign-in returned 200.
  - active `/oauth/consent?...` showed `确认应用访问`, `确认这个应用可以看到哪些信息`, `这个应用将会看到`, `查看你的基础资料`, `保持这次应用连接`, `查看额外信息`, `确认并继续`, and `不继续`.
  - `/oauth/consent` without a request showed `现在没有需要确认的应用`.
  - `/oauth/select-account?code=test-code` showed the account continuation copy.
  - `/oauth/select-organization?code=test-code` showed `组织信息` and `带上组织信息继续`.
  - old labels `应用授权`, `组织授权`, `继续授权`, `访问权限`, `本次将访问`, `允许并继续`, `暂不允许`, and `待授权` were absent from the checked OAuth pages.
  - all checked desktop pages stayed within the viewport.
  - there were no browser console warnings or errors.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed on the active consent page:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - body and document widths stayed within the viewport.
- Captured screenshot: `.playwright-mcp-oauth-confirm-access-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes dynamic `/oauth/consent`, `/oauth/select-account`, and `/oauth/select-organization`.

## 2026-06-09 Local Admin Seed And Full Admin Verification Evidence

- `src/lib/auth.ts` now supports a local-only memory-adapter admin seed for browser verification. The seed runs only when `DATABASE_URL` is empty, `BETTER_AUTH_URL` is unset or points to `localhost` / `127.0.0.1`, and `STARX_DEV_ADMIN_EMAIL` is set.
- The seeded member is deterministic and admin-capable:
  - id: `starx-dev-admin`.
  - role: `admin`.
  - email verified: `true`.
  - credential account: `providerId: "credential"` with a Better Auth-compatible password hash.
- The seed is idempotent. If the configured email already exists in the local memory table, that member is updated to `role: "admin"` and linked to the local credential account instead of adding a duplicate visible member.
- Local test credentials are intentionally explicit: sign in with `STARX_DEV_ADMIN_EMAIL` and the default local-only password `Password123!`. `STARX_DEV_ADMIN_PASSWORD_HASH` can replace the default hash for a different local password.
- `.env.example` and `README.md` now document `STARX_DEV_ADMIN_EMAIL`, `STARX_DEV_ADMIN_NAME`, and `STARX_DEV_ADMIN_PASSWORD_HASH`, with a production warning not to set `STARX_DEV_ADMIN_*` variables.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3016` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Same-origin sign-in returned 200 with `role: "admin"` and `id: "starx-dev-admin"`.
- Opening `/admin` as the seeded admin confirmed `管理后台`, `成员列表`, `新增用户`, `重置登录状态`, `暂停账号`, `本地管理员`, and `local-admin@example.com` were visible, while `访问受限` and `没有进入管理后台的权限` were absent.
- Better Auth admin API verification confirmed `GET /api/auth/admin/list-users?limit=20&offset=0` returned 200, one user, and the seeded admin with `role: "admin"`.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed on the real admin list:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - body and document widths stayed within the viewport.
  - no browser console warnings or errors were recorded.
- Captured screenshot: `.playwright-mcp-admin-seeded-list-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes dynamic `/admin`.

## 2026-06-09 Password Recovery And Tool Connection Copy Evidence

- The password recovery flow now describes the user action as `找回登录密码` and `发送找回密码邮件`, replacing the more system-oriented `发送重置链接`.
- The reset form button now says `保存新密码`, and the missing-link state says `这封邮件按钮没有带完整信息，请回到邮件里重新打开。`, avoiding raw reset/token wording in the visible UI.
- Email verification copy now tells users to use the email button:
  - initial token state: `点击下方按钮完成验证。验证后，你就可以继续登录。`
  - no-token state: `输入登录邮箱，我们会再发一封验证邮件。`
  - primary action: `完成邮箱验证`.
- Device-login error copy now says `用设备登录` instead of the older `设备验证`.
- Tool-connection copy no longer talks about `脚本或自动化` in primary UI:
  - home capability card: `为自己的工具创建专用连接密钥。`
  - dashboard card: `给自己的工具或工作流连接账号时使用，只在创建后显示一次。`
  - placeholder: `例如：数据同步`.
- Source scan confirmed the old visible strings are absent from `src/app`, `src/components`, and `src/lib`: `设备验证`, `重置链接`, `重置信息`, `脚本或自动化`, `给脚本`, `工作流自动化`, `发送重置链接`, and `重置密码失败`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3017` and `STARX_DEV_ADMIN_EMAIL=copy-check-admin@example.com`.
- Browser MCP desktop verification confirmed:
  - `/` showed `为自己的工具创建专用连接密钥。`
  - `/forgot-password` showed `找回登录密码`, `输入登录邮箱`, and `发送找回密码邮件`.
  - submitting the forgot-password form showed `如果这个邮箱已有账号，我们会发送找回密码邮件。请从邮件里的按钮继续。`
  - `/reset-password` without a token showed `保存新密码` and the complete-email-button guidance.
  - `/verify-email` showed the resend guidance and `重新发送验证邮件`.
  - `/dashboard` as the seeded admin showed the new tool-connection description and the `例如：数据同步` placeholder.
  - the checked pages had no browser console warnings or errors.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed on `/forgot-password`:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - body and document widths matched the viewport.
- Captured screenshot: `.playwright-mcp-password-recovery-copy-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes static `/forgot-password`, `/reset-password`, `/verify-email`, and dynamic `/dashboard`.

## 2026-06-09 Auth Email Copy And Template Evidence

- `src/lib/email.ts` now supports an optional `note` field for safety guidance in both plain-text and HTML emails.
- The HTML email template now escapes title, body, action label, action URL, code, note, and app name before interpolation. This prevents organization names, email addresses, or URLs from being injected into the HTML body.
- The email footer now consistently says `这封邮件由系统自动发送，请勿直接回复。`
- Verification email copy now uses:
  - subject: `请完成邮箱验证`
  - title: `完成邮箱验证`
  - action: `完成验证`
  - safety note: `如果你没有创建或登录 StarX-Oauth 账号，可以忽略这封邮件。`
- Password recovery email copy now uses:
  - subject: `找回你的登录密码`
  - title: `设置新的登录密码`
  - action: `设置新密码`
  - safety note: `如果不是你发起的找回密码请求，可以忽略这封邮件。`
- Magic-link email copy now uses:
  - subject: `用这封邮件登录 StarX-Oauth`
  - title: `继续登录 StarX-Oauth`
  - body guidance that the email is for this login only and should not be forwarded.
- Email verification OTP and 2FA email OTP copy now explains where to enter the 6-digit code instead of only saying `请输入这个验证码`.
- Organization invitation email now says `加入组织邀请` and asks the recipient to view the invitation and decide whether to join.
- Source scan confirmed older system-oriented email phrases are absent from `src/lib`: `重置密码`, `登录链接`, `点击下方链接`, `立即验证`, `去重置`, `请输入这个验证码`, and `登录验证`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3018` and `STARX_DEV_ADMIN_EMAIL=email-copy-admin@example.com`.
- Runtime auth API verification triggered:
  - `POST /api/auth/sign-up/email`: returned 200 and wrote the verification email to `.local/email-outbox.jsonl`.
  - `POST /api/auth/request-password-reset`: returned 200 and wrote the password recovery email.
  - `POST /api/auth/sign-in/magic-link`: returned 200 and wrote the login email.
- Outbox verification confirmed the new subjects, titles, action labels, notes, and no-reply footer were present in the emitted plain-text messages.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed on `/sign-up`:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - `.motion-band` computed `will-change` was `auto`.
  - body and document widths matched the viewport.
- Captured screenshot: `.playwright-mcp-email-copy-signup-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes static `/sign-up`, `/forgot-password`, and dynamic auth routes.

## 2026-06-09 GSAP Motion Accessibility And Performance Evidence

- `src/components/motion/motion-stage.tsx` now includes an explicit `isMobile: "(max-width: 1023px)"` condition in `gsap.matchMedia()`. This fixes the mobile no-preference gap where neither `isDesktop` nor `reduceMotion` matched, so the mobile animation setup did not run.
- Entrance animation now uses scoped `gsap.fromTo()` groups instead of one shared timeline. Each group clears `transform`, `opacity`, `visibility`, `willChange`, and `transformOrigin` after it finishes, which keeps header navigation and action buttons visible after animation completes.
- The reduced-motion branch now only clears motion-related inline properties and does not write `autoAlpha: 1`, so reduced-motion pages render without lingering inline opacity/visibility styles.
- `.motion-band` no longer has default `will-change: transform, opacity` in CSS. Runtime GSAP now applies `will-change` only to light bands that actually animate:
  - desktop: drift, lift, tilt, and pulse bands.
  - mobile no-preference: drift and lift bands only.
  - reduced-motion: all bands remain `will-change: auto`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3019` and `STARX_DEV_ADMIN_EMAIL=motion-check-admin@example.com`.
- Browser MCP desktop verification on `/` at `1366x900` confirmed:
  - `prefers-reduced-motion` did not match.
  - top navigation links `账号中心`, `管理后台`, `确认应用访问`, and the `登录账号` button were fully visible with opacity `1`, visibility `visible`, and no lingering inline styles after animation completion.
  - animated desktop bands had `will-change: transform, opacity`.
  - entrance targets returned to `will-change: auto`.
  - body/document widths stayed within the viewport.
- Browser MCP mobile no-preference verification on `/` at `390x844` confirmed:
  - drift and lift bands had `will-change: transform` and active transform styles.
  - tilt and pulse bands stayed at `will-change: auto` with no inline style.
  - body/document widths stayed within the viewport.
- Browser MCP reduced-motion verification on `/sign-in` and signed-in `/dashboard` at `390x844` confirmed:
  - `matchMedia("(prefers-reduced-motion: reduce)")` matched.
  - `html` computed `scroll-behavior` was `auto`.
  - all motion bands and entrance targets had `will-change: auto`.
  - motion bands and entrance targets had empty inline styles after setup.
  - body/document widths stayed within the viewport.
  - no browser console warnings or errors were recorded.
- Captured screenshots:
  - `.playwright-mcp-motion-desktop-normal-fixed.png`.
  - `.playwright-mcp-motion-reduced-dashboard-clean.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes static `/`, `/sign-in`, and dynamic `/dashboard`.

## 2026-06-09 Pending Action Copy Evidence

- Client-side forms in auth, dashboard, admin, and email-verification components now use ordinary `onSubmit` handlers with `FormData` instead of client `form action` functions. This lets visible waiting states render immediately before the request finishes.
- Buttons now expose specific waiting copy and `aria-busy` for the active action, including `正在登录...`, `正在发送...`, `正在创建...`, `正在保存...`, `正在确认...`, `正在刷新...`, `正在退出...`, and `正在暂停...`.
- Dashboard and admin action areas now track the exact pending action, so one busy operation disables related controls while only the clicked button changes its label and spinner.
- Admin member-list controls track search, refresh, and clear actions separately, so list-level loading no longer collapses every button into the same ambiguous state.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3020` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`. Playwright delayed non-GET requests by 1200ms to make pending states observable.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed visible pending copy plus `aria-busy` on:
  - `/sign-in`: password login, magic email login, and seeded admin login.
  - `/sign-up`: account creation.
  - `/forgot-password`: password recovery email.
  - `/verify-email`: verification email resend.
  - `/two-factor`: authenticator-code login and email-code send.
  - `/dashboard`: connection-key creation and other-device sign-out.
  - `/admin`: member-list refresh and new-user creation.
  - `/oauth/consent`: confirm-and-continue authorization.
- The same browser checks confirmed reduced motion was active, `html` scroll behavior was `auto`, and body/document widths stayed within the mobile viewport. One browser console 401 was expected from the intentionally invalid password-login check.
- Captured screenshots:
  - `.playwright-mcp-pending-button-copy-mobile-reduced.png`.
  - `.playwright-mcp-pending-auth-extra-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes all auth, dashboard, admin, and OAuth pages.

## 2026-06-09 Brand Icon Tone Evidence

- The shared `BrandMark` no longer uses the `Sparkles` icon or a bright white glow, because that reads like a generic AI-assistant badge instead of an account-security product.
- The brand mark now uses `ShieldCheck` with a restrained neutral badge and a muted security-green accent, aligning the first visual signal with login, account protection, and authorization.
- The brand link shape was changed from a pill-like glowing mark to a compact rounded square so the first impression reads as account security rather than an AI product badge.
- Source scans confirmed `Sparkles`, `Sparkle`, `⭐`, `✦`, `✧`, `★`, `☆`, `星星`, and `闪光` are absent from `src/app`, `src/components`, and `src/lib`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3032` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks confirmed:
  - `/` desktop renders the shared brand SVG as `lucide-shield-check`, has no `sparkle` or `star` SVG class, no star/sparkle visible text, no page-level horizontal overflow, and no lingering GSAP inline styles after entrance motion.
  - `/` mobile renders the same shield mark, has no star/sparkle visible text, keeps the brand and sign-in actions from overlapping, and stays within the viewport.
- Captured screenshots:
  - `.playwright-mcp-brand-icon-no-star-home-desktop.png`.
  - `.playwright-mcp-brand-icon-no-star-home-mobile.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 App Access Copy Tone Evidence

- Landing navigation, signed-in navigation, metadata, and hero support copy now say `确认应用访问` / `应用访问确认` instead of `授权应用`.
- This keeps the OAuth entry framed as a user decision about what an app can see, rather than as a protocol or admin feature.
- The home preview heading now says `登录、安全、应用访问确认，一个地方完成。` instead of using the shorter protocol-flavored `授权`.
- Source scan confirmed the old visible label `授权应用` is absent from `src/app`, `src/components`, and `src/lib`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3022` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks confirmed:
  - `/` desktop navigation shows `账号中心`, `管理后台`, and `确认应用访问`.
  - signed-in `/dashboard` mobile navigation shows `确认应用访问`.
  - neither page shows the old `授权应用` label or star/sparkle symbols.
  - the shared brand icon remains `lucide-shield-check`.
  - desktop and mobile body/document widths stayed within the viewport, and reduced-motion dashboard kept `scroll-behavior: auto`.
- Captured screenshots:
  - `.playwright-mcp-app-access-copy-home-desktop.png`.
  - `.playwright-mcp-app-access-copy-dashboard-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 OAuth Helper Wording Evidence

- OAuth helper pages now avoid protocol/admin-flavored words in their visible copy:
  - `/oauth/consent` now says `先看看这个应用想看什么`, `应用名称`, and `它想查看`.
  - missing request state now says `无需确认` and `现在没有应用需要你确认`.
  - fallback application names now show `这个应用` instead of `已注册应用`.
  - organization-related user copy now uses `团队信息`.
  - the shared decline button now says `先不继续`.
  - shared action errors now fall back to `没能继续，请稍后再试。`.
- Scope explanations were softened for ordinary users:
  - `openid` -> `确认是你本人`.
  - `email` -> `查看你的邮箱`.
  - `offline_access` -> `保持这次连接，减少重复确认`.
  - `read:organization` -> `查看你的团队信息`.
- Source scan confirmed old OAuth-helper visible phrases are absent from `src/app/oauth` and `src/components/oauth`: `组织信息`, `组织选项`, `带上组织`, `继续失败`, `已注册应用`, `暂无请求`, `这个应用将会看到`, `确认这个应用可以看到哪些信息`, and `授权`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3023` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed:
  - `/oauth/consent?client_id=demo-app&scope=openid%20profile%20email%20offline_access%20read:organization` showed `应用访问确认`, `先看看这个应用想看什么`, `应用名称：demo app`, `它想查看`, `确认是你本人`, `查看你的邮箱`, `保持这次连接，减少重复确认`, `查看你的团队信息`, and `先不继续`.
  - `/oauth/select-account?code=test-code` showed `当前账号`, `用这个账号继续吗？`, `应用访问确认`, and `使用这个账号继续`.
  - `/oauth/select-organization?code=test-code` showed `团队信息`, `是否带上团队信息？`, `带上团队信息继续`, and `没有看到要使用的团队`.
  - checked pages did not show old protocol/admin-flavored labels such as `授权`, `组织信息`, `带上组织`, `组织选项`, `已注册应用`, or `继续失败`.
  - all checked pages had `html` scroll behavior `auto`, no page-level horizontal overflow, and empty inline styles / `will-change: auto` on entrance motion targets.
  - no browser console warnings or errors were recorded.
- Captured screenshots:
  - `.playwright-mcp-oauth-helper-wording-consent-mobile-reduced.png`.
  - `.playwright-mcp-oauth-helper-wording-select-account-mobile-reduced.png`.
  - `.playwright-mcp-oauth-helper-wording-select-organization-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Member Management Copy Evidence

- Admin-facing visible copy now frames the area as `成员管理` instead of `管理后台`.
- Restricted access copy now says `暂时不能进入成员管理` and explains that the account cannot add or handle member accounts.
- The member management page now says `查看成员、添加账号、让成员重新登录，或临时暂停账号。`
- The creation card now says `添加成员`, uses `账号权限` instead of `角色`, and reports `添加成员失败` on errors.
- The session reset card now says `让成员重新登录` and explains that the selected member will exit all devices.
- Success feedback now says the member was added or exited from all devices, avoiding lower-level phrases such as `登录状态失效`.
- Source scan confirmed old admin-facing phrases are absent from `src/app`, `src/components`, and `src/lib`: `管理后台`, `新增用户`, `重置登录状态`, `创建用户失败`, `登录状态失效`, `要求重新登录`, `用户 ID`, and `用户ID`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3024` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Browser MCP mobile verification at `390x844` with `prefers-reduced-motion: reduce` confirmed:
  - seeded admin `/admin` showed `成员管理`, `添加成员`, `账号权限`, `让成员重新登录`, and `暂停账号`.
  - adding a member through the visible form showed `正在添加...` with `aria-busy`, then `已添加 文案验证成员，成员列表已更新。`.
  - the checked admin page did not show old labels such as `管理后台`, `新增用户`, `重置登录状态`, `创建用户失败`, `登录状态失效`, `要求重新登录`, `用户 ID`, or `用户ID`.
  - a freshly registered and email-verified normal member visiting `/admin` saw `需要管理员权限`, `暂时不能进入成员管理`, and `当前账号已经登录，但还不能添加成员或处理成员账号。`.
  - the normal member restricted page did not show old copy `访问受限`, `管理后台`, or `没有进入管理后台的权限`.
  - reduced motion was active, `html` scroll behavior was `auto`, body/document widths stayed within the viewport, and no browser console warnings or errors were recorded for the successful checks.
- Captured screenshots:
  - `.playwright-mcp-admin-member-copy-mobile-reduced.png`.
  - `.playwright-mcp-admin-member-restricted-copy-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Connection Code Copy Evidence

- User-facing tool-connection copy now says `连接码` instead of `连接密钥`, keeping the dashboard closer to ordinary account-language while the implementation still uses Better Auth API keys internally.
- The home capability card now says `为自己的工具创建专用连接码。`.
- Dashboard feedback and actions now use `创建连接码`, `连接码已创建，只会显示这一次，请现在复制保存。`, `复制连接码`, and `复制失败，请手动选中连接码后复制。`.
- README feature copy now describes the user dashboard feature as `tool connection codes`; production notes still mention API keys where the server-side security detail is appropriate.
- Source scans confirmed `Sparkles`, `Sparkle`, `⭐`, `✦`, `✧`, `星星`, and `闪光` are absent from `src`, and old visible connection labels `连接密钥`, `工具连接密钥`, `应用访问密钥`, and `访问密钥` are absent from `src/app`, `src/components`, and `src/lib`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3025` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Browser runtime checks confirmed:
  - `/` desktop shows `为自己的工具创建专用连接码。`, does not show `连接密钥`, does not show star/sparkle text, and renders the brand SVG as `lucide-shield-check` with no `sparkles` SVG class.
  - Signed-in `/dashboard` mobile shows `创建连接码`, creates a one-time `starx_` value, shows `连接码已创建，只会显示这一次，请现在复制保存。`, shows `复制连接码`, changes the copy button to `已复制`, and does not show `连接密钥`.
  - Desktop and mobile checked pages stayed within the viewport with no page-level horizontal overflow.
- Captured Playwright MCP screenshots:
  - `.playwright-mcp-connection-code-home-desktop.png`.
  - `.playwright-mcp-connection-code-dashboard-mobile.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Member Device Copy Evidence

- The home-page member-management card now says `管理员可以添加成员、处理账号和设备登录。` instead of referring to `登录状态`.
- The member-management intro now says `查看成员、添加账号、让成员退出其他设备，或临时暂停账号。`, making the action concrete instead of saying `让成员重新登录`.
- Shared auth error copy now says `登录已过期，请重新登录后再试。` instead of `登录状态已失效，请重新登录后再试。`.
- Source scans confirmed old visible phrases are absent from `src/app`, `src/components`, and `src/lib`: `登录状态已失效`, `管理员可以处理成员和登录状态`, `查看成员、添加账号、让成员重新登录，或临时暂停账号`, `管理后台`, `访问受限`, `授权应用`, `连接密钥`, `Sparkles`, `Sparkle`, `⭐`, `✦`, `✧`, `星星`, and `闪光`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3026` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Browser runtime checks confirmed:
  - `/` desktop shows the new member-management card copy, does not show the old `登录状态` card copy, does not show `连接密钥`, and has no star/sparkle text.
  - Signed-in `/admin` mobile shows the new intro, does not show `管理后台` or the old intro, and stayed within the viewport.
  - Entrance motion targets on checked pages had no lingering inline styles and computed `will-change: auto` after the GSAP entrance completed.
- Captured Playwright MCP screenshots:
  - `.playwright-mcp-home-member-device-copy-desktop.png`.
  - `.playwright-mcp-member-device-copy-mobile.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Two-Factor Human Copy Evidence

- The home-page security card now says `登录时可以用验证器应用或登录邮箱多确认一次。` instead of presenting `验证器` / `邮件验证码` as feature names.
- `/two-factor` now explains the choice as `打开验证器应用输入 6 位数字，也可以让我们发一封邮件继续登录。`.
- The two-factor challenge tabs now say `验证器应用` and `登录邮箱`, with `aria-label="选择确认方式"`.
- Email-based login confirmation now uses `邮件里的 6 位数字`, `发送到登录邮箱`, `重新发送邮件`, `已发送到你的登录邮箱。`, and `用邮件继续登录`.
- Dashboard setup copy now says `请用验证器应用扫码保存，再输入 6 位数字完成开启。`, `扫码保存到验证器应用`, `用常用验证器应用扫描二维码，保存后输入 6 位数字。`, and `验证器应用里的 6 位数字`.
- Source scans confirmed old visible challenge/setup phrases are absent from `src/app` and `src/components`: `选择验证方式`, `邮箱验证码发送失败`, `验证码已发送到你的登录邮箱`, `重新发送验证码`, `邮件里的 6 位验证码`, `验证器里的 6 位验证码`, `用邮件验证码登录`, `用验证器登录`, `请用验证器扫码保存`, `用常用验证器扫描二维码`, `重要账号可开启验证器或邮件验证码`, and `收一封邮件验证码`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3027` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Browser runtime checks confirmed:
  - `/two-factor` mobile shows `验证器应用`, `登录邮箱`, `邮件里的 6 位数字`, and `用邮件继续登录`, while old challenge labels are absent.
  - Signed-in `/dashboard` mobile expands the setup panel and shows the new authenticator-app wording, including the QR title `验证器应用二维码`.
  - Checked mobile pages stayed within the viewport; the `/two-factor` GSAP entrance targets had no lingering inline styles and computed `will-change: auto` after entrance motion completed.
- Captured Playwright MCP screenshots:
  - `.playwright-mcp-two-factor-human-copy-mobile.png`.
  - `.playwright-mcp-dashboard-two-factor-human-copy-mobile.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Admin Device Action Copy Evidence

- The member-management device action is now consistently described as exiting other devices instead of `让成员重新登录`.
- The member list helper now says `先选择成员，再处理设备登录或暂停账号。` instead of referring to `登录和账号状态`.
- The device action card now uses `退出成员其他设备`, and its button uses `退出其他设备`.
- Empty-selection and failure feedback now say `请先在成员列表选择要退出其他设备的成员。` and `无法让该成员退出其他设备，请稍后再试。`.
- Source scans confirmed old visible phrases are absent from `src/app`, `src/components`, and `src/lib`: `让成员重新登录`, `要重新登录的成员`, `无法让该成员重新登录`, and `登录和账号状态`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3028` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Browser runtime checks confirmed signed-in `/admin` mobile shows `退出成员其他设备`, `退出其他设备`, and the new member-list helper, while old copy and `管理后台` are absent.
- The checked mobile page stayed within the viewport; entrance motion targets had no lingering inline styles and computed `will-change: auto` after the GSAP entrance completed.
- Captured Playwright MCP screenshot: `.playwright-mcp-admin-member-device-action-copy-mobile.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Email Digit Copy Evidence

- Generic auth error copy now avoids `验证码` and uses:
  - `邮件按钮或 6 位数字已过期，请重新获取。`
  - `这封邮件按钮没有生效，请重新打开邮件或重新获取。`
  - `6 位数字不正确，请重新输入。`
- The shared email plain-text template now labels code-based messages as `6 位数字: ...` instead of `验证码: ...`.
- Email OTP copy now uses `你的邮箱确认数字` and `输入这 6 位数字`.
- Login confirmation email copy now uses `你的登录确认数字`.
- The capability list now says `邮件里的 6 位数字` instead of `邮件验证码`.
- Source scans confirmed old visible strings are absent from `src/lib`, `src/components`, and `src/app`: `你的邮箱验证码`, `输入这 6 位验证码`, `你的登录确认码`, `验证码:`, `链接或验证码`, `验证码无效`, `验证码不正确，请重新输入`, and `邮件验证码`.
- Runtime verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3029` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- API verification triggered `POST /api/auth/email-otp/send-verification-otp` for `local-admin@example.com` and confirmed the latest `.local/email-outbox.jsonl` record uses subject `你的邮箱确认数字`, title `输入这 6 位数字`, and plain text containing `6 位数字: <code>`.
- Browser MCP mobile verification on `/two-factor` confirmed `邮件里的 6 位数字` and `用邮件继续登录` are visible, old challenge copy is absent, page width stays within the viewport, and GSAP entrance targets have no lingering inline styles with computed `will-change: auto`.
- Captured Playwright MCP screenshot: `.playwright-mcp-email-digit-copy-mobile.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Team Invitation Copy Evidence

- Organization invitation email copy now uses the same ordinary-user `团队` wording as the OAuth team-information pages.
- Invitation email subject/title changed from `组织邀请` / `加入组织邀请` to `你收到一个团队邀请` / `加入团队邀请`.
- Invitation email body now says the inviter invited the recipient to join `<name> 团队`, and the safety note says `如果你不认识这个团队邀请，可以忽略这封邮件。`.
- Source scans confirmed old visible organization invitation phrases are absent from `src/app`, `src/components`, and `src/lib`: `组织邀请`, `加入组织`, `组织信息`, `带上组织`, `组织选项`, and `不认识这个邀请`.
- Build artifact scan confirmed the compiled auth chunk contains `你收到一个团队邀请`, `加入团队邀请`, and `不认识这个团队邀请`, with no old organization-invitation copy in that sender.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3030` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Browser runtime checks confirmed signed-in `/oauth/select-organization?code=test-code` mobile shows `团队信息`, `是否带上团队信息？`, and `带上团队信息继续`, while old organization labels are absent.
- The checked mobile page stayed within the viewport; entrance motion targets had no lingering inline styles and computed `will-change: auto` after the GSAP entrance completed.
- Captured Playwright MCP screenshot: `.playwright-mcp-team-invite-copy-mobile.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 README Copy Alignment Evidence

- README now separates ordinary-user capability copy from developer-facing technical capability notes.
- The `用户可见功能` section uses current UI wording such as `邮件按钮`, `验证器应用`, `登录邮箱`, `连接码`, `成员管理`, `退出成员其他设备`, and `应用访问确认`.
- Technical terms such as `TOTP`, `email OTP`, `OAuth`, `Bearer/JWT`, and `API key` are kept under `技术能力` or production notes instead of the user-facing feature list.
- README route copy now labels `/admin` as `member management` instead of `administrator console`.
- Source/README scan confirmed technical terms are still present only in technical sections where implementation detail is appropriate.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3031` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Browser runtime checks confirmed `/` desktop still shows ordinary-user copy such as `登录时可以用验证器应用或登录邮箱多确认一次。` and `为自己的工具创建专用连接码。`, while old visible labels such as `TOTP`, `2FA`, `OTP`, `OAuth`, `JWT`, `API key`, `Bearer`, `连接密钥`, `邮件验证码`, `授权应用`, and `管理后台` are absent.
- The checked desktop page stayed within the viewport, had no star/sparkle text or SVG class, and entrance motion targets had no lingering inline styles with computed `will-change: auto`.
- Captured Playwright MCP screenshot: `.playwright-mcp-readme-copy-alignment-home.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Ambient Motion Visibility Evidence

- `MotionStage` now tracks the long-running background band tweens and pauses them on `visibilitychange` when `document.hidden` is true, then resumes them when the page becomes visible.
- The change is limited to ambient background loops. Entrance animations still complete normally and clear their inline `transform`, `opacity`, `visibility`, `willChange`, and `transformOrigin` styles.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3033` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks confirmed:
  - `/` desktop normal motion: the first background band moved before pause, stayed unchanged for 1.1s while `document.hidden` was simulated, then moved again after visibility was restored; no browser console warnings or errors were recorded.
  - `/` mobile normal motion: the background band still moved, the page stayed within the viewport, brand/sign-in actions did not overlap, and entrance targets had no lingering inline styles.
  - `/` mobile reduced motion: `prefers-reduced-motion: reduce` matched, `html` scroll behavior was `auto`, the background band stayed still for 1s, band inline styles stayed empty, and computed `will-change` stayed `auto`.
- Captured screenshots:
  - `.playwright-mcp-motion-visibility-desktop.png`.
  - `.playwright-mcp-motion-visibility-reduced-mobile.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Motion Timeline Evidence

- `MotionStage` now builds one labeled GSAP entrance timeline (`enter`) for brand, nav, primary, secondary, scale, rise, and line targets instead of creating separate tweens with `delay`.
- The previous visual offsets are preserved through timeline positions: brand at `enter`, nav at `enter+=0.06`, primary at `enter+=0.12`, line at `enter+=0.16`, secondary/scale at `enter+=0.18`, and rise at `enter+=0.24`.
- Ambient background tweens remain separate so the existing `visibilitychange` pause/resume behavior still controls only long-running loops.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3034` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks confirmed:
  - `/` desktop normal motion: entrance targets had no lingering inline styles, computed `will-change` returned to `auto`, background bands still moved, paused when `document.hidden` was simulated, and resumed when visibility was restored.
  - `/sign-in` desktop normal motion: the auth shell rendered with the shield brand mark, stayed within the viewport, and entrance targets had no lingering inline styles or `will-change`.
  - Signed-in `/dashboard` mobile reduced motion: local admin sign-in returned 200, app shell rendered, `prefers-reduced-motion: reduce` matched, `html` scroll behavior was `auto`, background bands stayed still, inline styles stayed empty, and mobile nav kept `overflow-x: auto`.
  - No browser console warnings or errors were captured by the verification scripts.
- Captured screenshots:
  - `.playwright-mcp-motion-timeline-home-desktop.png`.
  - `.playwright-mcp-motion-timeline-signin-desktop.png`.
  - `.playwright-mcp-motion-timeline-dashboard-reduced-mobile.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Motion Timeline Helper And OAuth Evidence

- `MotionStage` now uses a small local `addEntranceStep` helper so each entrance step adds targets, from-vars, to-vars, and a timeline position while sharing the same `clearProps` cleanup.
- The helper accepts `Element[]` targets because navigation children come from `element.children`; this matches the DOM shape and keeps GSAP target typing accurate.
- Source scan confirmed old `delay` keys are absent from `src/components/motion/motion-stage.tsx`; sequencing remains label-based through the GSAP timeline.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3035` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks confirmed:
  - Signed-in OAuth helper pages at mobile reduced motion (`/oauth/consent`, `/oauth/select-account`, `/oauth/select-organization`) showed their expected ordinary-user copy, stayed within the viewport, had no lingering inline styles, kept `will-change: auto`, and kept background bands still.
  - The checked OAuth helper pages did not show star/sparkle markers or old copy such as `授权`, `组织信息`, `已注册应用`, or `继续失败`.
  - `/oauth/consent` desktop normal motion kept entrance targets clean, background bands moved before pause, stayed paused while `document.hidden` was simulated, and moved again after visibility was restored.
  - No browser console warnings or errors were captured by the verification scripts.
- Captured screenshots:
  - `.playwright-mcp-motion-helper-oauth-consent-desktop.png`.
  - `.playwright-mcp-motion-helper-oauth-consent-mobile-reduced.png`.
  - `.playwright-mcp-motion-helper-oauth-select-account-mobile-reduced.png`.
  - `.playwright-mcp-motion-helper-oauth-select-organization-mobile-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Mobile Ambient Band Reduction Evidence

- `MotionStage` now marks secondary `tilt` / `pulse` background bands as `desktopOnly`, rendering them with `hidden lg:block`.
- Mobile viewports keep the core `drift` and `lift` bands so the app still has motion atmosphere, while avoiding extra blurred gradient layers on smaller screens.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3036` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks confirmed:
  - `/` mobile normal motion displayed only `drift` and `lift`; `tilt` and `pulse` were hidden, the visible band still moved, the page stayed within the viewport, and entrance targets had no lingering inline styles or `will-change`.
  - `/` desktop normal motion displayed all four landing bands (`drift`, `lift`, `tilt`, `pulse`), kept entrance targets clean, and preserved the background pause/resume behavior when `document.hidden` was simulated.
  - `/sign-in` and signed-in `/dashboard` mobile reduced motion displayed only `drift` and `lift`, hid `pulse`, kept bands still, kept `html` scroll behavior at `auto`, and had no inline style or `will-change` residue.
  - No browser console warnings or errors were captured by the verification scripts.
- Captured screenshots:
  - `.playwright-mcp-mobile-band-reduction-home.png`.
  - `.playwright-mcp-mobile-band-reduction-home-desktop.png`.
  - `.playwright-mcp-mobile-band-reduction-signin-reduced.png`.
  - `.playwright-mcp-mobile-band-reduction-dashboard-reduced.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Renderable Entrance Target Evidence

- `MotionStage` now filters entrance animation targets through a renderability check before adding them to the GSAP timeline.
- A target is considered renderable only when its computed `display` is not `none`, computed `visibility` is not `hidden`, and `getClientRects().length > 0`.
- This prevents breakpoint-hidden DOM such as the landing desktop navigation on mobile and the auth-shell desktop intro copy on mobile from receiving unnecessary GSAP tweens or inline styles.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3037` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks confirmed:
  - `/` mobile normal motion: the `data-motion-nav` container was `display: none`, its three child links had zero client rects, none received inline GSAP styles, visible entrance targets cleaned back to `will-change: auto`, and the page stayed within the viewport.
  - `/sign-in` mobile normal motion: the hidden desktop intro section was `display: none`, its four motion targets had zero client rects, none received inline styles, visible targets cleaned back to `will-change: auto`, and the page stayed within the viewport.
  - `/` desktop normal motion: the navigation was visible, its child links had client rects, entrance targets cleaned back to `will-change: auto`, and the background band pause/resume behavior still worked.
  - No browser console warnings or errors were captured by the verification scripts.
- Captured screenshots:
  - `.playwright-mcp-renderable-targets-home-mobile.png`.
  - `.playwright-mcp-renderable-targets-signin-mobile.png`.
  - `.playwright-mcp-renderable-targets-home-desktop.png`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 Auth Renderable Coverage Evidence

- Browser MCP verification extended renderable-target coverage to additional auth pages using a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3038` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Mobile normal-motion checks for `/sign-up`, `/forgot-password`, and `/two-factor` confirmed:
  - Each page showed its expected heading copy.
  - The auth-shell desktop intro section was `display: none`.
  - The four hidden desktop motion targets had zero client rects and received no inline GSAP styles.
  - Visible entrance targets cleaned back to `will-change: auto`.
  - Mobile viewports showed only the core `drift` and `lift` background bands, with `pulse` hidden.
  - Page widths stayed within the viewport and no star/sparkle markers appeared.
- Mobile reduced-motion checks for the same routes confirmed:
  - `prefers-reduced-motion: reduce` matched and `html` scroll behavior was `auto`.
  - Visible background bands stayed still.
  - Inline styles stayed empty and computed `will-change` stayed `auto`.
  - No browser console warnings or errors were captured by the verification scripts.
- Captured screenshots:
  - `.playwright-mcp-renderable-auth-sign-up-mobile.png`.
  - `.playwright-mcp-renderable-auth-sign-up-mobile-reduced.png`.
  - `.playwright-mcp-renderable-auth-forgot-password-mobile.png`.
  - `.playwright-mcp-renderable-auth-forgot-password-mobile-reduced.png`.
  - `.playwright-mcp-renderable-auth-two-factor-mobile.png`.
  - `.playwright-mcp-renderable-auth-two-factor-mobile-reduced.png`.

## 2026-06-09 Reset And Verify Renderable Coverage Evidence

- Browser MCP verification extended renderable-target coverage to `/reset-password` and `/verify-email` using a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3039` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Mobile normal-motion checks confirmed:
  - `/reset-password` showed `设置新密码` and `/verify-email` showed `验证邮箱`.
  - The auth-shell desktop intro section was `display: none`.
  - The four hidden desktop motion targets had zero client rects and received no inline GSAP styles.
  - Visible entrance targets cleaned back to `will-change: auto`.
  - Mobile viewports showed only the core `drift` and `lift` background bands, with `pulse` hidden.
  - Page widths stayed within the viewport and no star/sparkle markers appeared.
- Mobile reduced-motion checks for the same routes confirmed:
  - `prefers-reduced-motion: reduce` matched and `html` scroll behavior was `auto`.
  - Visible background bands stayed still.
  - Inline styles stayed empty and computed `will-change` stayed `auto`.
  - No browser console warnings or errors were captured by the verification scripts.
- Captured screenshots:
  - `.playwright-mcp-renderable-auth-extra-reset-password-mobile.png`.
  - `.playwright-mcp-renderable-auth-extra-reset-password-mobile-reduced.png`.
  - `.playwright-mcp-renderable-auth-extra-verify-email-mobile.png`.
  - `.playwright-mcp-renderable-auth-extra-verify-email-mobile-reduced.png`.

## 2026-06-09 No Star Icon Tone Evidence

- User preference was clarified: avoid AI-feeling star/sparkle iconography such as star badges, sparkle glyphs, and similar assistant-like visual motifs.
- `BrandMark` remains a restrained `ShieldCheck` mark so the product reads as account security instead of an AI assistant.
- Source scans confirmed star/sparkle icon imports and glyphs are absent from `src`; the only `StarX` matches are brand/config names, not iconography.
- The landing desktop-only accent band was adjusted from a warm gold highlight to a quieter emerald security tone so it does not read as a sparkle/star accent.
- Validation after this tone pass:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.

## 2026-06-09 AppShell Renderable Coverage Evidence

- Browser MCP verification extended `MotionStage variant="app"` coverage to the protected `/dashboard` and `/admin` pages using a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3040` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Local admin sign-in through `/api/auth/sign-in/email` returned HTTP 200 with the local-only password `Password123!`.
- Mobile normal-motion `/dashboard` checks confirmed:
  - The page showed `账号中心`.
  - Visible entrance targets cleaned back to empty inline styles with computed `will-change: auto`.
  - Mobile viewports showed only the core `drift` and `lift` background bands, with `pulse` hidden.
  - The page stayed within the viewport, and no star/sparkle or AI-marker text/classes appeared.
- Mobile reduced-motion checks for `/dashboard` and `/admin` confirmed:
  - `prefers-reduced-motion: reduce` matched and `html` scroll behavior was `auto`.
  - Visible background bands stayed still across the wait interval.
  - Visible entrance targets had no inline GSAP residue and computed `will-change` stayed `auto`.
  - `/admin` showed `成员管理`, stayed within the viewport, and had no star/sparkle or AI-marker text/classes.
- Desktop normal-motion checks for `/dashboard` and `/admin` confirmed:
  - Visible entrance targets cleaned back to `will-change: auto`.
  - Desktop showed `drift`, `lift`, and `pulse` bands.
  - Simulated `document.hidden` paused the ambient band transform, and restoring visibility resumed it.
  - Both pages stayed within the viewport, and no browser console warnings or errors were captured by the verification script.
- Captured screenshots:
  - `.playwright-mcp-renderable-app-dashboard-mobile.png`.
  - `.playwright-mcp-renderable-app-dashboard-mobile-reduced.png`.
  - `.playwright-mcp-renderable-app-admin-mobile-reduced.png`.
  - `.playwright-mcp-renderable-app-dashboard-desktop.png`.
  - `.playwright-mcp-renderable-app-admin-desktop.png`.
- The temporary 3040 server was stopped after verification; `netstat` confirmed no remaining `LISTENING` entry for port 3040.

## 2026-06-09 Dashboard And Admin Ordinary Copy Evidence

- Dashboard and admin copy was tightened for ordinary users while keeping the existing `MotionStage variant="app"` structure and `data-motion-*` entrance targets intact.
- Dashboard copy changes:
  - `退出` became `退出登录`.
  - `准备开启` became `开始设置`.
  - `已登录的设备` became `其他已登录设备`.
  - `退出其他设备` became `让其他设备退出`.
  - The generic fallback `请求失败。` became `操作没有成功，请稍后再试。`.
- Admin copy changes:
  - `需要管理员权限` became `需要管理员身份`.
  - `暂时不能进入成员管理` became `这个账号还不能管理成员`.
  - `账号权限` became `成员身份`.
  - `刷新` became `刷新列表`.
  - `退出成员其他设备` became `让成员设备退出`.
  - The member-device action now says `让设备退出`, with friendlier success and error messages.
- Source scans confirmed the old phrases above are absent from `src/app/admin`, `src/components/admin`, and `src/components/dashboard`.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3041` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks confirmed:
  - Local admin sign-in returned HTTP 200.
  - `/dashboard` mobile showed `退出登录`, `开始设置`, `其他已登录设备`, and `让其他设备退出`; the old copy did not appear.
  - `/admin` mobile showed `让成员设备退出`, `让设备退出`, `成员身份`, `刷新列表`, and `让异常设备退出`; the old copy did not appear.
  - Both pages stayed within the viewport, visible GSAP entrance targets had no inline style residue and computed `will-change: auto`, and no star/sparkle or AI-marker text/classes appeared.
  - No browser console warnings or errors were captured by the verification script.
- Captured screenshots:
  - `.playwright-mcp-copy-dashboard-ordinary-mobile.png`.
  - `.playwright-mcp-copy-admin-ordinary-mobile.png`.
- The temporary 3041 server was stopped after verification; `netstat` confirmed no remaining `LISTENING` entry for port 3041.

## 2026-06-09 OAuth Ordinary Copy Evidence

- OAuth helper pages were tightened for ordinary users while preserving their existing `AppShell` / `MotionStage variant="app"` structure and `data-motion-*` entrance targets.
- Consent page copy changes:
  - `先看看这个应用想看什么` became `这个应用会看到这些信息`.
  - `确认没问题后再继续；如果不放心，可以先不继续。` became `看清楚后再决定是否继续；不放心时可以先停下。`
  - `它想查看` became `同意后它可以查看`.
  - `确认并继续` became `同意并继续`.
  - Scope copy now uses plainer wording such as `知道这是你的账号`, `保留这次连接，下次少确认一次`, and `查看你的团队名称和身份`.
- Account and team selection copy changes:
  - `处理这次应用访问确认` became `继续连接应用`.
  - The wrong-account hint now says `请先退出登录，再换成正确的账号`.
  - The team step now uses `带上团队`, `如果这次需要带上团队信息，可以继续`, and `带上团队继续`.
- Source scans confirmed old OAuth helper phrases are absent from `src/app/oauth` and `src/components/oauth`, and star/sparkle or AI-marker patterns are absent from those files.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3042` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks confirmed:
  - Local admin sign-in returned HTTP 200.
  - `/oauth/consent` mobile showed the new consent heading, button copy, and scope copy; old consent phrases did not appear.
  - `/oauth/select-account` mobile showed `继续连接应用`, the updated wrong-account hint, and `使用这个账号继续`; old account-selection phrases did not appear.
  - `/oauth/select-organization` mobile showed `带上团队`, the updated team explanation, and `带上团队继续`; old team-selection phrases did not appear.
  - `/oauth/consent` mobile reduced-motion matched `prefers-reduced-motion: reduce`, set `html` scroll behavior to `auto`, and kept visible background bands still across the wait interval.
  - All checked OAuth pages stayed within the viewport, visible GSAP entrance targets had no inline style residue and computed `will-change: auto`, and no star/sparkle or AI-marker text/classes appeared.
  - No browser console warnings or errors were captured by the verification script.
- Captured screenshots:
  - `.playwright-mcp-copy-oauth-consent-ordinary-mobile.png`.
  - `.playwright-mcp-copy-oauth-select-account-ordinary-mobile.png`.
  - `.playwright-mcp-copy-oauth-select-organization-ordinary-mobile.png`.
- The temporary 3042 server was stopped after verification; `netstat` confirmed no remaining `LISTENING` entry for port 3042.

## 2026-06-09 Auth Error Copy Evidence

- Auth form error and loading copy was tightened for ordinary users while preserving the existing `AuthShell` / `MotionStage variant="auth"` structure and `data-motion-*` entrance targets.
- Error and pending copy changes:
  - `登录链接发送失败，请稍后再试。` became `登录邮件没有发送成功，请稍后再试。`
  - `用设备登录失败，请再试一次。` became `当前设备没能完成登录，请再试一次。`
  - The passkey pending button now says `请按提示确认...`.
  - `创建账号失败，请检查信息后重试。` became `账号还没有创建成功，请检查信息后重试。`
  - `找回密码邮件发送失败，请稍后再试。` became `找回密码邮件没有发送成功，请稍后再试。`
  - `6 位数字不正确或已过期，请重试。` became `6 位数字不正确或已过期，请重新输入。`
  - Missing reset-email information now says `这封邮件里的按钮信息不完整，请回到邮件里重新打开。`
- Friendly error mapping changes:
  - Expired token/code errors now say `邮件里的按钮或 6 位数字已过期，请重新获取。`
  - Invalid token errors now say `这封邮件里的按钮已失效，请重新获取一封邮件。`
  - Unsupported passkey errors now avoid `环境` and say `当前浏览器暂不支持用设备登录，可以先使用邮箱和密码登录。`
- Suspense fallback copy now uses `正在打开...` wording for sign-in, sign-up, reset-password, and verify-email pages instead of page-preparation wording.
- Source scans confirmed the replaced old auth phrases are absent from the changed auth files, and star/sparkle or AI-marker patterns are absent from the checked auth pages/components.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3043` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks confirmed:
  - `/sign-in` mobile showed `用当前设备登录` and `发送登录邮件`; replaced old auth phrases did not appear.
  - `/reset-password` mobile without a token showed `这封邮件里的按钮信息不完整，请回到邮件里重新打开。`
  - `/verify-email` mobile showed `验证邮箱` and `重新发送验证邮件`.
  - `/two-factor` mobile showed the expected verification choices.
  - `/sign-in` mobile reduced-motion matched `prefers-reduced-motion: reduce`, set `html` scroll behavior to `auto`, and kept visible background bands still across the wait interval.
  - All checked auth pages stayed within the viewport, visible GSAP entrance targets had no inline style residue and computed `will-change: auto`, and no star/sparkle or AI-marker text/classes appeared.
  - No browser console warnings or errors were captured by the verification script.
- Captured screenshots:
  - `.playwright-mcp-copy-auth-signin-ordinary-mobile.png`.
  - `.playwright-mcp-copy-auth-reset-password-ordinary-mobile.png`.
  - `.playwright-mcp-copy-auth-verify-email-ordinary-mobile.png`.
  - `.playwright-mcp-copy-auth-two-factor-ordinary-mobile.png`.
- The temporary 3043 server was stopped after verification; `netstat` confirmed no remaining `LISTENING` entry for port 3043.

## 2026-06-09 Email Ordinary Copy Evidence

- Auth email templates were tightened for ordinary users while leaving the email sending flow, Resend integration, and local `.local/email-outbox.jsonl` fallback intact.
- Email verification copy changes:
  - `请完成邮箱验证` became `确认你的邮箱`.
  - `完成邮箱验证` became `确认你的邮箱`.
  - `点击下方按钮确认这个邮箱属于你，之后就可以正常登录和使用账号。` became `点击下方按钮确认这是你的邮箱，之后就可以登录账号中心。`
  - `完成验证` became `确认邮箱`.
- Password reset and login email copy changes:
  - The reset email now says `点击下方按钮设置新的登录密码。`
  - `用这封邮件登录 StarX-Oauth` became `继续登录 StarX-Oauth`.
  - The magic-link title now says `继续登录`, and the body uses `完成本次登录` plus a clearer warning not to forward the email.
- 6-digit email copy changes:
  - `你的邮箱确认数字` became `你的邮箱验证数字`.
  - The generic OTP body now says `完成这次操作`.
  - The email-verification OTP body now says `确认邮箱`.
- Team invitation copy changes:
  - `加入团队邀请` became `有人邀请你加入团队`.
  - `查看邀请` became `查看团队邀请`.
  - The body now says to view details before deciding whether to join.
  - The note now says `如果你不认识这个团队，或没有期待这封邀请，可以忽略这封邮件。`
- Email helper copy changes:
  - The plain-text fallback action label changed from `打开邮件按钮` to `打开按钮`.
  - The footer now says `这封邮件是自动发送的，不用回复。` in both text and HTML output.
- Source scans confirmed the replaced old email phrases are absent from `src/lib/auth.ts` and `src/lib/email.ts`. Star/sparkle or AI-marker patterns in these files only matched `StarX` brand/config identifiers, not iconography.
- Validation after these changes:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.
- Static source verification confirmed `sendAuthEmail` still builds both plain-text and HTML output, still writes local email messages when `RESEND_API_KEY` is absent, and still sends through `client.emails.send` when Resend is configured.
- No temporary browser server was started for this pass because the changed surface is the server-side email templates rather than rendered app pages.

## 2026-06-09 Global Coverage Audit

- Current `src/app` page routes:
  - `/`
  - `/admin`
  - `/dashboard`
  - `/forgot-password`
  - `/oauth/consent`
  - `/oauth/select-account`
  - `/oauth/select-organization`
  - `/reset-password`
  - `/reset-password/[token]`
  - `/sign-in`
  - `/sign-up`
  - `/two-factor`
  - `/verify-email`
- Motion wrapper coverage by route family:
  - `/` uses `MotionStage variant="landing"` directly.
  - `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/two-factor`, and `/verify-email` use `AuthShell`, which wraps `MotionStage variant="auth"`.
  - `/dashboard`, `/admin`, `/oauth/consent`, `/oauth/select-account`, and `/oauth/select-organization` use `AppShell`, which wraps `MotionStage variant="app"`.
  - `/reset-password/[token]` is a compatibility redirect into the Better Auth reset-password endpoint; it does not render a visible UI surface.
- Recent browser evidence now covers:
  - Landing page normal desktop/mobile motion, mobile reduced motion, brand icon tone, no star/sparkle markers, no horizontal overflow, and no lingering GSAP inline styles.
  - Branded not-found UI through a real missing route returning HTTP 404, with mobile normal/reduced motion and no default `Not Found` copy.
  - Auth pages `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/two-factor`, and `/verify-email` across mobile normal motion and mobile reduced-motion subsets, including renderable-target filtering and no hidden responsive DOM inline styles.
  - `/reset-password/[token]` through a fresh generated reset email action URL after the latest email-template copy changes.
  - App pages `/dashboard` and `/admin` across mobile normal/reduced motion plus desktop normal motion, including ambient pause/resume through simulated `document.hidden`.
  - OAuth helper pages `/oauth/consent`, `/oauth/select-account`, and `/oauth/select-organization` across mobile normal/reduced motion subsets, including no old protocol-flavored copy and no lingering GSAP inline styles.
  - Server-side email templates through static verification of `sendAuthEmail` text/HTML generation, local outbox fallback, and Resend send path.
- Source scan findings:
  - Product UI scans for star/sparkle/AI-feeling markers continue to show no product iconography or visible UI text using those motifs. Remaining `StarX` matches are brand/config identifiers.
  - Broad technical-term scans still find internal route/query/API names such as `token`, `session`, `callbackURL`, `redirectURI`, OAuth scope names, and Better Auth client method names. These are implementation details in source code and are not treated as visible copy unless a browser check shows them on screen.
  - Visible-copy passes have already replaced the most important user-facing technical terms around authorization, organization, connection keys, login state, reset links, passkeys, sessions, and email delivery.
- Completion-audit follow-up:
  - Screenshot evidence is indexed by `docs/verification-artifacts.md`; physical archive movement is optional and not required for product correctness.
  - Early implementation-note sections still contain historical old terminology as evidence of earlier work. The `Current State Reading Guide` makes that chronology explicit.
  - `2026-06-09 Final Completion Audit` reran the final gates, source scans, browser smoke pass, and temporary-server cleanup.

## 2026-06-09 Reset Token Flow Current Evidence

- Browser MCP verification rechecked the full reset-password email chain after the latest email-template wording changes using a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3044` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- `/forgot-password` mobile normal-motion verification submitted `local-admin@example.com` through the visible form and showed `如果这个邮箱已有账号，我们会发送找回密码邮件。请从邮件里的按钮继续。`
- The generated local outbox entry was the latest `找回你的登录密码` email for `local-admin@example.com` and contained:
  - `title`: `设置新的登录密码`.
  - `body`: `点击下方按钮设置新的登录密码。为了账号安全，建议只在自己的设备上操作。`
  - `actionLabel`: `设置新密码`.
  - `note`: `如果不是你发起的找回密码请求，可以忽略这封邮件。`
  - plain-text footer: `这封邮件是自动发送的，不用回复。`
- Opening the generated reset email action URL redirected through Better Auth to `/reset-password?token=...`.
- `/reset-password?token=...` mobile normal-motion verification confirmed:
  - The page showed `设置新密码` and `保存新密码`.
  - No raw `token`, `Token`, `无效`, `失败`, or `重置链接` text appeared in visible copy.
  - Visible GSAP entrance targets had no inline style residue and computed `will-change: auto`.
  - The page stayed within the viewport, showed only `drift` and `lift` mobile background bands, and had no star/sparkle or AI-marker text/classes.
- Submitting the new password returned to `/sign-in`, where the sign-in page loaded normally and stayed within the viewport.
- `/reset-password` mobile reduced-motion verification confirmed:
  - `prefers-reduced-motion: reduce` matched and `html` scroll behavior was `auto`.
  - Visible background bands stayed still across the wait interval.
  - Visible GSAP entrance targets had no inline style residue and computed `will-change: auto`.
- Captured screenshots:
  - `.playwright-mcp-reset-token-flow-forgot-password-mobile.png`.
  - `.playwright-mcp-reset-token-flow-reset-page-mobile.png`.
  - `.playwright-mcp-reset-token-flow-complete-signin-mobile.png`.
- The temporary 3044 server was stopped after verification; `netstat` confirmed no remaining `LISTENING` entry for port 3044.

## 2026-06-09 Branded Not Found Evidence

- Added `src/app/not-found.tsx` so missing routes render a branded ordinary-user page instead of the default Next not-found UI.
- The new not-found page uses `MotionStage variant="auth"` and existing motion target attributes:
  - `data-motion-brand` for the shared `BrandMark`.
  - `data-motion-scale` for the main surface.
  - `data-motion-primary`, `data-motion-secondary`, and `data-motion-rise` for the page icon, heading, helper copy, and actions.
- Visible copy avoids raw `404`, `Not Found`, and technical error phrasing:
  - `页面找不到`.
  - `这个页面暂时打不开`.
  - `可能是地址写错了，或这个页面已经移动。你可以回到首页，或者进入账号中心继续操作。`
  - `回到首页`.
  - `进入账号中心`.
- The page uses restrained security/navigation icons (`ShieldCheck`, `ArrowLeft`, `LayoutDashboard`) and no star/sparkle or AI-assistant motifs.
- Source scan confirmed `Sparkles`, `StarIcon`, star/sparkle glyphs, AI markers, raw `404`, `not found`, `Not Found`, `错误`, `失败`, `token`, and `session` are absent from `src/app/not-found.tsx`.
- Validation after adding the page:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table still includes `/_not-found`.
- Browser MCP verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3045` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Runtime checks on `/missing-page-for-visual-check` confirmed:
  - The document response status was HTTP 404, as expected for a missing route.
  - The custom page showed the branded heading, helper copy, home action, and account-center action.
  - Visible copy did not contain raw `404`, `not found`, `Not Found`, `错误`, `失败`, `token`, or `session`.
  - Visible GSAP entrance targets had no inline style residue and computed `will-change: auto`.
  - Mobile normal motion showed only `drift` and `lift` background bands, with `pulse` hidden.
  - Mobile reduced-motion matched `prefers-reduced-motion: reduce`, set `html` scroll behavior to `auto`, and kept visible background bands still across the wait interval.
  - The page stayed within the viewport and had no star/sparkle or AI-marker text/classes.
  - Browser console collected expected `Failed to load resource: ... 404 (Not Found)` entries for the missing document request; no `pageerror` was captured by the verification script.
- Captured screenshot:
  - `.playwright-mcp-not-found-branded-mobile.png`.
- The temporary 3045 server was stopped after verification; `netstat` confirmed no remaining `LISTENING` entry for port 3045.

## 2026-06-09 README Ordinary Copy Refresh

- Refreshed `README.md` so the project overview is easier for ordinary users and non-protocol readers to scan.
- The former English-heavy technical bullets now use Chinese product language:
  - account login, email verification, device login, extra login confirmation, and account sessions are described as Better Auth responsibilities.
  - OAuth helper routes are described as application access confirmation, account selection, and team information confirmation.
  - integration-facing API-key behavior is described as server-side tool connection capability, while the interface keeps the user-facing term `连接码`.
- Local setup, environment, scripts, key routes, and production notes headings were localized to `本地启动`, `环境变量`, `常用命令`, `主要页面和接口`, and `上线前检查`.
- Production guidance now says connection codes, third-party login secrets, and server-side secrets should stay server-side, avoiding raw `API key` / `OAuth client secret` phrasing in the main Chinese prose.
- Historical implementation-note sections still contain earlier terminology as evidence of previous passes; current README and product source are the authoritative copy surfaces for this pass.
- Validation after the README refresh:
  - Source/README scan found no `Sparkles`, `Sparkle`, star/sparkle glyphs, or AI-feeling star markers in `src` or `README.md`.
  - README scan found no old English technical phrases such as `magic-link`, `passkeys`, `TOTP`, `email OTP`, `multi-session`, `OAuth provider`, `Bearer`, `JWT`, `API key`, `Local Setup`, `Environment`, `Production Notes`, `team-information`, `authorization`, or `organization`. The only remaining OAuth match is the literal route path `/oauth/...`.
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed; production route table includes `/`, `/_not-found`, `/dashboard`, `/admin`, auth routes, and OAuth helper routes.

## 2026-06-09 Current Browser Smoke Audit

- Browser smoke verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3046` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Mobile normal-motion checks at `390x844` covered `/`, `/sign-in`, signed-in `/dashboard`, signed-in `/admin`, `/oauth/consent?client_id=demo-app&scope=openid%20profile%20email%20offline_access%20read:organization`, and a missing route.
- The checked mobile pages:
  - showed current ordinary-user copy such as `一个更容易用的账号中心。`, `发送登录邮件`, `连接自己的工具`, `创建连接码`, `成员管理`, `让成员设备退出`, `这个应用会看到这些信息`, `同意并继续`, `先不继续`, `页面找不到`, and `这个页面暂时打不开`.
  - did not show old or overly technical visible markers such as star/sparkle glyphs, `Sparkles`, `连接密钥`, `工具连接密钥`, `应用访问密钥`, `授权应用`, `管理后台`, `TOTP`, `2FA`, `OTP`, `JWT`, `API key`, or `Bearer` on the checked pages.
  - rendered SVG classes as account/security/navigation icons, with no `spark` or `star` SVG classes.
  - stayed within the viewport and showed no page-level horizontal overflow.
  - had no lingering inline styles or non-auto `will-change` on visible GSAP entrance targets after entrance motion completed.
  - showed only the lightweight mobile `drift` and `lift` background bands in normal motion.
- Mobile reduced-motion checks covered `/`, signed-in `/dashboard`, and a missing route:
  - `prefers-reduced-motion: reduce` matched.
  - `html` scroll behavior was `auto`.
  - visible background bands stayed still across the wait interval.
  - visible entrance targets and background bands had no inline-style residue and computed `will-change: auto`.
- Desktop normal-motion checks at `1440x900` covered `/` and signed-in `/dashboard`:
  - both pages showed expected ordinary-user copy and no star/sparkle markers.
  - `/` showed desktop background motions `drift`, `lift`, `tilt`, and `pulse`; `/dashboard` showed `drift`, `lift`, and `pulse`.
  - background bands used expected transform/opacity `will-change` during ambient motion.
  - a longer post-animation recheck on `/` confirmed visible entrance targets had no inline-style residue after the full staggered entrance completed.
- Same-origin sign-in through `/api/auth/sign-in/email` returned HTTP 200 for `local-admin@example.com`; the session user had role `admin` and id `starx-dev-admin`, enabling protected dashboard/admin smoke coverage.
- Browser console only contained expected missing-route resource 404 entries from the custom not-found smoke paths.
- The temporary 3046 server was stopped after verification; `netstat` confirmed no remaining `LISTENING` entry for port 3046.

## 2026-06-09 Verification Artifact Manifest

- Added `docs/verification-artifacts.md` to make the accumulated Playwright evidence easier to review without deleting screenshots.
- Inventory at the time of writing:
  - 102 root-level `.playwright-mcp-*.png` screenshots.
  - 15 early `.playwright-cli/*.png` screenshots.
- The manifest marks the latest representative keep set for:
  - brand/no-star visual checks.
  - auth copy and reset-token flow.
  - account center and member management.
  - OAuth helper pages.
  - GSAP timeline, reduced-motion, renderable-target, and mobile-band checks.
  - branded not-found page.
- The manifest also names lower-priority archive candidates, including early CLI screenshots, intermediate motion-fix screenshots, and older connection-key / OAuth-scope screenshots superseded by later ordinary-copy evidence.
- No screenshot files were deleted or moved in this pass. If physical cleanup is requested later, archive candidates should be moved into a dated archive folder rather than removed.

## 2026-06-09 Final Completion Audit

- Objective coverage interpreted for this repository:
  - `gsap-core`: current motion implementation must use GSAP core patterns correctly, including `matchMedia`, transform/opacity entrance motion, reduced-motion handling, and cleanup.
  - `@电脑`, `@chrome`, `@浏览器`: current UI must be verified in a desktop browser and representative browser viewports. The available browser automation is Playwright/Chromium-class browser execution rather than a separate Chrome plugin.
  - `@latex`: current repository must be checked for local LaTeX deliverables. No `.tex`, `.latex`, or `.bib` files exist under the app workspace, so there is no LaTeX artifact to compile or optimize in this project state.
  - `全局优化`: current page families, brand direction, ordinary-user wording, motion behavior, reduced motion, and evidence documentation must be covered by current source scans, quality gates, and browser smoke checks.
- Source and repository scans:
  - `rg --files -g '*.tex' -g '*.latex' -g '*.bib' -g '!node_modules' -g '!.next'`: no matches, confirming no local LaTeX source artifacts.
  - Star/sparkle/AI-feeling marker scan across `src`, `README.md`, and `docs/verification-artifacts.md` found no `Sparkles`, `Sparkle`, star/sparkle glyphs, or similar product-UI markers.
  - Old visible-copy scan across `src` and `README.md` found no current UI/README matches for old terms such as `连接密钥`, `工具连接密钥`, `应用访问密钥`, `授权应用`, `管理后台`, `访问受限`, `登录状态已失效`, `重置登录状态`, `组织信息`, `组织授权`, `继续授权`, `已注册应用`, `暂无请求`, `继续失败`, `TOTP`, `2FA`, `JWT`, `API key`, or `Bearer`.
  - The only scan matches for `OTP` were internal Better Auth identifiers in `src/lib/auth-client.ts` and `src/lib/auth.ts` (`emailOTPClient`, `emailOTP`, `sendVerificationOTP`, `sendOTP`), not visible copy.
  - Motion-source scan confirmed `src/components/motion/motion-stage.tsx` contains `gsap.matchMedia`, `prefers-reduced-motion`, `requestAnimationFrame`, `clearProps`, `willChange`, `data-motion-band`, and `visibilitychange` handling.
- Quality gates:
  - `npm run lint`: passed.
  - `npm run typecheck`: passed.
  - `npm run build`: passed.
  - The production build route table includes `/`, `/_not-found`, `/admin`, `/api/auth/[...all]`, `/dashboard`, `/forgot-password`, `/oauth/consent`, `/oauth/select-account`, `/oauth/select-organization`, `/reset-password`, `/reset-password/[token]`, `/sign-in`, `/sign-up`, `/two-factor`, and `/verify-email`.
- Browser smoke verification used a temporary `next start` server with `BETTER_AUTH_URL=http://localhost:3047` and `STARX_DEV_ADMIN_EMAIL=local-admin@example.com`.
- Desktop normal-motion browser checks at `1440x900` covered:
  - `/`
  - `/sign-in`
  - signed-in `/dashboard`
  - signed-in `/admin`
  - signed-in `/oauth/consent?client_id=demo-app&scope=openid%20profile%20email%20offline_access%20read:organization`
  - `/missing-final-smoke-20260609`
- Mobile normal-motion browser checks at `390x844` covered:
  - `/`
  - signed-in `/dashboard`
  - signed-in `/oauth/select-organization?code=test-code`
- Mobile reduced-motion browser checks covered:
  - `/`
  - signed-in `/dashboard`
  - `/missing-final-reduced-20260609`
- Browser checks confirmed:
  - Expected current visible copy was present on every checked page.
  - No visible old-copy markers or star/sparkle markers were found on checked pages.
  - No SVG class contained `spark` or `star`.
  - Visible GSAP entrance targets had no inline-style residue and computed `will-change: auto` after the entrance sequence completed.
  - Desktop normal motion showed the expected background-band set (`drift`, `lift`, plus desktop-only `tilt`/`pulse` depending on variant).
  - Mobile normal motion showed only the lightweight `drift` and `lift` bands.
  - In reduced motion, `prefers-reduced-motion: reduce` matched, `html` scroll behavior was `auto`, visible bands stayed still across the wait interval, and band/entrance targets had no inline-style residue.
  - Page widths stayed within the viewport; observed overflow deltas were `0` or negative scrollbar-adjusted values.
  - No `pageerror` or unexpected console error was captured. Console output only contained expected resource 404 entries for the deliberate missing-route smoke paths.
- The temporary 3047 server was stopped after verification; `netstat` confirmed no remaining `LISTENING` entry for port 3047.

## 2026-06-10 Production And Governance Completion

- Added a shared auth options factory in `src/lib/auth-options.ts` so runtime auth setup and maintenance scripts use the same Better Auth plugin configuration.
- Added production database maintenance scripts:
  - `npm run db:migration` generates a reviewed SQL migration from Better Auth's current schema and the configured `DATABASE_URL`.
  - `npm run db:migration:apply` applies the reviewed migration to the target PostgreSQL database.
  - `npm run db:seed-admin` creates or updates the first production admin from explicit `STARX_FIRST_ADMIN_*` variables.
- Added `.env.example` so local, production, local-admin seed, and production first-admin seed variables are discoverable.
- Added `/applications` for signed-in users to register and manage application access entries:
  - create a client with name, homepage, callback URLs, scope, type, and secret handling mode.
  - list current applications.
  - update callback URLs and basic metadata.
  - rotate the application secret and display it once.
  - remove an application that should no longer connect.
- Extended `/dashboard` connection-code management:
  - create connection codes with a selected lifetime.
  - list existing connection codes.
  - show status, expiration, last request time, and request count.
  - pause/re-enable, extend by 90 days, or revoke a code.
- Added Playwright regression coverage through `npm run test:e2e`:
  - public-page current copy checks for `/`, `/sign-up`, `/verify-email`, and token-state `/verify-email`.
  - no old email-confirmation wording, no old technical labels, no star/spark icon markers, no horizontal overflow, and no framework overlay.
  - mobile reduced-motion background stability.
  - signed-in connection-code creation and application registration smoke flows using the local memory admin seed.
- Archived old root-level Playwright screenshots and temporary logs to `docs/verification-archive/2026-06-10/`, then ignored that archive path plus future Playwright reports, screenshots, test results, and temporary logs.

## 2026-06-10 Production Runbook And Connection-Code Monitoring

- Added `docs/production-runbook.md` with target-agnostic production procedures for required secrets, PostgreSQL backups, restore drills, migration review/application, migration rollback, first-admin seeding, connection-code monitoring, and release verification.
- Added `npm run monitor:connection-codes`, a read-only PostgreSQL monitor that reports connection-code health as JSON and returns a non-zero exit code when alertable conditions are found.
- The monitor uses Better Auth's existing connection-code fields: `expiresAt`, `enabled`, `lastRequest`, `requestCount`, `rateLimitEnabled`, and `rateLimitMax`.
- Default alert thresholds are now documented and discoverable in `.env.example`:
  - `STARX_CONNECTION_CODE_EXPIRY_WARN_DAYS=14`
  - `STARX_CONNECTION_CODE_STALE_DAYS=90`
  - `STARX_CONNECTION_CODE_HIGH_USAGE_RATIO=0.8`
- `README.md` now links the production runbook and includes the connection-code monitor in the common command list and pre-launch checks.

## 2026-06-10 Better Auth Warning Cleanup

- Social providers are now marked `enabled: false` unless their required client ID and client secret are configured, so local builds and e2e runs no longer log missing-provider warnings for Google, GitHub, Discord, or Microsoft.
- Account-linking trusted providers are now derived from the configured social providers plus `email-password`, matching the runtime provider set.
- Added `/.well-known/oauth-authorization-server/api/auth` through Better Auth OAuth provider's metadata helper, then set `silenceWarnings.oauthAuthServerConfig` for the confirmed route.
- A production `next start` check on port `3051` returned HTTP 200 JSON for `/.well-known/oauth-authorization-server/api/auth`, with `issuer` and `authorization_endpoint` present; the temporary server was stopped afterward.
- `npm run test:e2e` passed without the previous Better Auth local warning lines.

## 2026-06-10 OpenID Discovery Completion

- Verified the existing Better Auth catch-all already serves `/api/auth/.well-known/openid-configuration`.
- Added the root-level `/.well-known/openid-configuration` route with Better Auth OAuth provider's metadata helper so common OpenID clients can discover the provider from the public origin as well.
- Updated `README.md` to list both OAuth authorization-server metadata and OpenID discovery metadata routes.
- A production `next start` check on port `3053` returned HTTP 200 JSON for `/.well-known/oauth-authorization-server/api/auth`, `/.well-known/openid-configuration`, and `/api/auth/.well-known/openid-configuration`; all three responses included `issuer`, `authorization_endpoint`, and `jwks_uri`. The temporary server was stopped afterward.
- Playwright metadata regression now asserts the Better Auth default issuer contract: `issuer` is `${BETTER_AUTH_URL}/api/auth`, while `authorization_endpoint` and `jwks_uri` are under the same `/api/auth` base path.

## 2026-06-10 Release Review Preparation

- Added `docs/release-review.md` as a reviewer-facing release draft.
- The draft groups the current work into suggested commit slices, proposes a PR title and summary, lists reviewer focus areas, records automated verification commands, and calls out manual production follow-ups for database migration, first-admin seeding, connection-code monitoring, email delivery, social login, and deployed OAuth/OpenID metadata.

## 2026-06-11 Home Shell Refresh

- Rebuilt `src/app/page.tsx` after the home route file had been removed, and moved the page back onto the same visual system as the current auth shell.
- The landing page now reuses the existing public-app primitives:
  - `auth-canvas` for the shared black/blue background treatment.
  - `DotField` plus landing `MotionStage` for the current motion language.
  - `BrandMark`, shared CTA buttons, and ordinary-user capability copy.
- The desktop home layout is now an open two-column composition instead of the older thick framed panel, so it no longer feels like a separate product surface next to `/sign-in`.
- Added `home-dot-field` and `home-cubes` global styles so the background stays visible while remaining behind the content layer.
- Mobile header layout now keeps only the brand and `登录账号` button in the first row; desktop-only navigation prevents the old stacked mobile header from pushing the hero below the fold.
- Added `playwright-report/**` and `test-results/**` to ESLint global ignores so local Playwright artifacts do not create lint noise after preview verification.
- Local preview verification on `http://127.0.0.1:3000/` captured:
  - desktop screenshot: `D:/qwq/项目/auth-star/home-preview-desktop-20260611.png`
  - mobile screenshot: `D:/qwq/项目/auth-star/home-preview-mobile-20260611.png`
- Validation after the refresh:
  - `npm run typecheck`: passed.
  - `npx playwright test tests/e2e/smoke.spec.ts --grep "public smoke regression"`: passed.
  - `npm run lint`: passed before Playwright, then the ignore list was expanded so the same check stays stable when Playwright writes `test-results/`.

## 2026-06-15 Production Deployment To auth.star-web.top

- Deployed the current app build to `186.241.74.3` under `/www/wwwroot/auth.star-web.top`.
- Confirmed the server had two Nginx installations:
  - Baota-managed binary at `/www/server/nginx/sbin/nginx`
  - public system Nginx at `/usr/sbin/nginx`
- Public traffic for `auth.star-web.top` was not using the Baota site config. The live domain was fixed by adding a dedicated system Nginx vhost at `/etc/nginx/conf.d/auth.star-web.top.conf`.
- The server default Node runtime was `v18.19.1`, which cannot build `next@16.2.7`. Installed an app-local Node runtime at `/opt/node-v20.19.0-linux-x64` and used it for `npm ci`, `npm run build`, and service startup.
- Added a persistent `systemd` service:
  - unit: `/etc/systemd/system/starx-oauth.service`
  - app port: `127.0.0.1:3002`
  - start command: `node .../next/dist/bin/next start -p 3002 -H 127.0.0.1`
- Issued a Let's Encrypt certificate with Certbot for `auth.star-web.top`.
  - certificate path: `/etc/letsencrypt/live/auth.star-web.top/fullchain.pem`
  - observed expiry: `2026-09-13`
- Public verification on `2026-06-15` confirmed:
  - `https://auth.star-web.top/` returned the `StarX-Oauth` home page
  - `https://auth.star-web.top/sign-in` returned HTTP 200 and the current sign-in shell
  - `https://auth.star-web.top/.well-known/openid-configuration` returned JSON with issuer `https://auth.star-web.top/api/auth`
- Production caveat still open after deployment:
  - `RESEND_API_KEY` is empty, so auth emails still fall back to local logging instead of real outbound delivery
  - the old manual `PORT=3001 npm start` process was still present during deployment cleanup and should be removed once the `systemd` service is confirmed as the only required runtime

## 2026-06-15 Mobile Auth Layout Stabilization

- Tightened the auth shell for short mobile viewports after `/sign-in` and `/sign-up` could appear to "lose" UI when the visual cubes block pushed the form too far down.
- Updated `src/components/auth/auth-shell.tsx` so the mobile auth layout uses a natural vertical stack with a much shorter visual section, while desktop keeps the existing two-column composition.
- Updated `src/app/globals.css` so mobile auth screens scroll vertically instead of clipping inside `main.auth-canvas`, and reduced the mobile cube footprint/opacities on narrow short screens.
- Added Playwright short-viewport coverage in `tests/e2e/auth-shell.spec.ts` for `/sign-in` and `/sign-up` at `390x600`, asserting that sign-in keeps the primary action visible and sign-up can scroll to the submit/footer region.
- Added Playwright short-viewport coverage in `tests/e2e/smoke.spec.ts` for `/` at `390x600`, asserting that the home hero headline and both primary CTAs remain visible before the deeper capability section.
- Updated `src/app/page.tsx` so the home hero and feature column top-align on desktop instead of vertically centering against the taller capability grid, preventing the left-side headline and CTA from dropping below the first viewport.
- Added Playwright desktop fold coverage in `tests/e2e/smoke.spec.ts` for `/`, asserting that the home hero title and primary CTA stay above the fold on the default desktop viewport.
- Verified locally on `http://127.0.0.1:3000` with the in-app browser:
  - `/sign-in` at `390x600`: primary submit button visible in the initial viewport, document remains scrollable for the footer links.
  - `/sign-up` at `390x600`: page scroll reaches the submit button and footer without content disappearing.
  - `/` at `390x600`: hero headline and both primary CTAs remain visible in the initial viewport.
  - `/` at the default desktop viewport: hero headline and primary CTA remain visible in the first viewport instead of dropping below the fold.
  - `/sign-in` at `1280x720`: desktop two-column layout still renders normally.
