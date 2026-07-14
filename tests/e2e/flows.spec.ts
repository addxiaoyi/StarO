import { expect, test, type Page } from "@playwright/test";

// Generate unique email for each test run
const testEmail = () => `e2e-test-${Date.now()}@test.example.com`;

async function signOut(page: Page) {
  await page.goto("/dashboard");
  const signOutButton = page.getByRole("button", { name: "退出账号" });
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    await expect(page).toHaveURL(/\/sign-in/);
  }
}

async function signIn(page: Page, email: string, password: string = "Password123!") {
  await page.goto("/sign-in");
  await page.getByLabel("邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录" }).click();
}

async function expectRenderablePage(page: Page) {
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page.locator("nextjs-portal")).toHaveCount(0);
}

test.describe("registration flow", () => {
  test("completes email/password registration with verification", async ({ page }) => {
    const email = testEmail();
    const name = "E2E 测试用户";
    const password = "TestPass123!";

    // Navigate to sign-up
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: "创建账号" })).toBeVisible();
    await expectRenderablePage(page);

    // Fill registration form
    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("姓名").fill(name);
    await page.getByLabel("密码").fill(password);
    await page.getByLabel("确认密码").fill(password);
    await page.getByRole("button", { name: "创建账号" }).click();

    // Expect success message
    await expect(page.getByText(/账号已创建|已发送验证邮件/)).toBeVisible({ timeout: 10000 });

    // Note: In memory DB, we can directly sign in without email verification
    // This tests the flow when auto-sign-in after verification is enabled
    await page.goto("/sign-in");
    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("密码").fill(password);
    await page.getByRole("button", { name: "登录" }).click();

    // Should either go to dashboard or need email verification
    const url = page.url();
    expect(url.includes("/dashboard") || url.includes("/verify-email")).toBeTruthy();
  });

  test("validates password confirmation mismatch", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("邮箱").fill(testEmail());
    await page.getByLabel("姓名").fill("Test User");
    await page.getByLabel("密码").fill("Password123!");
    await page.getByLabel("确认密码").fill("DifferentPass123!");
    await page.getByRole("button", { name: "创建账号" }).click();

    // Should show error
    await expect(page.getByText(/不匹配|不一致|错误/)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("sign-in flow", () => {
  test("signs in with seeded admin account", async ({ page }) => {
    await signIn(page, "local-admin@example.com", "Password123!");

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
    await expect(page.getByText(/账号中心|已登录|欢迎/)).toBeVisible({ timeout: 5000 });
    await expectRenderablePage(page);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("邮箱").fill("nonexistent@example.com");
    await page.getByLabel("密码").fill("WrongPassword123!");
    await page.getByRole("button", { name: "登录" }).click();

    // Should show error message
    await expect(page.getByText(/不正确|失败|错误|无效/).first()).toBeVisible({ timeout: 10000 });
  });

  test("supports passwordless email login", async ({ page }) => {
    await page.goto("/sign-in");

    // Click on email login option
    const emailLoginButton = page.getByRole("button", { name: /邮件登录|发送登录邮件/ });
    if (await emailLoginButton.isVisible()) {
      await page.getByLabel("邮箱").fill("local-admin@example.com");
      await emailLoginButton.click();

      // Should show success message about email sent
      await expect(page.getByText(/已发送|邮件|登录/)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("password reset flow", () => {
  test("requests password reset for existing user", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "找回登录密码" })).toBeVisible();
    await expectRenderablePage(page);

    // Request reset for admin email
    await page.getByLabel("邮箱").fill("local-admin@example.com");
    await page.getByRole("button", { name: "发送" }).click();

    // Should show confirmation (even if email won't actually send in test)
    await expect(page.getByText(/已发送|会发送|已收到/).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("dashboard features", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, "local-admin@example.com", "Password123!");
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 });
  });

  test("displays user account information", async ({ page }) => {
    // Check for user email or name in dashboard
    await expect(page.getByText(/local-admin@example.com|本地管理员/)).toBeVisible({ timeout: 5000 });
  });

  test("shows device verification section", async ({ page }) => {
    // Check for device/login related sections
    await expect(page.getByText(/设备|登录|已登录/).first()).toBeVisible({ timeout: 5000 });
  });

  test("shows connection codes section", async ({ page }) => {
    await expect(page.getByText(/连接码|工具|创建/).first()).toBeVisible({ timeout: 5000 });
  });

  test("signs out successfully", async ({ page }) => {
    const signOutButton = page.getByRole("button", { name: "退出账号" });
    await expect(signOutButton).toBeVisible();
    await signOutButton.click();

    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });
    await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
  });
});

test.describe("admin panel", () => {
  test("admin can access member management", async ({ page }) => {
    await signIn(page, "local-admin@example.com", "Password123!");
    await page.goto("/admin");

    // Admin should see member management
    await expect(page.getByText(/成员管理|管理后台|添加成员/).first()).toBeVisible({ timeout: 10000 });
    await expectRenderablePage(page);
  });

  test("non-admin is blocked from admin panel", async ({ page }) => {
    // Sign in as regular user (create one first)
    const email = testEmail();
    await page.goto("/sign-up");
    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("姓名").fill("Regular User");
    await page.getByLabel("密码").fill("Password123!");
    await page.getByLabel("确认密码").fill("Password123!");
    await page.getByRole("button", { name: "创建账号" }).click();

    // Wait for registration
    await page.waitForTimeout(2000);

    // Navigate to admin (might need email verification in real scenario)
    await page.goto("/admin");

    // Non-admin should see access denied or be redirected
    const url = page.url();
    // Either shows restricted access or redirects to sign-in/dashboard
    expect(
      url.includes("/sign-in") ||
      url.includes("/dashboard") ||
      await page.getByText(/无权|受限|不能进入/).first().isVisible().catch(() => false)
    ).toBeTruthy();
  });
});

test.describe("health check endpoint", () => {
  test("returns healthy status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("starx-oauth");
    expect(data.uptime).toBeGreaterThan(0);
  });
});

test.describe("OAuth consent flow", () => {
  test("shows empty state when no pending authorization", async ({ page }) => {
    await signIn(page, "local-admin@example.com", "Password123!");
    await page.goto("/oauth/consent");

    // Should show empty state
    await expect(page.getByText(/没有|无需|现在没有/).first()).toBeVisible({ timeout: 5000 });
    await expectRenderablePage(page);
  });
});

test.describe("mobile responsiveness", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("dashboard is usable on mobile", async ({ page }) => {
    await signIn(page, "local-admin@example.com", "Password123!");
    await expect(page).toHaveURL(/\/dashboard$/);

    // Check no horizontal overflow
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // Navigation should be scrollable
    const nav = page.locator("nav, header, .auth-nav").first();
    if (await nav.isVisible()) {
      expect(await nav.evaluate((el) => el.scrollWidth > el.clientWidth)).toBeFalsy();
    }
  });

  test("sign-in form is fully usable on mobile", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByLabel("邮箱")).toBeVisible();
    await expect(page.getByLabel("密码")).toBeVisible();
    await expect(page.getByRole("button", { name: /登录/ })).toBeVisible();

    // Check all form elements are within viewport
    const emailField = page.getByLabel("邮箱");
    const submitButton = page.getByRole("button", { name: /登录/ });

    const emailBounds = await emailField.boundingBox();
    const submitBounds = await submitButton.boundingBox();

    if (emailBounds) expect(emailBounds.y + emailBounds.height).toBeLessThanOrEqual(844);
    if (submitBounds) expect(submitBounds.y + submitBounds.height).toBeLessThanOrEqual(844);
  });
});
