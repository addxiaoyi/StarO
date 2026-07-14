import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3050);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      BETTER_AUTH_SECRET: "starx-oauth-playwright-secret-0000000000000000",
      BETTER_AUTH_URL: baseURL,
      DATABASE_URL: "",
      STARX_DEV_ADMIN_EMAIL: "local-admin@example.com",
      STARX_DEV_ADMIN_NAME: "本地管理员",
      STARX_USE_MEMORY_DB: "true",
    },
  },
});
