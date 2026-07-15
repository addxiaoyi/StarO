# 🔧 会话状态切换 API 实现设计
**目标路径**
仍然复用 BetterAuth 的 MultiSession 插件现有能力，避免做 invasive 修改；只暴露 **/api/auth/session/toggle** & **/api/auth/session/update** PATCH 两条路由，封装底层的 `session.update({ status })`。

---

## 1️⃣ API 选型

- **方案 A** (推荐)：`PATCH /api/auth/session/update`
  - 输入： `{ sessionId: string; status?: "active"|"inactive"; expiresIn?: number }`
  - 输出：`{ updated: boolean; session?: SessionRecord }`
  - 权限：当前用户只能 toggle 自己的会话

- **方案 B**：自行 `GET /api/auth/session` + 过滤 + `POST /api/auth/session/state` 保存 DB
  - ❌ **不推荐**：又造一遍轮子

---

## 2️⃣ 路由设计

```
PATCH /api/auth/session/update
Headers:
  - cookie: <当前用户cookie>
Body-JSON:
  { "sessionId": "sess_xxx", "status": "inactive" }
Response-200:
  { "success": true, "session": { ... } }
Errors:
  - 401: 非当前用户，或未登录
  - 400/404: 会话不存在 / 已撤销
  - 422: 状态仅 `active`↔️`inactive` 切换
```

---

## 3️⃣ 验证矩阵

| 情况 | 代码行为 | 测试步骤 |
|------|----------|--------|
| 非当前用户 | 401 | user A 尝试 toggle user B 的 sessionId |
| 会话已撤销 | 400 + `revoked` | 已调用 revokeSession 的 Id |
| 成功切换 | 200 + 新状态 | userId 匹配，status 值对换 |
| 过期时间延长 | 200 + expiresAt 延长 | expiresIn > 0 校验 |

---

## 4️⃣ 粗颗粒度变更 (src/app/api/auth/session/update/route.ts)
```typescript
/**
 * PATCH /api/auth/session/update
 * 切换指定会话状态为 active/inactive
 */
import { NextResponse } from "next/server";
import { starxAuthClient } from "@/lib/auth-client";
import { cookies } from "next/headers";

export { PATCH } from "@/lib/auth-options"; // reuse base auth handler

// TODO: 这里示范，因 better-auth 没有直接 expose 会话 state=status 更新
// 所以暂通过 session.revokeSession 的间接手法实现 toggle 激活/停用
// 期望：BetterAuth v1.9+ 原生支持，或 company 提供补丁
```

---

## 📢 临时 Workaround（立即可用）
如 **BetterAuth v1.6** 版本不支持 `status` patch 字段，可用下列改法完成 POC：
- 用户调用 `POST /api/auth/session/revoke` → 暂时保留会话数据，但移除 token 清理字段 → 近似「停用」
- 前端 UI 在已撤销会话上屏蔽 toggle 按钮；本次 #8 仅做 **异常检测** + **风险展示** 到此阶段
- 待 BetterAuth 更新后再 PR 迁移到原生 API

---
**结论**：
如不想等待 upstream patch，本次正式交付可仅把 `session-manager` UI 的 toggle 按钮做成 **disable** 提示 + 跳转文档：`docs/SESSION_MANAGEMENT_NEXT.md#1` 说明待官方支持。
这样既不 blocking 发布，也给 Product 留空间在下一轮迭代补齐。