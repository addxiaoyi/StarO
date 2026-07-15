# X-Oauth 安全检查清单

本文档提供部署 X-Oauth 时的安全检查清单。

## 生产环境检查

### 必需的安全配置

- [ ] `BETTER_AUTH_SECRET` 已设置为足够长的随机值（至少 32 字节）
  - 使用 `openssl rand -hex 32` 生成
  - 不要使用默认值或弱密钥

- [ ] `DATABASE_URL` 使用强密码
  - PostgreSQL 用户密码应足够复杂
  - 避免使用默认端口或常见密码

- [ ] HTTPS 已正确配置
  - Nginx SSL 证书有效且未过期
  - 强制使用 HTTPS
  - HSTS 头已配置（可选）

- [ ] `RESEND_API_KEY` 已正确配置
  - 使用真实的邮件发送服务
  - `EMAIL_FROM` 使用已验证的域名邮箱

### 临时变量已清理

- [ ] 生产环境未设置 `STARX_DEV_ADMIN_*` 变量
- [ ] `STARX_FIRST_ADMIN_PASSWORD` 在创建管理员后已移除
- [ ] `.env` 文件未提交到代码仓库

### OAuth 提供商配置

- [ ] Google OAuth
  - [ ] `GOOGLE_CLIENT_ID` 已配置
  - [ ] `GOOGLE_CLIENT_SECRET` 已配置
  - [ ] 回调 URL 已添加到 Google Cloud Console

- [ ] GitHub OAuth
  - [ ] `GITHUB_CLIENT_ID` 已配置
  - [ ] `GITHUB_CLIENT_SECRET` 已配置
  - [ ] 回调 URL 已添加到 GitHub OAuth Apps

- [ ] Discord OAuth
  - [ ] `DISCORD_CLIENT_ID` 已配置
  - [ ] `DISCORD_CLIENT_SECRET` 已配置
  - [ ] 回调 URL 已添加到 Discord Developer Portal

- [ ] Microsoft OAuth
  - [ ] `MICROSOFT_CLIENT_ID` 已配置
  - [ ] `MICROSOFT_CLIENT_SECRET` 已配置
  - [ ] 回调 URL 已添加到 Azure AD App Registrations

## 代码安全

### 输入验证

- [ ] 表单输入已验证
- [ ] 密码强度要求已强制（至少 8 位）
- [ ] 邮箱格式已验证
- [ ] URL 回调地址已验证

### 敏感数据处理

- [ ] 密码从不记录到日志
- [ ] API 密钥只在服务端处理
- [ ] 环境变量用于所有敏感配置
- [ ] `.env` 文件已添加到 `.gitignore`

### 会话安全

- [ ] Cookie 设置了 `httpOnly`（由 Better Auth 处理）
- [ ] Cookie 设置了 `sameSite`（由 Better Auth 处理）
- [ ] 生产环境 Cookie 设置了 `secure`（由 Better Auth 处理）
- [ ] 会话超时已配置

### CORS 配置

- [ ] 开发环境 CORS 仅允许本地请求
- [ ] 生产环境 CORS 正确配置
- [ ] 敏感端点无不必要的跨域访问

## 基础设施安全

### 数据库

- [ ] PostgreSQL 只监听本地连接或受信任的网络
- [ ] 数据库用户权限最小化
- [ ] 定期备份已配置
- [ ] 备份存储在安全位置

### 服务器

- [ ] 防火墙只开放必要端口
- [ ] SSH 访问使用密钥认证
- [ ] 定期更新系统和软件包
- [ ] 日志监控已配置

### 监控和告警

- [ ] 错误日志监控已配置
- [ ] 连接码到期告警已配置
- [ ] 数据库连接问题告警已配置

## 部署后验证

运行以下命令验证部署：

```bash
# 检查服务状态
curl -k https://auth.star-web.top/api/auth/get-session

# 检查 OpenID 配置
curl -k https://auth.star-web.top/.well-known/openid-configuration

# 检查 OAuth 元数据
curl -k https://auth.star-web.top/.well-known/oauth-authorization-server/api/auth

# 检查健康端点（如果有）
curl -k https://auth.star-web.top/api/health
```

## 安全最佳实践

1. **密钥轮换**
   - 定期轮换 `BETTER_AUTH_SECRET`
   - 应用密钥可以随时轮换

2. **最小权限**
   - 数据库用户只授予必要的权限
   - OAuth 客户端使用最小必要作用域

3. **日志和监控**
   - 启用应用日志
   - 监控异常登录尝试
   - 监控连接码使用情况

4. **备份策略**
   - 定期自动备份数据库
   - 测试备份恢复流程
   - 备份存储在异地

5. **依赖更新**
   - 定期检查依赖安全更新
   - 运行 `npm audit`
   - 关注 Better Auth 安全公告
