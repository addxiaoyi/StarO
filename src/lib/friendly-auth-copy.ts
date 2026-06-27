const friendlyErrorRules: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /too many requests|rate limit|429/i, message: "操作太频繁了，请稍后再试。" },
  { pattern: /invalid credentials|wrong password|invalid password|incorrect password/i, message: "邮箱或密码不正确，请重新输入。" },
  { pattern: /user not found|account not found|could not find user/i, message: "没有找到这个账号，请检查邮箱是否输入正确。" },
  { pattern: /email.*not.*verified|verify.*email/i, message: "请先确认邮箱，再继续。" },
  { pattern: /already exists|already been used|email.*taken/i, message: "这个邮箱已经注册过了，可以直接登录。" },
  { pattern: /password.*too short|minimum.*8|minlength/i, message: "密码至少需要 8 位。" },
  { pattern: /password.*weak|weak password/i, message: "请换一个更安全的密码。" },
  { pattern: /token.*expired|expired token|code.*expired|otp.*expired/i, message: "邮件里的按钮或 6 位数字已过期，请重新获取。" },
  { pattern: /invalid token|bad token|token.*invalid/i, message: "这封邮件里的按钮已失效，请重新获取一封邮件。" },
  { pattern: /invalid code|incorrect code|otp.*invalid|totp.*invalid/i, message: "6 位数字不正确，请重新输入。" },
  { pattern: /not supported|unsupported|securityerror|publickeycredential/i, message: "当前浏览器暂不支持用设备登录，可以先使用邮箱和密码登录。" },
  { pattern: /notallowederror|aborterror|passkey|webauthn.*cancel/i, message: "已取消。可以继续用密码登录。" },
  { pattern: /network|fetch failed|load failed|failed to fetch/i, message: "网络似乎有点问题，请稍后再试。" },
  { pattern: /session.*expired|unauthorized|forbidden/i, message: "登录已过期，请重新登录后再试。" },
];

export function toFriendlyAuthMessage(message: string | undefined, fallback: string) {
  const trimmed = message?.trim();

  if (!trimmed) {
    return fallback;
  }

  for (const rule of friendlyErrorRules) {
    if (rule.pattern.test(trimmed)) {
      return rule.message;
    }
  }

  if (/[A-Za-z]/.test(trimmed) && !/[\u4e00-\u9fff]/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
