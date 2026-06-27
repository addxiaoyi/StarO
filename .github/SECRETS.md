# GitHub Secrets 配置指南

## 必需的秘密密钥

在 GitHub 仓库设置中添加以下 Secrets (Settings → Secrets and variables → Actions):

### 1. SSH 私钥
- **Name**: `SSH_PRIVATE_KEY`
- **Value**: 你的 SSH 私钥内容 (hermes_186_ed25519)
- **权限**: 需要有 root@186.241.74.3 的 SSH 访问权限

### 2. Better Auth 密钥
- **Name**: `BETTER_AUTH_SECRET`
- **Value**: 至少 32 字符的随机字符串
- **生成**: `openssl rand -base64 32`

### 3. 应用 URL
- **Name**: `BETTER_AUTH_URL`
- **Value**: `https://auth.star-web.top`

### 4. 数据库连接
- **Name**: `DATABASE_URL`
- **Value**: PostgreSQL 连接字符串
- **格式**: `postgresql://user:password@host:5432/database`

## 添加方法

```bash
# 使用 GitHub CLI 添加 Secrets
gh secret set SSH_PRIVATE_KEY < ~/.ssh/hermes_186_ed25519
gh secret set BETTER_AUTH_SECRET
gh secret set BETTER_AUTH_URL -b"https://auth.star-web.top"
gh secret set DATABASE_URL
```

或通过网页界面:
1. 进入仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. 输入 Name 和 Value

## 权限要求

SSH 私钥对应的公钥需要:
- 在服务器 `~/.ssh/authorized_keys` 中配置
- 具有 root 用户执行 `systemctl` 的权限