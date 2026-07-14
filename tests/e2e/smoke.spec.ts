import { expect, test, type Page } from "@playwright/test";

const oldEmailCopy = ["验证邮箱", "验证邮件", "验证按钮"];
const oldTechnicalCopy = ["连接密钥", "工具连接密钥", "应用访问密钥", "授权应用", "管理后台", "TOTP", "2FA", "JWT", "API key", "Bearer"];
const starMarkers = ["Sparkles", "Sparkle", "⭐", "✦", "✧", "★", "☆", "星星", "闪光"];

async function visibleText(page: Page) {
  return page.locator("body").innerText();
}

async function expectNoOldMarkers(page: Page, extraMarkers: string[] = []) {
  const text = await visibleText(page);

  for (const marker of [...oldEmailCopy, ...oldTechnicalCopy, ...starMarkers, ...extraMarkers]) {
    expect(text, `visible text should not contain ${marker}`).not.toContain(marker);
  }

  const badSvgClasses = await page.evaluate(() =>
    Array.from(document.querySelectorAll("svg"))
      .map((svg) => svg.getAttribute("class") || "")
      .filter((className) => /spark|star/i.test(className)),
  );
  expect(badSvgClasses).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectNoFrameworkOverlay(page: Page) {
  await expect(page.locator("nextjs-portal")).toHaveCount(0);
  await expect(page.locator("text=/Unhandled Runtime Error|Build Error|Runtime Error/i")).toHaveCount(0);
}

async function expectRenderablePage(page: Page) {
  await expect(page.locator("body")).not.toBeEmpty();
  await expectNoFrameworkOverlay(page);
  await expectNoHorizontalOverflow(page);
  await expectNoOldMarkers(page);
}

async function signInAdmin(page: Page) {
  await page.goto("/sign-in");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "登录" }) });
  await form.getByLabel("邮箱").fill("local-admin@example.com");
  await form.getByLabel("密码").fill("Password123!");
  await form.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("public smoke regression", () => {
  test("keeps current copy, layout, icon, and render health on public routes", async ({ page }) => {
    const routes = [
      { path: "/", expected: "你的账号" },
      { path: "/sign-up", expected: "创建账号" },
      { path: "/verify-email", expected: "确认邮箱" },
      { path: "/verify-email?token=test-token", expected: "确认邮箱" },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.locator("body")).toContainText(route.expected);
      await expectRenderablePage(page);
    }
  });

  test("keeps the home hero readable on short mobile viewports", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: test.info().project.use.baseURL as string,
      viewport: { width: 390, height: 600 },
    });
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /你的账号\s*安全中心/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "开始使用" })).toBeVisible();
    await expect(page.getByRole("link", { name: "已有账号，登录" })).toBeVisible();

    const heroState = await page.evaluate(() => {
      const feature = Array.from(document.querySelectorAll("h2")).find((el) => el.textContent?.includes("多重验证"));
      const featureRect = feature?.getBoundingClientRect();
      const cta = Array.from(document.querySelectorAll("a")).find((el) => el.textContent?.includes("开始使用"));
      const ctaRect = cta?.getBoundingClientRect();

      return {
        scrollMax: document.documentElement.scrollHeight - window.innerHeight,
        featureTop: featureRect ? Math.round(featureRect.top) : null,
        ctaBottom: ctaRect ? Math.round(ctaRect.bottom) : null,
      };
    });

    expect(heroState.scrollMax).toBeGreaterThan(0);
    expect(heroState.featureTop).toBeLessThan(700);
    expect(heroState.ctaBottom).toBeLessThanOrEqual(600);
    await context.close();
  });

  test("keeps the home hero and primary CTA above the fold on desktop", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /你的账号\s*安全中心/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "开始使用" })).toBeVisible();

    const desktopHeroState = await page.evaluate(() => {
      const title = document.querySelector("h1");
      const cta = Array.from(document.querySelectorAll("a")).find((el) => el.textContent?.includes("开始使用"));
      const titleRect = title?.getBoundingClientRect();
      const ctaRect = cta?.getBoundingClientRect();

      return {
        titleTop: titleRect ? Math.round(titleRect.top) : null,
        ctaBottom: ctaRect ? Math.round(ctaRect.bottom) : null,
        viewportHeight: window.innerHeight,
      };
    });

    expect(desktopHeroState.titleTop).toBeLessThan(260);
    expect(desktopHeroState.ctaBottom).toBeLessThan(desktopHeroState.viewportHeight);
  });

  test("keeps reduced-motion backgrounds still on mobile", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: test.info().project.use.baseURL as string,
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.locator("body")).toContainText("你的账号");

    const before = await visibleBandState(page);
    await page.waitForTimeout(500);
    const after = await visibleBandState(page);

    expect(after).toEqual(before);
    await expectRenderablePage(page);
    await context.close();
  });
});

