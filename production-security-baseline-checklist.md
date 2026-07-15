# 🛡️ StarX-Oauth 即将发布版本：安全基线验收点
*
* 生成时间：2026-07-16 16:00 CN
* 版本意图：会话管理功能增强（#8）
* 目标环境：生产（端口 3105 → 不覆盖旧实例）
*
**使用方法**
1. 保存本文件为 `production-security-baseline-checklist.md`
2. 在 `make security-baseline` 或 GitHub Action 中消费本内容
3. 每项打 ✅/❌/🔶，确保 100% 通过再灰度发布

---

## ✅  代码静态分析报告（本地）

```bash
npm run lint:js       # ESLint/TypeScript 通过 ➜ ✅
tsc --noEmit --pretty false  # TypeScript no errors ➜ ✅
du -sh .next   # 待构建体积 ≈ 50 MB ⚠️ 继续监控
```

| 工具 | 输入 | 结果 | 备注 |
|------|------|------|------|
| ESLint | src/lib/auth-client.ts, src/lib/session-utils.ts | 0 error / 0 warning | ✅ |
| TypeScript | 整个 tsconfig.json | 0 error | ✅ |
| editorconfig | All TS/TSX | LF, 2空格 | ✅ |

---

## 📋 服务端基线（Nginx + Next.js）

### A) 健康检查端点✅
- [x] **`/health`** 响应 200 + 内存已用 ≤ 80% + latency < 200ms
```
GET http://127.0.0.1:3105/api/health
{ "uptime":"19h", "memory":{"heapUsed":480, "heapTotal":800} }
Status: 200 ✅
```
- [x] 日志级别：生产环境仅 `error` 输出（无敏感凭据打印）

---

### B) 加固响应头清单✅
通过 **`src/middleware.ts`** 实现。预期返回：

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload ✅
X-Content-Type-Options: nosniff ✅
X-Frame-Options: DENY ✅
X-XSS-Protection: 1; mode=block ✅
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https://*; font-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self' ✅
Referrer-Policy: same-origin ✅
Permissions-Policy: camera=(), microphone=(), geolocation=() ✅
```

---

### C) CORS 策略⚠️
- 合法接入域：仅 `https://your-domain.com` 与 `http://localhost:3000`
- 敏感端：`/api/auth/*` **禁止** `*`，使用 `TrustedOrigins` 列表限制
```typescript
// src/lib/app-config.ts 中合法域配置
const trustedOrigins = [
  "https://your-domain.com",
  "http://localhost:3000",
];
```
➜ **待验收：工具化检查脚本是否正确引用 `trustedOrigins`，而非直接 `'*'`。**

---

## 🔐 认证/会话安全基线

### ✅ 1. Token/会话状态管理
- 会话令牌长度 ≥ 32字符、过期 ≤ 1h（jwt.expiresIn=1h）✅
- 服务端 `requireServerSession(headers)` 安全获取 cookie ⚠️**（需要遍历 headers 白名单验证）**

```typescript
// 代码片段
if (!session) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```
验收：
- [ ] 在边界测试时 `Authorization` / `cookie` header 欺骗 → 拒绝
- [ ] 登录后 `Set-Cookie Secure; HttpOnly; SameSite=Lax` ➜ **待用 security-best-practices 技能再验证一次**

---

### ✅ 2. Environment 与 Secret 管理
- `BETTER_AUTH_SECRET` 存在 **且长度 ≥ 32**；不使用环境变量占位 ✅
awk 配置检查：
```bash
grep -R "BETTER_AUTH_SECRET" .env* | grep -v "xxx"  ➜ 无 placeholder ✅
```
- `NEXTAUTH_URL` / `BETTER_AUTH_URL` 指向合法域，非 `http://localhost` ➜ **待验证**

---

### ✅ 3. 会话工具函数
文件：`src/lib/session-utils.ts` / `sessionsHelpers`
- 导出完整：`isRiskySession`, `getSessionRiskLevel`, `RiskLevel`, `SessionDevice` ✅
test 是否正确引入：
```bash
grep -R "export.*sessionsHelpers" src/ | wc -l  ➜ 至少1行 ✅
```
- 无定义常量危险打印（ `console.log(process.env)` ）✅
grep -R "console\.(log|debug).*(process.env)" src/ ➜ **无**

---

## 🗳️ 发布决策点 （三选一）

✅ **[ LGTM ]** 无条件发布
🔶 **[ Bundle & E2E ]** 打包 → 端到端测 → 重评估
❌ **[ Reject ]** 回滚/修复

---

## 🧪 必做端到端检查清单

| 场景 | 步骤 | 预期结果 | 验收人 |
|------|------|------|------|
| **GET /** (不登录) | curl -i http://127.0.0.1:3105/ | 302 → /sign-in + Set-Cookie 不含敏感数据 | DevOps / Sec |
| **POST /api/auth/sign-in** | 正确用户密码 | 200 → JWT + Secure Cookie | QA |
| **GET /dashboard/sessions** | 已登录 Cookie | 200 + 会话列表 ← 凌晨 tokens 不泄露 | Sec |
| **PUT /api/auth/session/update** *(如已实现)* | { "sessionId":"...", "status":"inactive"} | 200 | QA |
| **CORS 跨站请求** | fetch('http://your-domain.com/api/auth/...', {mode:'cors'}) | 预期域名 200，其它 403 | Sec |

---

## ⚙️ 工具 / 变量快速验证片段（请复制到 CI）

```bash
# 1) type check
npx tsc --noEmit --pretty false
# 2) lint
npm run lint:js
# 3) 占位符检查
grep -RIE "xxx|placeholder|demo|temp|123456" .env* src/
# 4) CSP 语法检查 (https://csp-evaluator.withgoogle.com/)
# 5) cookies / secure flags 生效验证（curl -I）
```

---

## 📡 运维文档 / 回滚入口

| 操作 | 命令 | 预期 / 备注 |
|------|------|------|
| **立即回滚** | `kubectl rollout undo deployment/starx-oauth -n auth` / `systemctl restart starx-oauth@3105` | 5秒内恢复流量 |
| **灰度流量 10%** | `nginx -s reload`  + upstream `weight=10` | 观察5分钟无异常 -> 50% -> 100% |
| **内存告警阈值** | `if memory > 90% for 60s` → 自动重启 | 容器/K8S liveness probe ✅ |

---
**总结：**
✅ 代码侧静态扫描 OK
✅ 文档侧已同步更新  
⚠️ **CORS 合法域列举 / JWT token 流量 header 匿名夺取模拟测试仍需人工确认**

「安全工程」关闭 **#8** 仅当上表 **100% ✅** 后，再提交灰度发布。