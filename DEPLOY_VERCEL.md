# ===========================================
# Vercel + Supabase 部署指南
# ===========================================

## 概述

Vercel 部署 Next.js 应用 + Supabase 免费 PostgreSQL 数据库

---

## 第一步：部署到 Vercel

### 1. 安装 Vercel CLI（可选）
```bash
npm install -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 部署
```bash
cd D:\qwq\项目\auth-star\starx-oauth
vercel
```

### 或者：GitHub 自动部署

1. 访问 https://vercel.com
2. 用 GitHub 登录
3. 点击 "Add New..." → "Project"
4. 选择 `addxiaoyi/StarO` 仓库
5. 点击 "Deploy"

---

## 第二步：创建免费 PostgreSQL（Supabase）

### 1. 注册 Supabase
访问 https://supabase.com 并用 GitHub 登录

### 2. 创建免费项目
- 点击 "New project"
- 填写项目名称：`starx-oauth`
- 设置数据库密码（记住它！）
- 选择最近的区域（如 Singapore）
- 点击 "Create new project"

### 3. 获取连接字符串
1. 项目创建完成后，点击 "Settings" → "Database"
2. 找到 "Connection String" 部分
3. 复制 "URI"（格式：`postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`）

---

## 第三步：配置环境变量

在 Vercel 项目设置中添加：

| 变量名 | 值 |
|--------|-----|
| `BETTER_AUTH_SECRET` | 随机密钥（32位以上） |
| `BETTER_AUTH_URL` | 你的 Vercel 域名 |
| `DATABASE_URL` | Supabase 的 PostgreSQL 连接字符串 |

**生成随机密钥：**
```bash
# Windows PowerShell
openssl rand -base64 32

# 或访问 https://generate-secret.vercel.app/32
```

---

## 第四步：初始化数据库

1. 在 Vercel 项目中打开 "Deployments"
2. 找到最新部署，点击 "View Build Logs"
3. 或在本地运行：
```bash
# 设置 DATABASE_URL 后
npm run db:migration:apply
npm run db:seed-admin
```

---

## 费用对比

| 平台 | 数据库 | 免费额度 |
|------|--------|----------|
| Vercel | ❌ 无 | 前端/Serverless 免费 |
| Supabase | ✅ PostgreSQL | 500MB 存储，实时用户 |
| Railway | ✅ PostgreSQL | $5/月（需绑卡） |
| Fly.io | ✅ PostgreSQL | 3 个共享 CPU（需绑卡） |

---

## 部署完成！

- Vercel 访问地址：`https://starx-oauth.vercel.app`
- Supabase 管理：`https://supabase.com/dashboard`
