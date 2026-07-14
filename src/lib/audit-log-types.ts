/**
 * 审计日志类型定义
 * 此文件仅包含类型定义，不包含任何 Node.js 特定代码
 * 可以安全地在客户端组件中导入
 */

/**
 * 审计日志事件类型
 */
export const AUDIT_EVENT_TYPES = [
  // 认证相关
  "auth.login",
  "auth.login_failed",
  "auth.logout",
  "auth.sign_up",
  "auth.email_verify",
  "auth.password_reset",
  "auth.password_change",

  // MFA 相关
  "auth.two_factor_enabled",
  "auth.two_factor_disabled",
  "auth.two_factor_setup",
  "auth.two_factor_verified",

  // Passkey 相关
  "passkey.registered",
  "passkey.deleted",
  "passkey.used",

  // 用户相关
  "user.profile_update",
  "user.email_change",
  "user.password_change",
  "user.ban",
  "user.unban",
  "user.delete",

  // 会话相关
  "user.session.revoke",
  "user.session.create",

  // API Key 相关
  "api_key.create",
  "api_key.update",
  "api_key.delete",
  "api_key.used",

  // 组织相关
  "organization.create",
  "organization.update",
  "organization.delete",
  "organization.member.add",
  "organization.member.update",
  "organization.member.remove",
  "organization.role.change",

  // OAuth 相关
  "oauth.authorize",
  "oauth.token",
  "oauth.revoke",
] as const;

export type AuditEventType = typeof AUDIT_EVENT_TYPES[number];

/**
 * 审计日志事件标签（中文）
 */
export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  // 认证相关
  "auth.login": "用户登录",
  "auth.login_failed": "登录失败",
  "auth.logout": "用户登出",
  "auth.sign_up": "用户注册",
  "auth.email_verify": "邮箱验证",
  "auth.password_reset": "密码重置",
  "auth.password_change": "密码修改",

  // MFA 相关
  "auth.two_factor_enabled": "启用两步验证",
  "auth.two_factor_disabled": "禁用两步验证",
  "auth.two_factor_setup": "设置两步验证",
  "auth.two_factor_verified": "两步验证通过",

  // Passkey 相关
  "passkey.registered": "注册 Passkey",
  "passkey.deleted": "删除 Passkey",
  "passkey.used": "使用 Passkey 登录",

  // 用户相关
  "user.profile_update": "更新个人资料",
  "user.email_change": "修改邮箱",
  "user.password_change": "修改密码",
  "user.ban": "封禁用户",
  "user.unban": "解除封禁",
  "user.delete": "删除用户",

  // 会话相关
  "user.session.revoke": "撤销会话",
  "user.session.create": "创建会话",

  // API Key 相关
  "api_key.create": "创建 API 密钥",
  "api_key.update": "更新 API 密钥",
  "api_key.delete": "删除 API 密钥",
  "api_key.used": "使用 API 密钥",

  // 组织相关
  "organization.create": "创建组织",
  "organization.update": "更新组织",
  "organization.delete": "删除组织",
  "organization.member.add": "添加成员",
  "organization.member.update": "更新成员",
  "organization.member.remove": "移除成员",
  "organization.role.change": "修改角色",

  // OAuth 相关
  "oauth.authorize": "OAuth 授权",
  "oauth.token": "OAuth 获取令牌",
  "oauth.revoke": "OAuth 撤销令牌",
};

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  id: string;
  event: AuditEventType;
  actorId?: string;
  actorEmail?: string;
  targetUserId?: string;
  targetEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}
