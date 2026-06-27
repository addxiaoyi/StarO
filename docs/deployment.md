# StarX-Oauth 部署指南

本文档说明如何在宝塔面板环境中部署 StarX-Oauth。

## 部署架构

```
用户请求 (HTTPS)
    ↓
Nginx (端口 443)
    ↓
Next.js 应用 (端口 3002)
    ↓
PostgreSQL 数据库
```

## 前置要求

- 宝塔面板已安装
- Node.js 项目管理器已安装
- 已创建站点 `auth.star-web.top`
- PostgreSQL 数据库已创建

## 部署步骤

### 1. 上传代码

将项目代码上传到站点目录，例如 `/www/wwwroot/auth.star-web.top`

### 2. 安装依赖

```bash
cd /www/wwwroot/auth.star-web.top
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
# 必须配置
BETTER_AUTH_SECRET=你的随机密钥（用 openssl rand -hex 32 生成）
BETTER_AUTH_URL=https://auth.star-web.top
DATABASE_URL=postgresql://用户名:密码@localhost:5432/数据库名

# 邮件配置
EMAIL_FROM=StarX-Oauth <noreply@你的域名>
RESEND_API_KEY=你的 Resend API Key

# OAuth 提供商（按需配置）
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# 管理员
STARX_ADMIN_USER_IDS=
```

### 4. 配置 Nginx

在宝塔面板中设置站点，或手动创建 Nginx 配置：

```nginx
server {
    listen 80;
    server_name auth.star-web.top;
    
    # 强制跳转 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auth.star-web.top;
    
    ssl_certificate /www/server/panel/vhost/cert/auth.star-web.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/auth.star-web.top/privkey.pem;
    
    # Next.js WebSocket 支持
    location /_next/webpack-hmr {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # 静态文件缓存
    location /_next/static {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires max;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }
    
    # 所有其他请求
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

### 5. 数据库迁移

```bash
# 生成迁移文件（先查看）
npm run db:migration

# 确认无误后应用
npm run db:migration:apply
```

### 6. 创建管理员账号

```bash
export STARX_FIRST_ADMIN_EMAIL="admin@example.com"
export STARX_FIRST_ADMIN_NAME="管理员"
export STARX_FIRST_ADMIN_PASSWORD="你的强密码"
npm run db:seed-admin

# 创建完成后删除密码变量
unset STARX_FIRST_ADMIN_PASSWORD
```

### 7. 构建应用

```bash
npm run build
```

### 8. 使用 PM2 启动

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start node_modules/next/dist/bin/next-start \
  --name "starx-oauth" \
  --interpreter node \
  -- node_modules/next/dist/bin/next start -p 3002

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

或者使用 systemd 服务（推荐）：

```bash
# 创建 systemd 服务文件
cat > /etc/systemd/system/starx-oauth.service << 'EOF'
[Unit]
Description=StarX-Oauth
After=network.target postgresql.service

[Service]
Type=simple
User=www
WorkingDirectory=/www/wwwroot/auth.star-web.top
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -p 3002
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/starx-oauth.log
StandardError=append:/var/log/starx-oauth-error.log

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
systemctl daemon-reload
systemctl enable starx-oauth
systemctl start starx-oauth

# 检查状态
systemctl status starx-oauth
```

## 验证部署

```bash
# 检查服务状态
curl -k https://auth.star-web.top/api/auth/get-session

# 检查 OpenID 配置
curl -k https://auth.star-web.top/.well-known/openid-configuration | head -c 200

# 检查 OAuth 授权服务器配置
curl -k https://auth.star-web.top/.well-known/oauth-authorization-server/api/auth
```

## 运维命令

```bash
# 查看日志
tail -f /var/log/starx-oauth.log
tail -f /var/log/starx-oauth-error.log

# 重启服务
systemctl restart starx-oauth

# 查看端口占用
ss -tlnp | grep 3002

# 手动释放端口
fuser -k 3002/tcp
```

## 更新部署

```bash
cd /www/wwwroot/auth.star-web.top

# 停止服务
systemctl stop starx-oauth

# 拉取新代码（如果是 Git 仓库）
git pull

# 重新安装依赖
npm install

# 重新构建
npm run build

# 重启服务
systemctl start starx-oauth
```

## 数据库备份

```bash
# 创建备份
pg_dump --format=custom --no-owner --no-acl \
  --file "backups/starx-oauth-$(date +%Y%m%d-%H%M%S).dump" \
  $DATABASE_URL

# 恢复到备份
pg_restore --clean --if-exists --no-owner --no-acl \
  --dbname $DATABASE_URL backups/starx-oauth-备份日期.dump
```

## 监控连接码

建议配置定时任务检查即将到期或长期未使用的连接码：

```bash
# 添加到 crontab
crontab -e

# 每天早上 9 点检查
0 9 * * * cd /www/wwwroot/auth.star-web.top && npm run monitor:connection-codes -- --warn-only >> /var/log/starx-oauth-monitor.log 2>&1
```

## 故障排除

### 服务无法启动

1. 检查端口是否被占用：`ss -tlnp | grep 3002`
2. 检查环境变量是否正确配置
3. 查看错误日志：`tail /var/log/starx-oauth-error.log`

### 数据库连接失败

1. 确认 PostgreSQL 服务运行中
2. 检查 `DATABASE_URL` 格式是否正确
3. 验证数据库用户权限

### Nginx 502 Bad Gateway

1. 检查 Next.js 服务是否运行
2. 检查 Nginx 配置的代理端口是否正确
3. 查看 Nginx 错误日志
