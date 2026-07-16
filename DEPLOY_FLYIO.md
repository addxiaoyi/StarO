# 🚀 Fly.io 部署指南

## 项目概述

starx-oauth 是一个基于 Next.js 16 和 Better Auth 的认证系统。

## 前置准备

1. **Fly.io 账号** (https://fly.io)
2. **Fly CLI** - 安装命令：
   ```bash
   # Windows PowerShell
   iwr https://fly.io/install.ps1 -useb | iex
   ```

---

## 部署步骤

### 1️⃣ 安装 Fly CLI 并登录

```bash
# 安装后重启终端，然后登录
fly auth login
```

### 2️⃣ 推送代码到 GitHub

```bash
cd "D:\qwq\项目\auth-star\starx-oauth"

# 添加远程仓库
git remote add origin https://github.com/addxiaoyi/StarO.git

# 提交新文件
git add fly.toml Dockerfile next.config.ts
git commit -m "Add Fly.io deployment configuration"
git push -u origin master
```

### 3️⃣ 创建 Fly.io 应用

```bash
cd "D:\qwq\项目\auth-star\starx-oauth"

# 创建应用（选择距离你最近的区域）
fly launch

# 设置应用名称
# ? Choose your app deployment region (requires padding) › hkg (Hong Kong)
```

### 4️⃣ 创建 PostgreSQL 数据库

```bash
# 创建免费 PostgreSQL 数据库
fly postgres create --name starx-oauth-db

# 附加到你的应用
fly postgres attach --app starx-oauth
```

### 5️⃣ 设置环境变量

```bash
# 设置必填环境变量
fly secrets set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
fly secrets set BETTER_AUTH_URL=https://starx-oauth.fly.dev

# 可选：邮件服务
fly secrets set RESEND_API_KEY=your_resend_api_key
fly secrets set EMAIL_FROM="X-Oauth <noreply@yourdomain.com>"
```

**生成 BETTER_AUTH_SECRET（Windows PowerShell）：**
```powershell
openssl rand -base64 32
```

### 6️⃣ 部署

```bash
fly deploy
```

### 7️⃣ 创建管理员账号

```bash
# 设置管理员信息并运行种子脚本
fly secrets set STARX_FIRST_ADMIN_EMAIL=admin@example.com
fly secrets set STARX_FIRST_ADMIN_NAME=Admin
fly secrets set STARX_FIRST_ADMIN_PASSWORD=YourSecurePassword123!

# 运行数据库迁移和创建管理员
fly ssh console -C "npx tsx scripts/better-auth-migration.ts --apply"
fly ssh console -C "npm run db:seed-admin"

# 完成后删除敏感变量
fly secrets unset STARX_FIRST_ADMIN_EMAIL STARX_FIRST_ADMIN_NAME STARX_FIRST_ADMIN_PASSWORD
```

### 8️⃣ 查看部署状态

```bash
# 查看应用状态
fly status

# 查看日志
fly logs

# 访问应用
fly open
```

---

## 常用命令

```bash
fly status              # 查看状态
fly logs                # 查看日志
fly ssh console         # SSH 进入容器
fly secrets list        # 列出所有密钥
fly secrets set KEY=VALUE  # 设置密钥
fly secrets unset KEY   # 删除密钥
fly restart             # 重启应用
fly deploy              # 重新部署
fly scale count 1       # 设置实例数量
fly scale show          # 查看扩展配置
```

---

## 自定义域名（可选）

```bash
# 添加自定义域名
fly certs create yourdomain.com

# 添加 DNS 记录后验证
fly certs show yourdomain.com
```

---

## 常见问题

### Q: 部署失败
- 检查 `fly.toml` 配置
- 查看日志：`fly logs`
- 确认所有环境变量已设置

### Q: 数据库连接失败
- 确认 PostgreSQL 已创建并附加
- 检查 `DATABASE_URL` 格式

### Q: 内存不足
- Next.js 16 + Better Auth 可能需要更多内存
- 在 `fly.toml` 中调整：`memory = "512mb"`

---

## 重要安全提醒

部署完成后：
1. ✅ 删除 `STARX_FIRST_ADMIN_PASSWORD`
2. ✅ 使用 HTTPS（Fly.io 自动启用）
3. ✅ 定期备份数据库：`fly postgres backup create`
4. ✅ 更新 `BETTER_AUTH_SECRET`

---

## 免费额度说明

| 资源 | 免费额度 |
|------|----------|
| 共享 CPU | 3 个 × 256MB |
| 实例 | 0-1 个（自动休眠） |
| PostgreSQL | 1GB 存储 |
| 带宽 | 160GB/月 |
| 休眠 | 30 天后自动休眠 |
