import { getPool } from "./db";

/**
 * 审计日志事件类型
 */
export type AuditEventType =
  // 用户管理
  | "user.create"
  | "user.delete"
  | "user.ban"
  | "user.unban"
  | "user.role.change"
  | "user.session.revoke"
  // 认证事件
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.magic_link_sent"
  | "auth.magic_link_used"
  | "auth.password_reset_requested"
  | "auth.password_reset_completed"
  | "auth.email_verified"
  | "auth.two_factor_enabled"
  | "auth.two_factor_disabled"
  // OAuth
  | "oauth.consent_granted"
  | "oauth.consent_denied"
  // API 密钥
  | "api_key.create"
  | "api_key.delete"
  | "api_key.rotate"
  // Passkey
  | "passkey.registered"
  | "passkey.deleted";

/**
 * 审计日志记录
 */
export interface AuditLogEntry {
  id?: string;
  event: AuditEventType;
  actorId?: string;
  actorEmail?: string;
  targetUserId?: string;
  targetEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

/**
 * 审计日志表名
 */
const AUDIT_LOG_TABLE = "audit_logs";

/**
 * 初始化审计日志表
 */
export async function initAuditLogTable(): Promise<void> {
  const pool = getPool();
  if (!pool) {
    console.warn("[audit] No database pool available - audit logs will be skipped");
    return;
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS ${AUDIT_LOG_TABLE} (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event VARCHAR(100) NOT NULL,
      actor_id VARCHAR(255),
      actor_email VARCHAR(255),
      target_user_id VARCHAR(255),
      target_email VARCHAR(255),
      ip_address INET,
      user_agent TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON ${AUDIT_LOG_TABLE}(event);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON ${AUDIT_LOG_TABLE}(actor_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON ${AUDIT_LOG_TABLE}(target_user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON ${AUDIT_LOG_TABLE}(created_at DESC);
  `;

  try {
    await pool.query(sql);
  } catch (error) {
    console.error("[audit] Failed to init table:", error);
  }
}

/**
 * 写入审计日志
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  const pool = getPool();
  if (!pool) {
    return; // 静默跳过
  }

  const id = entry.id || crypto.randomUUID();
  const now = entry.createdAt || new Date();

  const sql = `
    INSERT INTO ${AUDIT_LOG_TABLE} (
      id, event, actor_id, actor_email, target_user_id, target_email,
      ip_address, user_agent, metadata, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `;

  const params = [
    id,
    entry.event,
    entry.actorId || null,
    entry.actorEmail || null,
    entry.targetUserId || null,
    entry.targetEmail || null,
    entry.ipAddress || null,
    entry.userAgent || null,
    JSON.stringify(entry.metadata || {}),
    now,
  ];

  try {
    await pool.query(sql, params);
  } catch (error) {
    // 审计日志失败不应阻断业务
    console.error("[audit] Failed to write audit log:", { entry, error });
  }
}

/**
 * 获取审计日志 (带分页)
 */
export interface AuditLogQuery {
  event?: string;  // AuditEventType but accepts any string for flexibility
  actorId?: string;
  targetUserId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogResult {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export async function queryAuditLogs(query: AuditLogQuery): Promise<AuditLogResult> {
  const pool = getPool();
  if (!pool) {
    return { logs: [], total: 0, limit: query.limit || 50, offset: query.offset || 0 };
  }

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (query.event) {
    conditions.push(`event = $${paramIndex++}`);
    params.push(query.event);
  }
  if (query.actorId) {
    conditions.push(`actor_id = $${paramIndex++}`);
    params.push(query.actorId);
  }
  if (query.targetUserId) {
    conditions.push(`target_user_id = $${paramIndex++}`);
    params.push(query.targetUserId);
  }
  if (query.startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(query.startDate);
  }
  if (query.endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(query.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = query.limit || 50;
  const offset = query.offset || 0;

  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM ${AUDIT_LOG_TABLE} ${whereClause}`;
  const countResult = await pool.query(countSql, params);
  const total = Number(countResult.rows[0]?.total || 0);

  // 查询日志
  const sql = `
    SELECT id, event, actor_id, actor_email, target_user_id, target_email,
           ip_address, user_agent, metadata, created_at
    FROM ${AUDIT_LOG_TABLE}
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const result = await pool.query(sql, [...params, limit, offset]);

  return {
    logs: result.rows.map((row) => ({
      id: row.id,
      event: row.event as AuditEventType,
      actorId: row.actor_id || undefined,
      actorEmail: row.actor_email || undefined,
      targetUserId: row.target_user_id || undefined,
      targetEmail: row.target_email || undefined,
      ipAddress: row.ip_address || undefined,
      userAgent: row.user_agent || undefined,
      metadata: row.metadata,
      createdAt: row.created_at,
    })),
    total,
    limit,
    offset,
  };
}

/**
 * 辅助函数：从请求提取审计上下文
 */
export function extractAuditContext(request: Request): Pick<AuditLogEntry, "ipAddress" | "userAgent"> {
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  };
}

/**
 * 辅助函数：包装带审计的操作
 */
export async function withAudit<T>(
  event: AuditEventType,
  operation: () => Promise<T>,
  entry: Omit<AuditLogEntry, "event" | "createdAt">
): Promise<T> {
  const startTime = Date.now();
  let result: T;
  let error: unknown;

  try {
    result = await operation();
    return result;
  } catch (err) {
    error = err;
    throw err;
  } finally {
    const duration = Date.now() - startTime;

    // 异步写入，不阻塞主流程
    writeAuditLog({
      ...entry,
      event,
      metadata: {
        ...entry.metadata,
        duration_ms: duration,
        success: !error,
        error: error instanceof Error ? error.message : String(error),
      },
    }).catch(() => {}); // 静默失败
  }
}

/**
 * 审计日志事件描述 (中文)
 */
export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  "user.create": "创建用户",
  "user.delete": "删除用户",
  "user.ban": "封禁用户",
  "user.unban": "解封用户",
  "user.role.change": "变更角色",
  "user.session.revoke": "撤销会话",
  "auth.login": "登录成功",
  "auth.login_failed": "登录失败",
  "auth.logout": "登出",
  "auth.magic_link_sent": "发送魔法链接",
  "auth.magic_link_used": "使用魔法链接登录",
  "auth.password_reset_requested": "请求重置密码",
  "auth.password_reset_completed": "完成密码重置",
  "auth.email_verified": "验证邮箱",
  "auth.two_factor_enabled": "启用两步验证",
  "auth.two_factor_disabled": "禁用两步验证",
  "oauth.consent_granted": "授权同意",
  "oauth.consent_denied": "授权拒绝",
  "api_key.create": "创建 API 密钥",
  "api_key.delete": "删除 API 密钥",
  "api_key.rotate": "轮换 API 密钥",
  "passkey.registered": "注册 Passkey",
  "passkey.deleted": "删除 Passkey",
};
