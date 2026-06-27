# Commit Message Convention

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

## 格式

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能）|
| `refactor` | 重构（不是新功能或修复）|
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建或依赖更新 |
| `ci` | CI/CD 配置 |
| `chore` | 其他杂项 |

## 示例

```bash
# 新功能
git commit -m "feat(auth): 添加 Passkey 登录支持"

# Bug 修复
git commit -m "fix(session): 修复会话过期后重复登录问题"

# 文档更新
git commit -m "docs(readme): 更新部署说明"

# 重构
git commit -m "refactor(api): 重构认证中间件"

# 构建更新
git commit -m "build(deps): 升级 Next.js 到 16.2.7"

# CI/CD
git commit -m "ci: 添加 GitHub Actions 部署流程"
```

## 作用域 (scope)

- `auth` - 认证相关
- `oauth` - OAuth/OIDC
- `api` - API 端点
- `ui` - 用户界面
- `db` - 数据库
- `deploy` - 部署相关
- `deps` - 依赖
- `config` - 配置
- `docs` - 文档

## 自动生成变更日志

```bash
# 安装 conventional-changelog-cli
npm install -g conventional-changelog-cli

# 生成变更日志
conventional-changelog -p angular -i CHANGELOG.md -s
```