test.describe("oauth metadata smoke regression", () => {
  test("serves OAuth and OpenID discovery metadata from public routes", async ({ request }, testInfo) => {
    const expectedBaseURL = testInfo.project.use.baseURL as string;
    const expectedIssuer = `${expectedBaseURL}/api/auth`;
    const routes = [
      "/.well-known/oauth-authorization-server/api/auth",
      "/.well-known/openid-configuration",
      "/api/auth/.well-known/openid-configuration",
    ];

    for (const route of routes) {
      const response = await request.get(route);
      expect(response.ok(), `${route} should return HTTP 2xx`).toBe(true);
      expect(response.headers()["content-type"]).toContain("application/json");

      const metadata = (await response.json()) as Record<string, unknown>;
      expect(metadata.issuer).toBe(expectedIssuer);
      expect(metadata.authorization_endpoint).toBe(`${expectedBaseURL}/api/auth/oauth2/authorize`);
      expect(metadata.jwks_uri).toBe(`${expectedBaseURL}/api/auth/jwks`);
    }
  });
});

test.describe("signed-in management smoke regression", () => {
  test("shows connection-code management and creates a time-limited code", async ({ page }) => {
    await signInAdmin(page);
    await expect(page.getByRole("heading", { name: "已有连接码" })).toBeVisible();

    const keyName = `回归测试连接码 ${Date.now()}`;
    await page.getByLabel("用途名称").fill(keyName);
    await page.getByLabel("有效期").selectOption("2592000");
    await page.getByRole("button", { name: "创建连接码" }).click();

    await expect(page.getByText("连接码已创建，只会显示这一次")).toBeVisible();
    const keyRow = page.locator("article").filter({ hasText: keyName });
    await expect(keyRow).toBeVisible();
    await expect(keyRow.getByText("到期：")).toBeVisible();
    await expect(keyRow.getByText("最后使用：")).toBeVisible();

    await keyRow.getByRole("button", { name: "暂停使用" }).click();
    await expect(keyRow.getByText("已暂停")).toBeVisible();

    await keyRow.getByRole("button", { name: "重新启用" }).click();
    await expect(keyRow.getByText("可使用")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await keyRow.getByRole("button", { name: "撤销连接码" }).click();
    await expect(page.getByText("连接码已撤销。")).toBeVisible();
    await expect(keyRow).toHaveCount(0);
    await expectRenderablePage(page);
  });

  test("creates and lists an application integration", async ({ page }) => {
    await signInAdmin(page);
    await page.goto("/applications");
    await expect(page.getByRole("heading", { name: "应用接入" })).toBeVisible();

    const appName = `回归测试应用 ${Date.now()}`;
    await page.getByLabel("应用名称").fill(appName);
    await page.getByLabel("应用主页").fill("https://app.example.com");
    await page.getByLabel("回调地址").fill("https://app.example.com/callback");
    await page.getByRole("button", { name: "创建接入应用" }).click();

    await expect(page.getByText("接入应用已创建。应用密钥只会显示这一次")).toBeVisible();
    await expect(page.getByText("应用编号").first()).toBeVisible();
    await expect(page.getByText("应用密钥").first()).toBeVisible();
    const appRow = page.locator("article").filter({ hasText: appName });
    await expect(appRow).toBeVisible();

    await appRow.getByRole("button", { name: "轮换密钥" }).click();
    await expect(page.getByText("应用密钥已轮换。新密钥只会显示这一次")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await appRow.getByRole("button", { name: "移除应用" }).click();
    await expect(page.getByText("接入应用已移除。")).toBeVisible();
    await expect(appRow).toHaveCount(0);
    await expectRenderablePage(page);
  });
});

async function visibleBandState(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-motion-band]"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        return {
          motion: element.dataset.motionBand || "",
          transform: style.transform,
          willChange: style.willChange,
          left: Math.round(rect.left),
          top: Math.round(rect.top),
        };
      }),
  );
}
