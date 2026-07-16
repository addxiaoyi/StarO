# StarX-Oauth 部署助手

## 快速部署选项

### 选项 1: Fly.io (推荐免费使用)

```bash
# 1. 安装 Fly CLI (Windows PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# 2. 重启终端后登录
fly auth login

# 3. 创建应用
cd D:\qwq\项目\auth-star\starx-oauth
fly launch --no-deploy --name starx-oauth --org personal --region sin

# 4. 设置环境变量
fly secrets set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
fly secrets set BETTER_AUTH_URL=https://starx-oauth.fly.dev

# 5. 部署
fly deploy

# 6. 访问 https://starx-oauth.fly.dev
```

### 选项 2: Railway (更简单)

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 创建项目
cd D:\qwq\项目\auth-star\starx-oauth
railway init --name starx-oauth

# 4. 添加 PostgreSQL
railway add --plugin postgresql

# 5. 设置环境变量
railway variables set BETTER_AUTH_SECRET=你的随机密钥
railway variables set BETTER_AUTH_URL=https://starx-oauth.up.railway.app

# 6. 部署
railway up

# 7. 访问 Railway 提供的 URL
```

### 选项 3: 使用已有的服务器 (186.241.74.3)

项目已配置 GitHub Actions 自动部署到 `auth.star-web.top`

只需在 GitHub 仓库设置以下 Secrets:
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` 
- `DATABASE_URL`
- `SSH_PRIVATE_KEY`

推送代码到 master 分支即可自动部署。

---

## 部署后配置

### 默认管理员
- 邮箱: admin@localhost
- 密码: admin
- 首次登录后请立即修改密码！

### OAuth 端点
部署后，第三方应用可使用以下端点接入:
- 授权端点: `/api/auth/oauth2/authorize`
- Token 端点: `/api/auth/oauth2/token`
- 用户信息: `/api/auth/oauth2/userinfo`
- 发现文档: `/.well-known/openid-configuration`
