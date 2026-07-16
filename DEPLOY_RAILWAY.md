# 🚀 Railway 部署指南

## 项目概述

starx-oauth 是一个基于 Next.js 16 和 Better Auth 的认证系统。

## 前置准备

1. **GitHub 账号**
2. **Railway 账号** (https://railway.app) - 使用 GitHub 登录

---

## 部署步骤

### 1️⃣ 创建 Railway 项目

1. 访问 https://railway.app
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择 `addxiaoyi/StarO` 仓库
4. Railway 会自动检测到 Next.js 项目

### 2️⃣ 配置环境变量

在 Railway 控制台 → 你的项目 → **Variables** 中添加：

```
# === 必填 ===
BETTER_AUTH_SECRET=<生成随机密钥>
BETTER_AUTH_URL=https://你的项目名.up.railway.app
DATABASE_URL=<PostgreSQL 连接字符串>

# === 邮件（按需配置）===
RESEND_API_KEY=<Resend API Key>
EMAIL_FROM=X-Oauth <noreply@yourdomain.com>
```

**生成 BETTER_AUTH_SECRET：**
```bash
# Windows PowerShell
openssl rand -base64 32

# 或访问 https://generate-secret.vercel.app/32
```

### 3️⃣ 添加 PostgreSQL 数据库

1. 在 Railway 项目中点击 **New** → **Database** → **PostgreSQL**
2. 创建后点击 **PostgreSQL** → **Connect** → 复制 **Connection URL**
3. 粘贴到环境变量 `DATABASE_URL`

### 4️⃣ 等待部署完成

Railway 会自动：
1. 检测项目类型（Next.js）
2. 运行 `npm install`
3. 运行 `npm run build`
4. 启动服务

### 5️⃣ 初始化数据库

部署完成后，运行一次数据库迁移：

1. 在 Railway 控制台打开你的应用
2. 点击 **Jobs** → **New Job**
3. 运行命令：`npx tsx scripts/better-auth-migration.ts --apply`

### 6️⃣ 创建管理员账号

在 **Variables** 中临时添加：

```
STARX_FIRST_ADMIN_EMAIL=admin@example.com
STARX_FIRST_ADMIN_NAME=Admin
STARX_FIRST_ADMIN_PASSWORD=YourSecurePassword123!
```

然后创建管理员：
1. 点击 **Jobs** → **New Job**
2. 运行命令：`npm run db:seed-admin`
3. **创建完成后删除这些变量！**

---

## 部署配置说明

项目已包含 `railway.toml` 配置文件，Railway 会自动使用。

---

## 自定义域名（可选）

1. 在 Railway 项目 → **Settings** → **Networking** → 开启 **Public Networking**
2. 添加自定义域名
3. 在你的域名 DNS 中添加 CNAME 记录

---

## 常见问题

### Q: 部署失败
- 检查环境变量是否完整
- 查看 Railway 日志排查问题

### Q: 数据库连接失败
- 确认 PostgreSQL 已创建
- 检查 `DATABASE_URL` 格式：`postgresql://user:password@host:port/database`

### Q: 邮箱无法发送
- 配置 RESEND_API_KEY 或 SMTP
- 检查 EMAIL_FROM 设置

---

## 重要安全提醒

部署完成后：
1. ✅ 删除 `STARX_FIRST_ADMIN_PASSWORD`
2. ✅ 使用 HTTPS
3. ✅ 定期备份数据库
4. ✅ 更新 BETTER_AUTH_SECRET
