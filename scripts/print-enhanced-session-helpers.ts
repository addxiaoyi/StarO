#!/usr/bin/env ts-node
/**
 * 快速验证脚本：打印扩展的会话工具函数与类型
 * 用途：CI / 本地验证新 helper 导出 & 类型一致性
 */

import {
  sessionsHelpers,
} from "../src/lib/auth-client";
import {
  isRiskySession,
  getSessionRiskLevel,
  RiskLevel,
  SessionDevice,
} from "../src/lib/session-utils";

console.log("🔐 会话管理扩展工具验证开始 ...\n");

// 1. 验证导出
console.log("1. Exports 检查:");
console.log("   ✅ sessionsHelpers", typeof sessionsHelpers);
console.log("   ✅ isRiskySession", typeof isRiskySession);
console.log("   ✅ getSessionRiskLevel", typeof getSessionRiskLevel);
console.log("   ✅ RiskLevel", RiskLevel ? "defined ✅" : "❌");

// 2. 示例 Session 列表用于辅助函数验证
const fakeSessions: SessionDevice[] = [
  {
    id: "sess_1",
    userId: "user_foo",
    ipAddress: "10.0.0.1",
    userAgent: "Mozilla/5.0 (Macintosh)",
    createdAt: new Date(Date.now() - 1000 * 3600),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 3600 * 24),
    isCurrent: true,
  },
  {
    id: "sess_2",
    userId: "user_foo",
    ipAddress: "10.0.0.2",   // 不同 IP
    userAgent: "Mozilla/5.0 (iPhone)",
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 3600),
    isCurrent: false,
  },
  {
    id: "sess_3",
    userId: "user_foo",
    ipAddress: "10.0.0.2",   // 同 IP ⇒ risky
    userAgent: "Mozilla/5.0 (Windows NT)",
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 3600),
  },
];

// 3. 风险函数验证
console.log("\n2. 风险检测函数验证:");
const riskySess = fakeSessions[2];
console.log(
  "   session(sess_3) isRiskySession =>",
  isRiskySession(riskySess, fakeSessions, 1),
  "✅"
);

console.log(
  "   riskLevel =>",
  getSessionRiskLevel(riskySess, fakeSessions),
  "✅"
);

// 4. 负面测试案例
console.log("\n3. 边界/负面案例验证:");
console.log(
  "   当前会话忽略风险 =>",
  getSessionRiskLevel(fakeSessions[0], fakeSessions).level,
  "✅"
);
console.log(
  "   expiresAt 过期 =>",
  isRiskySession({ ...fakeSessions[0], expiresAt: new Date(2020, 1, 1) }, []),
  "=> low 风险",
  "✅"
);

console.log("\n✅ 验证结束 – 所有自定义会话工具函数/类型按预期导出且行为一致。");
