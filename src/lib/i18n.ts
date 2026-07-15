/**
 * Internationalization (i18n) support for X-Oauth
 *
 * Currently supports: Chinese (zh-CN), English (en)
 * Messages are grouped by domain for maintainability
 */

export type Locale = "zh-CN" | "en";

export const locales: Locale[] = ["zh-CN", "en"];

export const defaultLocale: Locale = "zh-CN";

// Message types for type safety
export interface AuthMessages {
  signIn: {
    title: string;
    email: string;
    password: string;
    submit: string;
    forgotPassword: string;
    noAccount: string;
  };
  signUp: {
    title: string;
    email: string;
    name: string;
    password: string;
    confirmPassword: string;
    submit: string;
    hasAccount: string;
  };
  passwordReset: {
    title: string;
    email: string;
    submit: string;
    backToSignIn: string;
  };
}

export interface CommonMessages {
  loading: string;
  error: string;
  success: string;
  confirm: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
}

export interface Messages {
  auth: AuthMessages;
  common: CommonMessages;
  [key: string]: unknown;
}

// Chinese translations (default)
export const zhCN: Messages = {
  auth: {
    signIn: {
      title: "登录",
      email: "邮箱",
      password: "密码",
      submit: "登录",
      forgotPassword: "找回密码",
      noAccount: "没有账号？",
    },
    signUp: {
      title: "创建账号",
      email: "邮箱",
      name: "姓名",
      password: "密码",
      confirmPassword: "确认密码",
      submit: "创建账号",
      hasAccount: "已有账号？",
    },
    passwordReset: {
      title: "找回登录密码",
      email: "邮箱",
      submit: "发送",
      backToSignIn: "返回登录",
    },
  },
  common: {
    loading: "加载中...",
    error: "出错了",
    success: "成功",
    confirm: "确认",
    cancel: "取消",
    save: "保存",
    delete: "删除",
    edit: "编辑",
  },
};

// English translations
export const en: Messages = {
  auth: {
    signIn: {
      title: "Sign In",
      email: "Email",
      password: "Password",
      submit: "Sign In",
      forgotPassword: "Forgot Password",
      noAccount: "Don't have an account?",
    },
    signUp: {
      title: "Create Account",
      email: "Email",
      name: "Name",
      password: "Password",
      confirmPassword: "Confirm Password",
      submit: "Create Account",
      hasAccount: "Already have an account?",
    },
    passwordReset: {
      title: "Reset Password",
      email: "Email",
      submit: "Send",
      backToSignIn: "Back to Sign In",
    },
  },
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
  },
};

// Translation maps
const translations: Record<Locale, Messages> = {
  "zh-CN": zhCN,
  "en": en,
};

/**
 * Get translations for a specific locale
 */
export function getTranslations(locale: Locale = defaultLocale): Messages {
  return translations[locale] || translations[defaultLocale];
}

/**
 * Detect locale from request headers
 */
export function detectLocale(request: Request): Locale {
  // Check Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    // Simple detection - prefer first language
    const primaryLang = acceptLanguage.split(",")[0].split(";")[0].trim();

    // Match against supported locales
    if (primaryLang.startsWith("en")) {
      return "en";
    }
    if (primaryLang.startsWith("zh")) {
      return "zh-CN";
    }
  }

  return defaultLocale;
}

/**
 * Get nested translation value by path
 */
export function t(translations: Messages, path: string): string {
  const keys = path.split(".");
  let result: unknown = translations;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return path as fallback
    }
  }

  return typeof result === "string" ? result : path;
}
