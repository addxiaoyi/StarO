"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { DEFAULT_CALLBACK_URL } from "@/lib/app-config";
import { starxAuthClient } from "@/lib/auth-client";
import { toFriendlyAuthMessage } from "@/lib/friendly-auth-copy";

type SocialProviderOption = {
  id: string;
  label: string;
};

type SignInAction = "password" | "magic" | "passkey" | "social" | "";
type TwoFactorMethod = "app" | "email";
type TwoFactorAction = "send-code" | "verify" | "";

function callbackFromSearch(params: URLSearchParams) {
  return params.get("callbackURL") || params.get("callbackUrl") || DEFAULT_CALLBACK_URL;
}

function authApiCallback(callbackURL: string) {
  return callbackURL.includes("?") ? DEFAULT_CALLBACK_URL : callbackURL;
}

function useFeedback() {
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  return {
    message,
    error,
    setMessage(value: string) {
      setError("");
      setMessage(value);
    },
    setError(value: string) {
      setMessage("");
      setError(value);
    },
    clear() {
      setMessage("");
      setError("");
    },
  };
}

export function SignInForm({ socialProviders = [] }: { socialProviders?: SocialProviderOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = useMemo(() => callbackFromSearch(searchParams), [searchParams]);
  const passwordFormRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<SignInAction>("");
  const [pendingSocialProvider, setPendingSocialProvider] = useState("");
  const feedback = useFeedback();
  const signInBusy = pending || Boolean(pendingAction);

  // 邮箱格式验证
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // 防暴力破解：记录失败次数并延迟反馈
  const [failedAttempts, setFailedAttempts] = useState(0);
  const lastFailedTime = useRef<number>(0);

  function signInWithEmail(formData: FormData) {
    setPendingAction("password");
    startTransition(async () => {
      try {
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");

        // 前端输入验证
        if (!email || !isValidEmail(email)) {
          feedback.setError("请输入有效的邮箱地址");
          return;
        }
        if (!password) {
          feedback.setError("请输入密码");
          return;
        }

        // 防暴力破解：连续失败后增加延迟
        const now = Date.now();
        const timeSinceLastFailure = now - lastFailedTime.current;
        if (failedAttempts >= 3 && timeSinceLastFailure < 60000) {
          const delay = Math.min(5000, 1000 * Math.pow(2, failedAttempts - 3));
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const client = starxAuthClient();
        const result = await client.signIn.email({ email, password });

        if (result?.error) {
          // 记录失败次数
          setFailedAttempts((prev) => {
            const newCount = prev + 1;
            lastFailedTime.current = Date.now();
            return newCount;
          });
          feedback.setError(toFriendlyAuthMessage(result.error.message, "登录失败，请检查信息后重试。"));
          return;
        }

        // 登录成功，重置失败计数
        setFailedAttempts(0);
        lastFailedTime.current = 0;
        router.push(callbackURL);
      } finally {
        setPendingAction("");
      }
    });
  }

  function magicLink() {
    const formEmail = passwordFormRef.current
      ? String(new FormData(passwordFormRef.current).get("email") || "")
      : email;
    const targetEmail = formEmail.trim();

    if (!targetEmail) {
      feedback.setError("先输入邮箱，再发送登录邮件。");
      return;
    }

    setPendingAction("magic");
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        const result = await client.signIn.magicLink({ email: targetEmail, callbackURL: authApiCallback(callbackURL) });

        if (result?.error) {
          feedback.setError(toFriendlyAuthMessage(result.error.message, "登录邮件没有发送成功，请稍后再试。"));
          return;
        }

        feedback.setMessage("登录邮件已发送。请打开邮箱里的按钮继续；如果没看到，可以检查垃圾邮件。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function passkey() {
    setPendingAction("passkey");
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        const result = await client.signIn.passkey({ callbackURL: authApiCallback(callbackURL) });
        if (result?.error) {
          feedback.setError(toFriendlyAuthMessage(result.error.message, "这台设备还不能登录。先用邮箱或密码。"));
          return;
        }
        router.push(callbackURL);
      } finally {
        setPendingAction("");
      }
    });
  }

  function social(provider: string) {
    setPendingAction("social");
    setPendingSocialProvider(provider);
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        const result = await client.signIn.social({ provider, callbackURL });
        if (result?.error) {
          feedback.setError(toFriendlyAuthMessage(result.error.message, "这个登录方式暂时不可用，请先使用邮箱登录。"));
        }
      } finally {
        setPendingAction("");
        setPendingSocialProvider("");
      }
    });
  }

  return (
    <div className="grid gap-7">
      <form ref={passwordFormRef} onSubmit={(event) => submitForm(event, signInWithEmail)} className="grid gap-5">
        <TextField
          variant="line"
          label="邮箱"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          onChange={(event) => setEmail(event.currentTarget.value)}
          required
        />
        <TextField
          label="密码"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="输入密码"
          variant="line"
          required
          hint={<Link href="/forgot-password" className="text-sky-300">忘记密码？</Link>}
        />
        <Button type="submit" className="mt-1" disabled={signInBusy} aria-busy={pendingAction === "password"}>
          {pendingAction === "password" ? <Loader2 className="animate-spin" size={17} /> : null}
          {pendingAction === "password" ? "正在登录..." : "登录"}
        </Button>
      </form>

      <div className="grid gap-3 text-sm">
        <button type="button" className="focus-ring auth-link-action rounded-sm" onClick={magicLink} disabled={signInBusy} aria-busy={pendingAction === "magic"}>
          {pendingAction === "magic" ? "正在发送..." : "发送登录邮件"}
        </button>
        <button type="button" className="focus-ring auth-link-action rounded-sm" onClick={passkey} disabled={signInBusy} aria-busy={pendingAction === "passkey"}>
          {pendingAction === "passkey" ? "请按提示确认..." : "用当前设备登录"}
        </button>
        {socialProviders.length ? (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {socialProviders.map((provider) => {
              const socialPending = pendingAction === "social" && pendingSocialProvider === provider.id;
              return (
                <button
                  key={provider.id}
                  type="button"
                  className="focus-ring auth-link-action rounded-sm"
                  onClick={() => social(provider.id)}
                  disabled={signInBusy}
                  aria-busy={socialPending}
                >
                  {socialPending ? "正在跳转..." : provider.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <Feedback message={feedback.message} error={feedback.error} />
    </div>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = useMemo(() => callbackFromSearch(searchParams), [searchParams]);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const feedback = useFeedback();
  const signUpBusy = pending || submitting;

  function signUp(formData: FormData) {
    setSubmitting(true);
    startTransition(async () => {
      try {
        const name = String(formData.get("name") || "");
        const email = String(formData.get("email") || "");
        const password = String(formData.get("password") || "");
        const client = starxAuthClient();
        const result = await client.signUp.email({ name, email, password, callbackURL: authApiCallback(callbackURL) });

        if (result?.error) {
          feedback.setError(toFriendlyAuthMessage(result.error.message, "账号还没有创建成功，请检查信息后重试。"));
          return;
        }

        feedback.setMessage("账号已创建。请打开邮箱里的确认按钮，确认后就能登录账号中心。");
        router.refresh();
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <form onSubmit={(event) => submitForm(event, signUp)} className="grid gap-4">
      <TextField variant="line" label="姓名" name="name" autoComplete="name" placeholder="怎么称呼你" required />
      <TextField variant="line" label="邮箱" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
      <TextField variant="line" label="密码" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="至少 8 位字符" required />
      <Button type="submit" disabled={signUpBusy} aria-busy={signUpBusy}>
        {signUpBusy ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
        {signUpBusy ? "正在创建..." : "创建账号"}
      </Button>
      <Feedback message={feedback.message} error={feedback.error} />
    </form>
  );
}

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const feedback = useFeedback();
  const forgotBusy = pending || submitting;

  function requestReset(formData: FormData) {
    setSubmitting(true);
    startTransition(async () => {
      try {
        const email = String(formData.get("email") || "");
        const client = starxAuthClient();
        const result = await client.requestPasswordReset({
          email,
          redirectTo: "/reset-password",
        });

        if (result?.error) {
          feedback.setError(toFriendlyAuthMessage(result.error.message, "找回密码邮件没有发送成功，请稍后再试。"));
          return;
        }

        feedback.setMessage("如果这个邮箱已有账号，我们会发送找回密码邮件。请从邮件里的按钮继续。");
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <form onSubmit={(event) => submitForm(event, requestReset)} className="grid gap-4">
      <TextField variant="line" label="邮箱" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
      <Button type="submit" disabled={forgotBusy} aria-busy={forgotBusy}>
        {forgotBusy ? <Loader2 className="animate-spin" size={17} /> : <Mail size={17} />}
        {forgotBusy ? "正在发送..." : "发送找回密码邮件"}
      </Button>
      <Feedback message={feedback.message} error={feedback.error} />
    </form>
  );
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const feedback = useFeedback();
  const token = searchParams.get("token") || "";
  const resetBusy = pending || submitting;

  function resetPassword(formData: FormData) {
    setSubmitting(true);
    startTransition(async () => {
      try {
        const newPassword = String(formData.get("password") || "");
        // 前端密码强度验证
        if (!newPassword || newPassword.length < 8) {
          feedback.setError("密码至少需要 8 位字符");
          return;
        }
        const client = starxAuthClient();
        const result = await client.resetPassword({
          token,
          newPassword,
        });

        if (result?.error) {
          feedback.setError(toFriendlyAuthMessage(result.error.message, "新密码没有保存成功，请重新打开邮件里的按钮后再试。"));
          return;
        }

        router.push("/sign-in");
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <form onSubmit={(event) => submitForm(event, resetPassword)} className="grid gap-4">
      <TextField variant="line" label="新密码" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="至少 8 位字符" required />
      <Button type="submit" disabled={resetBusy || !token} aria-busy={resetBusy}>
        {resetBusy ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
        {resetBusy ? "正在保存..." : "保存新密码"}
      </Button>
      {!token ? (
        <Feedback error="这封邮件里的按钮信息不完整，请回到邮件里重新打开。" />
      ) : (
        <Feedback message={feedback.message} error={feedback.error} />
      )}
    </form>
  );
}

export function TwoFactorForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<TwoFactorMethod>("app");
  const [pendingAction, setPendingAction] = useState<TwoFactorAction>("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const feedback = useFeedback();
  const twoFactorBusy = pending || Boolean(pendingAction);

  function verify(formData: FormData) {
    setPendingAction("verify");
    startTransition(async () => {
      try {
        const code = String(formData.get("code") || "");
        const selectedMethod = String(formData.get("method") || method) === "email" ? "email" : "app";
        const client = starxAuthClient();
        const result = selectedMethod === "email" ? await client.twoFactor.verifyOtp({ code }) : await client.twoFactor.verifyTotp({ code });

        if (result?.error) {
          feedback.setError(toFriendlyAuthMessage(result.error.message, "6 位数字不正确或已过期，请重新输入。"));
          return;
        }

        router.push(DEFAULT_CALLBACK_URL);
      } finally {
        setPendingAction("");
      }
    });
  }

  function sendOtp() {
    setPendingAction("send-code");
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        const result = await client.twoFactor.sendOtp();
        if (result?.error) {
          feedback.setError(toFriendlyAuthMessage(result.error.message, "邮件没有发送成功，请稍后再试。"));
          return;
        }
        setMethod("email");
        setEmailCodeSent(true);
        feedback.setMessage("已发送到你的登录邮箱。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function chooseMethod(nextMethod: TwoFactorMethod) {
    setMethod(nextMethod);
    feedback.clear();
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-black/25 p-1" role="tablist" aria-label="选择确认方式">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            role="tab"
            aria-selected={method === "app"}
            className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
              method === "app" ? "bg-white text-black" : "text-zinc-300 hover:bg-white/[0.07] hover:text-white"
            }`}
            onClick={() => chooseMethod("app")}
          >
            <ShieldCheck size={16} />
            验证器应用
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={method === "email"}
            className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
              method === "email" ? "bg-white text-black" : "text-zinc-300 hover:bg-white/[0.07] hover:text-white"
            }`}
            onClick={() => chooseMethod("email")}
          >
            <Mail size={16} />
            登录邮箱
          </button>
        </div>
      </div>

      <form onSubmit={(event) => submitForm(event, verify)} className="grid gap-4">
        <input type="hidden" name="method" value={method} />
        {method === "email" ? (
          <Button type="button" variant="secondary" onClick={sendOtp} disabled={twoFactorBusy} aria-busy={pendingAction === "send-code"}>
            {pendingAction === "send-code" ? <Loader2 className="animate-spin" size={17} /> : <Mail size={17} />}
            {pendingAction === "send-code" ? "正在发送..." : emailCodeSent ? "重新发送邮件" : "发送到登录邮箱"}
          </Button>
        ) : null}
        <TextField
          variant="line"
          label={method === "email" ? "邮件里的 6 位数字" : "验证器应用里的 6 位数字"}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          hint={method === "email" ? "查看登录邮箱" : "打开验证器应用"}
          required
        />
        <Button type="submit" disabled={twoFactorBusy} aria-busy={pendingAction === "verify"}>
          {pendingAction === "verify" ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
          {pendingAction === "verify" ? "正在登录..." : method === "email" ? "用邮件继续登录" : "用验证器应用登录"}
        </Button>
        <Feedback message={feedback.message} error={feedback.error} />
      </form>
    </div>
  );
}

function Feedback({ message, error }: { message?: string; error?: string }) {
  if (!message && !error) return null;

  return (
    <p
      aria-live="polite"
      role={error ? "alert" : "status"}
      className={`max-w-sm text-sm leading-6 ${error ? "text-zinc-300" : "text-zinc-400"}`}
    >
      {error || message}
    </p>
  );
}

function submitForm(event: FormEvent<HTMLFormElement>, action: (formData: FormData) => void) {
  event.preventDefault();
  action(new FormData(event.currentTarget));
}
