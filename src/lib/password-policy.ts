/**
 * 密码强度验证策略
 *
 * 要求:
 * - 至少 8 位字符
 * - 至少 1 个大写字母
 * - 至少 1 个小写字母
 * - 至少 1 个数字
 * - 至少 1 个特殊字符 (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
  specialChars: string;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
  specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

export interface PasswordStrengthResult {
  valid: boolean;
  score: number; // 0-4
  errors: string[];
  suggestions: string[];
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordStrengthResult {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // 长度检查
  if (password.length < policy.minLength) {
    errors.push(`密码至少需要 ${policy.minLength} 位字符`);
    suggestions.push(`密码至少 ${policy.minLength} 位`);
  }

  // 大写字母检查
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("密码需要包含至少 1 个大写字母");
    suggestions.push("添加大写字母 (A-Z)");
  }

  // 小写字母检查
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("密码需要包含至少 1 个小写字母");
    suggestions.push("添加小写字母 (a-z)");
  }

  // 数字检查
  if (policy.requireDigit && !/[0-9]/.test(password)) {
    errors.push("密码需要包含至少 1 个数字");
    suggestions.push("添加数字 (0-9)");
  }

  // 特殊字符检查
  if (policy.requireSpecial) {
    const escapedSpecials = policy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const specialRegex = new RegExp(`[${escapedSpecials}]`);
    if (!specialRegex.test(password)) {
      errors.push(`密码需要包含至少 1 个特殊字符 (${policy.specialChars})`);
      suggestions.push(`添加特殊字符 (如 !@#$)`);
    }
  }

  // 计算强度分数 (0-4)
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(4, score);

  // 如果密码太简单，添加建议
  if (password.length > 0 && password.length < 8) {
    suggestions.push("使用至少 8 位字符");
  }

  return {
    valid: errors.length === 0,
    score,
    errors,
    suggestions,
  };
}

/**
 * 获取密码强度描述
 */
export function getPasswordStrengthLabel(score: number): {
  label: string;
  color: string;
} {
  switch (score) {
    case 0:
      return { label: "太弱", color: "text-red-400" };
    case 1:
      return { label: "弱", color: "text-orange-400" };
    case 2:
      return { label: "中等", color: "text-yellow-400" };
    case 3:
      return { label: "强", color: "text-green-400" };
    case 4:
      return { label: "非常强", color: "text-emerald-400" };
    default:
      return { label: "未知", color: "text-zinc-400" };
  }
}

/**
 * 密码强度指示器颜色
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
      return "bg-red-500";
    case 1:
      return "bg-orange-500";
    case 2:
      return "bg-yellow-500";
    case 3:
      return "bg-green-500";
    case 4:
      return "bg-emerald-500";
    default:
      return "bg-zinc-500";
  }
}

/**
 * 辅助函数：检查密码是否常见弱密码
 */
const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "qwerty", "abc123",
  "monkey", "1234567", "letmein", "trustno1", "dragon",
  "baseball", "iloveyou", "master", "sunshine", "ashley",
  "football", "password1", "shadow", "123123", "654321",
]);

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}
