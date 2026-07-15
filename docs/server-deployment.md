# X-Oauth 服务器部署指南

## 方式一：使用 SCP 上传（推荐）

### 1. 打包本地项目
```bash
# 在项目目录执行
tar -czvf starx-oauth-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='test-results' \
  --exclude='playwright-report' \
  --exclude='.playwright-cli' \
  .
```

### 2. 上传到服务器
```bash
scp starx-oauth-deploy.tar.gz root@186.241.74.3:/tmp/
```

### 3. SSH 登录并解压
```bash
ssh root@186.241.74.3
cd /www/wwwroot
tar -xzvf /tmp/starx-oauth-deploy.tar.gz
cd starx-oauth  # 或重命名为 starx-oauth
```

### 4. 执行部署
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 方式二：使用 rsync 同步

```bash
rsync -avz --exclude='node_modules' \
      --exclude='.next' \
      --exclude='.git' \
      --exclude='*.log' \
      . root@186.241.74.3:/www/wwwroot/starx-oauth/
```

---

## 方式三：使用 Git（推荐）

### 在服务器上
```bash
cd /www/wwwroot
git clone <your-repo-url> starx-oauth
cd starx-oauth
```

### 在本地
```bash
# 添加服务器为远程仓库
git remote add production ssh://root@186.241.74.3/www/wwwroot/starx-oauth

# 推送
git push production master
```

### 在服务器上拉取更新
```bash
cd /www/wwwroot/starx-oauth
git pull
npm install
npm run build
pm2 restart starx-oauth
```

---

## 部署后配置

### 1. 配置 Nginx（如果使用宝塔可跳过）

创建 `/www/server/panel/vhost/nginx/auth.star-web.top.conf`:

```nginx
server {
    listen 80;
    server_name auth.star-web.top;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name auth.star-web.top;
    
    ssl_certificate /www/server/panel/vhost/cert/auth.star-web.top/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/auth.star-web.top/privkey.pem;
    
    location /_next/static {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires max;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }
    
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

重载 Nginx:
```bash
nginx -t && nginx -s reload
```

### 2. 创建第一个管理员

```bash
export STARX_FIRST_ADMIN_EMAIL="admin@example.com"
export STARX_FIRST_ADMIN_NAME="管理员"
export STARX_FIRST_ADMIN_PASSWORD="你的强密码"
npm run db:seed-admin

# 创建完成后删除密码
unset STARX_FIRST_ADMIN_PASSWORD
```

### 3. 验证部署

```bash
# 检查服务状态
curl -k https://auth.star-web.top/api/auth/get-session

# 检查 OpenID 配置
curl -k https://auth.star-web.top/.well-known/openid-configuration

# 查看日志
pm2 logs starx-oauth
```

---

## 常见问题

### 1. 端口被占用
```bash
# 查看端口占用
ss -tlnp | grep 3002

# 释放端口
fuser -k 3002/tcp

# 重启服务
pm2 restart starx-oauth
```

### 2. 数据库连接失败
- 检查 `DATABASE_URL` 是否正确
- 确认 PostgreSQL 服务运行中
- 检查数据库用户权限

### 3. Nginx 502 错误
- 确认 PM2 服务运行中: `pm2 status`
- 检查端口是否正确: `ss -tlnp | grep 3002`
- 查看 PM2 日志: `pm2 logs starx-oauth`

### 4. SSL 证书问题
```bash
# 续期 Let's Encrypt 证书
certbot renew

# 或者在宝塔面板手动续期
```

---

## 快速命令参考

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs starx-oauth --lines 50

# 重启
pm2 restart starx-oauth

# 停止
pm2 stop starx-oauth

# 开机自启
pm2 save
pm2 startup

# 完全重置
pm2 delete starx-oauth
pm2 start ...
```
