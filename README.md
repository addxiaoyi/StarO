# StarX-Oauth

StarX-Oauth 是一个独立的账号中心，基于 Next.js App Router 和 Better Auth 构建。产品名称、页面文案、邮件内容和界面品牌都围绕 StarX-Oauth 统一维护。

## 用户可见功能

- 邮箱和密码登录、创建账号、确认邮箱和找回登录密码。
- 不想输入密码时，可以通过邮件按钮继续登录。
- 已添加的电脑或手机可以更快确认身份。
- 登录时可以用验证器应用或登录邮箱多确认一次。
- 账号中心可管理已登录设备、连接码和退出账号。
- 连接码可查看有效期、最后使用时间，并可暂停、延长或撤销。
- 成员管理可添加成员、分配权限、退出成员其他设备，或临时暂停账号。
- 应用接入可登记第三方应用、维护回调地址、轮换应用密钥或移除应用。
- 应用访问确认会先说明应用想查看什么，再由用户决定是否继续。
- 配置 Google、GitHub、Discord 或 Microsoft 后，可使用常用账号登录。

## 开发和部署说明

- 前端页面和服务端接口都放在 Next.js App Router 中。
- Better Auth 负责账号登录、确认邮箱、设备登录、登录多一步确认和账号会话。
- 配好 Google、GitHub、Discord 或 Microsoft 后，可以打开常用账号登录。
- 内置应用访问确认、账号选择和团队信息确认页面。
- 外部工具连接使用服务端能力处理，界面里统一称为连接码。
- 本地没有配置 `DATABASE_URL` 时，会使用内存模式，方便快速试用界面和账号流程。

## 本地启动

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

本地开发时如果没有设置 `DATABASE_URL`，StarX-Oauth 会使用内存模式。这样重启服务后数据会清空，适合试流程；正式上线请使用 PostgreSQL。

## 环境变量

把 `.env.example` 复制成 `.env.local`，再填入需要启用的配置。

```bash
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

EMAIL_FROM=StarX-Oauth <noreply@example.com>
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=

STARX_ADMIN_USER_IDS=
STARX_DEV_ADMIN_EMAIL=
STARX_DEV_ADMIN_NAME=
STARX_DEV_ADMIN_PASSWORD_HASH=
STARX_USE_MEMORY_DB=

STARX_ALLOW_DYNAMIC_CLIENT_REGISTRATION=

STARX_FIRST_ADMIN_EMAIL=
STARX_FIRST_ADMIN_NAME=
STARX_FIRST_ADMIN_PASSWORD=
STARX_FIRST_ADMIN_PASSWORD_HASH=
```

`STARX_ADMIN_USER_IDS` 用英文逗号分隔，用来指定哪些用户是管理员。

本地没有配置 `DATABASE_URL` 时，可以设置 `STARX_DEV_ADMIN_EMAIL` 自动创建一个内存管理员账号。用这个邮箱和本地默认密码 `Password123!` 登录即可。这个种子账号只会在 Better Auth 指向 `localhost` 或 `127.0.0.1` 时启用；设置了 `DATABASE_URL` 后会自动跳过。需要在本地生产模式或 E2E 中强制使用内存模式时，可以设置 `STARX_USE_MEMORY_DB=true`，但它只在本地地址下生效。需要换本地密码时，可以用 `STARX_DEV_ADMIN_PASSWORD_HASH` 覆盖默认密码哈希。

生产环境默认关闭匿名 OAuth 动态客户端注册；已登录用户仍可在应用接入页面登记应用。只有确实需要公开 `/api/auth/oauth2/register` 时，才设置 `STARX_ALLOW_DYNAMIC_CLIENT_REGISTRATION=true`。

正式环境初始化第一个管理员时，先设置 `DATABASE_URL`、`STARX_FIRST_ADMIN_EMAIL` 和 `STARX_FIRST_ADMIN_PASSWORD`，再运行 `npm run db:seed-admin`。如果密码哈希由外部安全流程生成，也可以用 `STARX_FIRST_ADMIN_PASSWORD_HASH` 代替明文密码变量。

## 常用命令

```bash
npm run dev
npm run typecheck
npm run build
npm run start
npm run db:migration
npm run db:migration:apply
npm run db:seed-admin
npm run monitor:connection-codes
npm run test:e2e
```

## 主要页面和接口

- `/api/auth/[...all]` 账号接口。
- `/.well-known/oauth-authorization-server/api/auth` OAuth 授权服务器元数据。
- `/.well-known/openid-configuration` OpenID Discovery 元数据。
- `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`, `/two-factor`.
- `/dashboard` 账号中心。
- `/admin` 成员管理。
- `/applications` 应用接入。
- `/oauth/consent`, `/oauth/select-account`, `/oauth/select-organization`.

## 上线前检查

- 为 `BETTER_AUTH_SECRET` 设置足够长的随机值。
- 通过 `DATABASE_URL` 使用 PostgreSQL。
- 先运行 `npm run db:migration` 生成并审阅 Better Auth 表结构迁移，再运行 `npm run db:migration:apply` 应用到目标数据库。
- 使用 `npm run db:seed-admin` 初始化首个管理员，完成后从部署环境移除 `STARX_FIRST_ADMIN_PASSWORD`。
- 正式环境不要设置 `STARX_DEV_ADMIN_*` 变量。
- 在各第三方平台配置回调地址。
- 配置 `RESEND_API_KEY` 或 SMTP，并设置 `EMAIL_FROM`，让认证邮件可以真实发出。
- 连接码、第三方登录密钥和其他服务端密钥只放在服务端。
- 定时运行 `npm run monitor:connection-codes`，把即将到期、长期未使用或接近限流上限的连接码接入告警。
- 数据库备份、恢复、迁移和回滚步骤见 `docs/production-runbook.md`。
- 宝塔部署详细步骤见 `docs/deployment.md`。
- 安全配置检查清单见 `docs/security-checklist.md`。
- API 接口文档见 `docs/api.md`。
