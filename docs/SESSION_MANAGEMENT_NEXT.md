# 🚧 会话管理功能后续实施指南

本文档旨在为团队提供清晰的 **会话状态切换** / **安全监控** 后续实施路径，前序架构已铺好基础能力。

## 🔗 相关铺垫
- 已扩展 `auth-client.ts` types 以支持 session 状态管理
- 新增 `isRiskySession(...)` / `getSessionRiskLevel(...)` 等 helper 函数
- 原型 UI 组件已准备就绪（`session-manager.tsx` 已注册 `onToggleActive`）

---

## 📌 待实施清单

### 🔐 1. 后端 API 实现（BetterAuth 兼容性）
**目标**：支持 `updateSession({ sessionId, status, expiresIn })`，其中 `status` 可选 `active`/`inactive`/`revoked`

**优先级**：⭐⭐⭐

**实施提示**：
- through `multiSession` / custom route in `better-auth` or via `/api/auth/session/update` patch
- 代码位置：`src/lib/auth-options.ts` 内 hooks / 扩展新 `PATCH` 路由 `src/app/api/auth/session/update/route.ts`
- 提示：沿用 `better-auth/core` 概念，wrap 成 `session.user.updateSession({ ... })` 或 通过自定义 action 实现。
- 建议返回格式：
```json
{
  status: 'inactive' | 'active',
  updates: { ... }
}
```

**验收标准**：
- 任意会话支持 `status: inactive` 切换，保留数据不撤销
- 原 `revokeSession` 仍正常工作（`status: revoked`) 
---

### 🖼️ 2. 完善会话状态切换 UI（ dashboard & session-panel）
**目标**：用户可手动暂停/恢复会话，而非仅撤销

**优先级**：⭐⭐

**关键点**：
- 为 `session-manager.tsx` 组件增加 expose `onToggleActive(sessionId, nextStatus)` 功能
- 在 `SessionCard` 内新增 Toggle 开关 / 按钮 `切换为停用（激活）` 
- 状态同步后触发 `router.refresh()` 刷新列表
- 语义 & accessibility 优化（`aria-pressed` / `aria-label`）

**验收标准**：
点击「切换为停用」 => 状态变更为 `inactive`，UI 反馈成功，刷新后生效。

---

### 🚨 3. 异常会话推送与告警（安全监控）

**目标**：前端「风险」标签仅展示告警；后续可集成邮件/ Admin Panel 提醒。

**高优先级**：⭐⭐⭐

**建议路径**：
- 前端：`getSessionRiskLevel(...)` 可返回 `high` 级别时，在 `SessionCard` 追加带箭头的 risk tooltip
  UI 示例：
```tsx
{ risk.level === 'high' && (
  <StatusPill label="高风险" tone="critical" />
)}
```
- 后端（可选）：
1. 通过 `audit-log.ts` 增加 `event: 'auth.risk-session-detected'`
2. 触发 webhook/邮件，举例如下伪代码
```ts
if (risk.level === 'high') {
  sendAlertEmail({ userEmail, message: '检测到异常登录，建议及时处理。'});
  writeAuditLog({ ... });
}
```

**验收标准**：
异常登录（如两地同时）时，UI 显示 ⚠️「高风险」标记；Audit Log 记录 time、IP 及风险级别。

---

### 📊 4. 统计面板（ Admin Center ）

**目标**：管理员可统览系统所有用户活跃/停用/撤销会话数。

**路径**：
- 扩展 `admin/audit-logs` 列表筛选项：会话状态筛选器 `state: active | inactive | revoked`
- 或创建新页面 `admin/sessions` 以表格形态展示，支持批量切换状态。

---

## 🧩 候选优化点（可选）

| 功能 | 简述 | 优先级 |
|------|------|--------|
| 会话过期时长自定义 | 允许用户拖拽日历选择延长会话 | ⭐⭐ |
| IP 地理定位 | 在会话列表展示登录地（GET /free-geo-ip API）| ⭐ |
| 自动清理 | 过期/长期停用会话自动清理脚本 | ⭐⭐ |

---

## ✅ 交付建议
做好任务拆分即可「钉钉/ Jira」记录 Issue。建议从 **第 1、2 项** 优先落地，形成闭环。

## 📚 技术对接点
- BetterAuth 会话生态文档： docs/better-auth/session-management.md （如有）
- 审计日志 hook： `src/lib/audit-log.ts` 
- 前端路由：以 `/dashboard/sessions` 为基座扩展即可。
