# X-Oauth API 文档

本文档说明 X-Oauth 提供的认证 API 和 OAuth 接口。

## 基础信息

- **Base URL**: `https://auth.star-web.top`（生产环境）或 `http://localhost:3000`（本地开发）
- **认证 API 前缀**: `/api/auth`
- **OpenID 配置**: `/.well-known/openid-configuration`
- **OAuth 授权服务器配置**: `/.well-known/oauth-authorization-server/api/auth`

## 认证 API

所有认证 API 通过 `/api/auth/[...all]` 路由处理。

### 核心认证端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/sign-up/email` | 邮箱注册 |
| POST | `/api/auth/sign-in/email` | 邮箱密码登录 |
| POST | `/api/auth/sign-in/magic-link` | 邮件链接登录 |
| POST | `/api/auth/sign-out` | 退出登录 |
| GET | `/api/auth/get-session` | 获取当前会话 |
| POST | `/api/auth/revoke-other-sessions` | 退出其他设备 |

### 邮箱验证

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/verify-email` | 验证邮箱 Token |
| POST | `/api/auth/verify-email` | 重新发送验证邮件 |

### 密码重置

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/request-password-reset` | 请求密码重置 |
| POST | `/api/auth/reset-password` | 重置密码 |

### 两步验证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/two-factor/enable` | 开启两步验证 |
| POST | `/api/auth/two-factor/disable` | 关闭两步验证 |
| POST | `/api/auth/two-factor/send-otp` | 发送验证码 |
| POST | `/api/auth/two-factor/verify-otp` | 验证邮箱验证码 |
| POST | `/api/auth/two-factor/verify-totp` | 验证 TOTP 验证码 |

### 设备管理（Passkey）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/passkey/add` | 添加设备 |
| POST | `/api/auth/passkey/remove` | 移除设备 |
| POST | `/api/auth/sign-in/passkey` | 设备登录 |

### 连接码（API Key）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/api-key/create` | 创建连接码 |
| GET | `/api/auth/api-key/list` | 列出连接码 |
| POST | `/api/auth/api-key/update` | 更新连接码 |
| POST | `/api/auth/api-key/delete` | 删除连接码 |

### 成员管理（Admin）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/admin/list-users` | 列出用户 |
| POST | `/api/auth/admin/create-user` | 创建用户 |
| POST | `/api/auth/admin/revoke-user-sessions` | 撤销用户会话 |
| POST | `/api/auth/admin/ban-user` | 封禁用户 |
| POST | `/api/auth/admin/unban-user` | 解封用户 |

### 组织管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/organization/list` | 列出组织 |
| POST | `/api/auth/organization/create` | 创建组织 |
| GET | `/api/auth/organization/:id/members` | 列出成员 |
| POST | `/api/auth/organization/:id/invite` | 邀请成员 |
| POST | `/api/auth/organization/:id/remove-member` | 移除成员 |

## OAuth 2.0 接口

### OAuth 注册（客户端）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/oauth2/client/register` | 注册 OAuth 客户端 |
| GET | `/api/auth/oauth2/client/list` | 列出客户端 |
| POST | `/api/auth/oauth2/client/rotate-secret` | 轮换客户端密钥 |
| DELETE | `/api/auth/oauth2/client/:id` | 删除客户端 |

### OAuth 授权

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/oauth2/authorize` | 授权端点 |
| POST | `/api/auth/oauth2/token` | 获取 Token |
| GET | `/api/auth/oauth2/userinfo` | 获取用户信息 |
| POST | `/api/auth/oauth2/revoke` | 撤销 Token |

## 社交登录

### 支持的提供商

- Google: `/api/auth/sign-in/google`
- GitHub: `/api/auth/sign-in/github`
- Discord: `/api/auth/sign-in/discord`
- Microsoft: `/api/auth/sign-in/microsoft`

## 使用示例

### 邮箱登录

```bash
curl -X POST https://auth.star-web.top/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### 获取会话

```bash
curl https://auth.star-web.top/api/auth/get-session \
  -H "Cookie: <session_cookie>"
```

### 创建连接码

```bash
curl -X POST https://auth.star-web.top/api/auth/api-key/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"My Integration","expiresIn":2592000}'
```

### OAuth 客户端注册

```bash
curl -X POST https://auth.star-web.top/api/auth/oauth2/client/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "client_name":"My App",
    "redirect_uris":["https://myapp.com/callback"],
    "grant_types":["authorization_code","refresh_token"]
  }'
```

## 响应格式

### 成功响应

```json
{
  "status": true,
  "data": { ... }
}
```

### 错误响应

```json
{
  "status": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "邮箱或密码不正确"
  }
}
```

## OpenID Connect

### 发现文档

```
GET /.well-known/openid-configuration
```

返回 OpenID Connect 发现文档，包含：
- `issuer`: 发行者标识
- `authorization_endpoint`: 授权端点
- `token_endpoint`: Token 端点
- `userinfo_endpoint`: 用户信息端点
- `jwks_uri`: JSON Web Key Set URI

### JWT 验证

使用 `/api/auth/jwks` 端点获取公钥进行 JWT 验证。

## 错误码

| 错误码 | 说明 |
|--------|------|
| `INVALID_CREDENTIALS` | 邮箱或密码不正确 |
| `USER_NOT_FOUND` | 用户不存在 |
| `EMAIL_NOT_VERIFIED` | 邮箱未验证 |
| `SESSION_EXPIRED` | 会话已过期 |
| `RATE_LIMIT_EXCEEDED` | 请求过于频繁 |
| `INVALID_TOKEN` | 无效的 Token |
| `ACCESS_DENIED` | 访问被拒绝 |
