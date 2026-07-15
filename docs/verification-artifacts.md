# X-Oauth Verification Artifacts

This file is a current-state map for local verification artifacts. It does not delete or move any screenshots; it only explains which files are most useful for final review.

## Current Snapshot Inventory

- Current screenshots: stored in `.playwright-cli/` directory
- Verification archive: cleaned and ignored by git (`verification-archive/`)
- Test results: stored in `test-results/` directory, ignored by git

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test
npx playwright test tests/e2e/smoke.spec.ts
```

## Test Coverage

The Playwright test suite covers:

1. **Public Smoke Tests**
   - Landing page copy, layout, and branding
   - Sign-up page
   - Email verification pages
   - Mobile viewport hero visibility
   - Reduced-motion background behavior

2. **OAuth Metadata Tests**
   - OAuth Authorization Server metadata endpoint
   - OpenID Discovery endpoint
   - Metadata content validation

3. **Signed-in Management Tests**
   - Connection code creation, pause, resume, and revoke
   - Application integration creation, secret rotation, and removal

## Adding New Tests

1. Add test files to `tests/e2e/`
2. Use the `signInAdmin()` helper for authenticated tests
3. Follow the existing patterns for copy validation, layout checks, and reduced-motion tests

## Representative Keep Set

Use these screenshots first when reviewing the current product state.

### Global And Brand

- `.playwright-mcp-brand-icon-no-star-home-desktop.png` — desktop brand mark without star/sparkle styling.
- `.playwright-mcp-brand-icon-no-star-home-mobile.png` — mobile brand mark without star/sparkle styling.
- `.playwright-mcp-renderable-targets-home-desktop.png` — desktop landing motion targets and layout.
- `.playwright-mcp-renderable-targets-home-mobile.png` — mobile landing motion targets and layout.
- `.playwright-mcp-renderable-targets-signin-mobile.png` — mobile sign-in motion targets.

### Auth

- `.playwright-mcp-copy-auth-signin-ordinary-mobile.png` — current sign-in copy.
- `.playwright-mcp-copy-auth-reset-password-ordinary-mobile.png` — current reset-password copy.
- `.playwright-mcp-copy-auth-verify-email-ordinary-mobile.png` — current verify-email copy.
- `.playwright-mcp-copy-auth-two-factor-ordinary-mobile.png` — current extra-login-confirmation copy.
- `.playwright-mcp-reset-token-flow-forgot-password-mobile.png` — reset email request path.
- `.playwright-mcp-reset-token-flow-reset-page-mobile.png` — reset-token landing page.
- `.playwright-mcp-reset-token-flow-complete-signin-mobile.png` — reset flow completion back to sign-in.

### Account And Member Management

- `.playwright-mcp-copy-dashboard-ordinary-mobile.png` — current account-center copy.
- `.playwright-mcp-copy-admin-ordinary-mobile.png` — current member-management copy.
- `.playwright-mcp-renderable-app-dashboard-mobile.png` — signed-in dashboard mobile normal motion.
- `.playwright-mcp-renderable-app-dashboard-mobile-reduced.png` — signed-in dashboard mobile reduced motion.
- `.playwright-mcp-renderable-app-dashboard-desktop.png` — signed-in dashboard desktop normal motion.
- `.playwright-mcp-renderable-app-admin-mobile-reduced.png` — signed-in member-management mobile reduced motion.
- `.playwright-mcp-renderable-app-admin-desktop.png` — signed-in member-management desktop normal motion.

### OAuth Helper Pages

- `.playwright-mcp-copy-oauth-consent-ordinary-mobile.png` — current application-access confirmation copy.
- `.playwright-mcp-copy-oauth-select-account-ordinary-mobile.png` — current account confirmation copy.
- `.playwright-mcp-copy-oauth-select-organization-ordinary-mobile.png` — current team-information confirmation copy.
- `.playwright-mcp-motion-helper-oauth-consent-desktop.png` — desktop OAuth helper motion/layout.
- `.playwright-mcp-motion-helper-oauth-consent-mobile-reduced.png` — mobile reduced-motion OAuth consent.
- `.playwright-mcp-motion-helper-oauth-select-account-mobile-reduced.png` — mobile reduced-motion account helper.
- `.playwright-mcp-motion-helper-oauth-select-organization-mobile-reduced.png` — mobile reduced-motion team helper.

### Motion System

- `.playwright-mcp-motion-timeline-home-desktop.png` — desktop landing timeline.
- `.playwright-mcp-motion-timeline-signin-desktop.png` — desktop sign-in timeline.
- `.playwright-mcp-motion-timeline-dashboard-reduced-mobile.png` — reduced-motion dashboard timeline behavior.
- `.playwright-mcp-mobile-band-reduction-home.png` — mobile landing background bands.
- `.playwright-mcp-mobile-band-reduction-home-desktop.png` — desktop landing background bands.
- `.playwright-mcp-mobile-band-reduction-signin-reduced.png` — reduced-motion auth background.
- `.playwright-mcp-mobile-band-reduction-dashboard-reduced.png` — reduced-motion app background.

### Branded Not Found

- `.playwright-mcp-not-found-branded-mobile.png` — current custom not-found page.

## Archive Candidates

These files are still useful for historical debugging, but they are lower priority for a final product review because newer screenshots cover the same surfaces with fresher copy and motion behavior.

- Early `.playwright-cli/page-*.png` files.
- Screenshots with old naming such as `connection-key`, `dashboard-connection-key`, or `oauth-scope-copy`.
- Intermediate motion-fix screenshots such as `motion-desktop-normal-check`, `motion-desktop-normal-fixed`, `motion-reduced-dashboard-clean`, and `motion-will-change-reduced-dashboard`.
- Intermediate copy passes that are superseded by the later `copy-*ordinary*`, `renderable-*`, `reset-token-flow-*`, and `not-found-branded-*` screenshots.

## Cleanup Policy

- Do not delete screenshots automatically during optimization work.
- If physical cleanup is requested, move archive candidates into a dated archive folder instead of deleting them.
- After any cleanup, rerun the final audit gates: `npm run lint`, `npm run typecheck`, `npm run build`, source scans, and at least one browser smoke pass.
- New local screenshots, Playwright reports, test results, and temporary logs are ignored by `.gitignore`; keep durable evidence in this manifest or a reviewed docs file instead of committing raw test artifacts.
