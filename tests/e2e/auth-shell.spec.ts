import { expect, test, type Locator, type Page } from "@playwright/test";

type AuthRouteCheck = {
  path: string;
  title: string;
  fieldLabel: string;
};

const authRoutes: AuthRouteCheck[] = [
  { path: "/sign-in", title: "登录", fieldLabel: "邮箱" },
  { path: "/sign-up", title: "创建账号", fieldLabel: "姓名" },
  { path: "/forgot-password", title: "找回登录密码", fieldLabel: "邮箱" },
  { path: "/two-factor", title: "确认是你本人", fieldLabel: "验证器应用里的 6 位数字" },
];

async function centerHitMatches(page: Page, locator: Locator) {
  const handle = await locator.elementHandle();
  expect(handle).not.toBeNull();

  return handle!.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return top === element || element.contains(top);
  });
}

async function authShellState(page: Page) {
  return page.evaluate(() => {
    const cubes = document.querySelector(".auth-cubes");
    const samplePoint = { x: window.innerWidth / 2, y: 120 };
    const top = document.elementFromPoint(samplePoint.x, samplePoint.y);

    return {
      sampleClass: typeof top?.className === "string" ? top.className : "",
      sampleTag: top?.tagName || "",
      cubesPointerEvents: cubes ? getComputedStyle(cubes).pointerEvents : null,
      cubesRect: cubes
        ? (() => {
            const rect = cubes.getBoundingClientRect();
            return {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          })()
        : null,
      activeAnimations: document.getAnimations().length,
    };
  });
}

async function dotFieldGlowState(page: Page) {
  return page.evaluate(() => {
    const glow = document.querySelector<SVGCircleElement>(".auth-dot-field circle");

    if (!glow) {
      return null;
    }

    return {
      cx: Number(glow.getAttribute("cx") || "-9999"),
      cy: Number(glow.getAttribute("cy") || "-9999"),
      opacity: Number.parseFloat(glow.style.opacity || "0"),
    };
  });
}

async function shortViewportState(page: Page) {
  return page.evaluate(() => {
    const shell = document.querySelector("main.auth-canvas");
    const panel = document.querySelector(".auth-panel");
    const submit = document.querySelector<HTMLButtonElement>('button[type="submit"]');
    const footer = panel?.lastElementChild ?? null;
    const rect = (element: Element | null) => {
      if (!element) {
        return null;
      }

      const box = element.getBoundingClientRect();
      return {
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        height: Math.round(box.height),
      };
    };

    return {
      overflowY: shell ? getComputedStyle(shell).overflowY : null,
      scrollY: Math.round(window.scrollY),
      maxScroll: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
      panel: rect(panel),
      submit: rect(submit),
      footer: rect(footer),
    };
  });
}

test.describe("auth shell regression", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps cubes visible and interactive on sign-in mobile while form stays clickable", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();

    const state = await authShellState(page);
    expect(state.cubesPointerEvents).toBe("auto");
    expect(state.sampleClass).toContain("cube");
    expect(state.activeAnimations).toBe(0);

    const submitButton = page.locator('button[type="submit"]');
    await expect(page.getByLabel("邮箱")).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(centerHitMatches(page, page.getByLabel("邮箱"))).resolves.toBe(true);
    await expect(centerHitMatches(page, submitButton)).resolves.toBe(true);
  });

  test("reuses the same mobile auth shell behavior across auth routes", async ({ page }) => {
    for (const route of authRoutes) {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.title })).toBeVisible();

      const state = await authShellState(page);
      expect(state.cubesPointerEvents, `${route.path} cubes should remain interactive`).toBe("auto");
      expect(state.sampleClass, `${route.path} should expose cube background near the top`).toContain("cube");

      const field = page.getByLabel(route.fieldLabel);
      await expect(field).toBeVisible();
      expect(await centerHitMatches(page, field), `${route.path} field center should remain clickable`).toBe(true);
    }
  });
});

test.describe("auth shell desktop background regression", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("keeps the dot-field responsive to pointer movement while form controls stay clickable", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();

    const before = await dotFieldGlowState(page);
    expect(before).not.toBeNull();
    expect(before?.cx).toBeLessThan(0);

    await page.mouse.move(220, 180, { steps: 6 });
    await page.waitForTimeout(240);

    const after = await dotFieldGlowState(page);
    expect(after).not.toBeNull();
    expect(after?.cx).toBeGreaterThan(0);
    expect(after?.cy).toBeGreaterThan(0);
    expect(after?.opacity).toBeGreaterThan(0);

    const emailField = page.getByLabel("邮箱");
    const submitButton = page.locator('button[type="submit"]');
    await expect(emailField).toBeVisible();
    await expect(submitButton).toBeVisible();
    expect(await centerHitMatches(page, emailField)).toBe(true);
    expect(await centerHitMatches(page, submitButton)).toBe(true);
  });
});

test.describe("auth shell short mobile viewport regression", () => {
  test.use({ viewport: { width: 390, height: 600 } });

  test("keeps sign-in actions visible without losing the form on short screens", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();

    const state = await shortViewportState(page);
    expect(state.overflowY).toBe("auto");
    expect(state.submit).not.toBeNull();
    expect(state.submit?.bottom).toBeLessThanOrEqual(600);

    const emailField = page.getByLabel("邮箱");
    const submitButton = page.locator('button[type="submit"]');
    await expect(emailField).toBeVisible();
    await expect(submitButton).toBeVisible();
    expect(await centerHitMatches(page, emailField)).toBe(true);
    expect(await centerHitMatches(page, submitButton)).toBe(true);
  });

  test("keeps sign-up actions reachable by scrolling on short screens", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: "创建账号" })).toBeVisible();

    const before = await shortViewportState(page);
    expect(before.overflowY).toBe("auto");
    expect(before.maxScroll).toBeGreaterThan(0);

    await page.evaluate(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    });
    await expect
      .poll(async () => (await shortViewportState(page)).scrollY, {
        message: "page should finish scrolling to the bottom on short screens",
      })
      .toBe(before.maxScroll);

    const after = await shortViewportState(page);
    expect(after.scrollY).toBeGreaterThan(0);
    expect(after.submit).not.toBeNull();
    expect(after.footer).not.toBeNull();
    expect(after.submit?.bottom).toBeLessThanOrEqual(600);
    expect(after.footer?.top).toBeLessThanOrEqual(600);

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    expect(await centerHitMatches(page, submitButton)).toBe(true);
  });
});
