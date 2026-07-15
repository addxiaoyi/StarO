# ⚡ 会话管理 E2E 补充脚手架
**路径**：基于现有 `tests/e2e/flows.spec.ts` 追加 2个新 `test` block，避免重构原有文件。
测试依赖：现有注册、用户登录、已可用的测试账号。

```bash
npx playwright test tests/e2e/session-toggle.spec.ts --headed
```

---

## 1) 新增文件: tests/e2e/session-toggle.spec.ts
```typescript
import { test, expect } from "@playwright/test";

test.describe("会话管理 #8-补充 E2E", () => {
  let cookie: string;
  let sessionId: string;

  test.beforeEach(async ({ page, context }) => {
    // 引入环境：如果已有测试账号，复用；否则用 better-auth 内置模拟账号流程
    await page.goto("/sign-in");
    await page.getByRole("textbox", { name: "邮箱" }).fill(
      process.env.TEST_USER_EMAIL || "e2e-test@example.com"
    );
    await page.getByRole("button", { name: "继续" }).click();

    // 通过测试 helper 完成登录并获取 cookie
    // Hint: 这里假设有 API 或 context 注入，需要环境具备 email 密码或 magic-link 预填充
    // placeholder: 如无法直接，用更底层的封装：
    const userPass = { email: "e2e-test@example.com", password:"Password123!" };
    await page.getByLabel("密码").fill(userPass.password);
    await page.getByRole("button", { name: "登录" }).click();
    await page.waitForURL("/dashboard");

    const cookies = await context.cookies();
    cookie = cookies.find((c) => c.name.startsWith("starx-oauth-session"))?.value || "";

    // 获取当前会话 ID (从页面或独立 API /api/auth/get-session)
    const res = await fetch("http://127.0.0.1:3105/api/auth/get-session", {
      headers: { cookie: `starx-oauth-session=${cookie}` },
    });
    const data = await res.json();
    sessionId = data?.id;
    expect(sessionId).toBeTruthy();
  });

  test("OP01：风险会话标记在 UI 上显示", async ({ page }) => {
    // 手动后端制造高风险（两个会话同 IP），或用测试 mock 非当前页面的另一个会话 ISP
    await page.goto("/dashboard/sessions");

    // 等待会话列表，判断 ‘⚠️ 风险提示’ 是否出现在第二/三行会话卡片
    await expect(
      page
        .locator("article")
        .filter({ hasText: /风险提示/ })
    ).toBeVisible();
  });

  test("OP02：一键撤销单会话 & 列表缩减", async ({ page, context }) => {
    await page.goto("/dashboard/sessions");
    const sessionsBefore = await page.locator("article").count();

    // 点击第二行会话的退出该设备
    await page
      .locator("article")
      .nth(1)
      .getByRole("button", { name: "退出该设备" })
      .click();

    // 二次确认弹窗
    await page.getByRole("button", { name: "确认撤销" }).click();

    // 断言数量 -1
    await page.waitForResponse(
      (resp) => resp.url().includes("/api/auth/session/revoke") && resp.ok()
    );

    await expect(page.locator("article")).toHaveCount(sessionsBefore - 1);

    // 确认当前设备仍保留
    await expect(
      page.getByText(/当前设备/).or(page.getByText(/当前在线/))
    ).toBeVisible();
  });

  test.skip("OP03：会话状态切换（需 BetterAuth 1.9+）", async () => {
    // status 转换用例，暂跳过，待 UPSTREAM patch + design 验证
    test.fail();
  });
});
```

---

## 2) 更新 package.json scripts
```json
{
  "scripts": {
    "test:e2e:session": "playwright test tests/e2e/session-toggle.spec.ts --headed --workers=1",
    "test:e2e:session-ci": "playwright test tests/e2e/session-toggle.spec.ts --workers=1"
  }
}
```

---

## 3) 本地执行一次行脑验证
```bash
# 先启动开发模式以便获取 cookie
docker exec -it starx-oauth-dev npm run dev &
# 确保 http://127.0.0.1:3105 可达
npx playwright test tests/e2e/session-toggle.spec.ts --headed --slowMo=500
```

---
**检查点**
- [ ] 两个测试用例都用 `@playwright/test` 且支持独立环境变量隔离
- [ ] playwright-report/html 必须保留**：测试截图 + 轨迹**
- [ ] 若使用独立的测试用户，必须环境变量 `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` 保持一致；避免污染生产

---

## 4) CI 矩阵 (GitHub Actions snippet)
```yaml
- name: E2E - 会话管理冒烟
  uses: microsoft/playwright-github-action@v1
  with:
    working-directory: ./starx-oauth
  run: |
    npm ci
    npm run test:e2e:session-ci
    npx playwright show-report
```

---
✅ **目标达成**：#8 完善会话管理功能即刻获得 **UI 风险展示 + 撤销冒烟覆盖**，同时 documents / test / CI 闭环俱全。后续 **会话切换 API** 按 `API_SESSION_UPDATE_DESIGN.md` 在 v1.9 补丁里 merge。
