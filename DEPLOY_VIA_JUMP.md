# 部署到 186 服务器（通过 103 跳板机）

## 📋 前置准备

### 1. 获取跳板机 IP 地址

请确认你的跳板机 IP 地址。当前配置中使用了占位符 `${{ env.JUMP_HOST }}`，需要替换为实际地址。

---

## 🔐 GitHub Secrets 配置

### 需要配置的 Secrets

1. 访问 https://github.com/addxiaoyi/StarO/settings/secrets/actions
2. 点击 **"New repository secret"** 添加以下内容：

| Secret 名称 | 值 | 说明 |
|-------------|-----|------|
| `SSH_PRIVATE_KEY` | 跳板机的 SSH 私钥 | 用于通过跳板机连接 186 服务器 |
| `BETTER_AUTH_SECRET` | 随机密钥 | 运行 `openssl rand -base64 32` 生成 |
| `BETTER_AUTH_URL` | `https://auth.star-web.top` | 你的 OAuth 服务地址 |
| `DATABASE_URL` | PostgreSQL 连接字符串 | 格式: `postgresql://user:pass@host:5432/db` |

### SSH_PRIVATE_KEY 格式

```
-----BEGIN OPENSSH PRIVATE KEY-----
你的私钥内容
-----END OPENSSH PRIVATE KEY-----
```

**注意：**
- 需要使用跳板机（103）的 SSH 私钥
- 私钥对应的公钥需要同时添加到 103 和 186 服务器的 `~/.ssh/authorized_keys`

---

## 🔧 跳板机 SSH 配置

确保 103 跳板机已经配置好：

1. **103 跳板机** 需要能 SSH 到 **186 服务器**
2. 在 103 跳板机上确保有 186 服务器的 SSH 访问权限

### SSH Config（103 跳板机）

```bash
# 在 103 跳板机的 ~/.ssh/config 中添加
Host 186
    HostName 186.241.74.3
    User root
    Port 22
```

---

## 🚀 部署步骤

### 1. 更新跳板机 IP

在 `.github/workflows/deploy.yml` 中更新跳板机地址：

```yaml
env:
  JUMP_HOST: '你的跳板机实际IP'  # 例如: 103.123.45.67
```

### 2. 提交并推送

```bash
cd "D:\qwq\项目\auth-star\starx-oauth"
git add -A
git commit -m "feat: 配置通过跳板机部署到 186 服务器"
git push origin main:master
```

### 3. 查看部署状态

1. 访问 https://github.com/addxiaoyi/StarO/actions
2. 点击最新的 workflow run
3. 查看部署日志

---

## 🖥️ 186 服务器要求

确保 186 服务器已安装：

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
npm install -g pm2

# Nginx (用于反向代理)
sudo apt install nginx
```

---

## 🌐 Nginx 配置（186 服务器）

```nginx
server {
    listen 443 ssl;
    server_name auth.star-web.top;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ❓ 常见问题

### Q: 跳板机 IP 是什么？

请提供你的 103 跳板机实际 IP 地址，我会帮你更新配置。

### Q: 如何生成 SSH 密钥？

```bash
# 在本地生成 SSH 密钥
ssh-keygen -t ed25519 -C "github-actions"

# 将公钥添加到 103 跳板机
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@103.xx.xx.xx

# 将公钥添加到 186 服务器（通过 103）
ssh -J root@103.xx.xx.xx root@186.241.74.3 "echo '你的公钥' >> ~/.ssh/authorized_keys"
```

### Q: 如何测试连接？

```bash
# 测试跳板机连接
ssh -o StrictHostKeyChecking=no root@103.xx.xx.xx

# 测试通过跳板机连接 186
ssh -J root@103.xx.xx.xx root@186.241.74.3
```

---

## 📞 需要你提供的信息

1. **103 跳板机的实际 IP 地址**
2. **跳板机到 186 服务器的 SSH 访问方式**（密码？密钥？）
3. **186 服务器上 Node.js 和 PM2 是否已安装？**
