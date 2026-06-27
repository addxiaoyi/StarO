"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { starxAuthClient } from "@/lib/auth-client";
import { toFriendlyAuthMessage } from "@/lib/friendly-auth-copy";

type VerifyEmailAction = "verify" | "resend" | "";

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<VerifyEmailAction>("");
  const [message, setMessage] = useState(token ? "点击下方按钮确认邮箱。确认后，你就可以继续登录。" : "输入登录邮箱，我们会再发一封确认邮件。");
  const [error, setError] = useState("");
  const verifying = pendingAction === "verify";
  const resending = pendingAction === "resend";
  const busy = pending || Boolean(pendingAction);

  function verifyToken() {
    setPendingAction("verify");
    startTransition(async () => {
      try {
        const client = starxAuthClient();
        const result = await client.verifyEmail({ query: { token } });
        if (result?.error) {
          setError(toFriendlyAuthMessage(result.error.message, "邮箱还没有确认成功，请重新打开邮件里的按钮再试。"));
          return;
        }
        setError("");
        setMessage("邮箱已确认。现在可以返回登录，继续进入账号中心。");
      } finally {
        setPendingAction("");
      }
    });
  }

  function resend(formData: FormData) {
    setPendingAction("resend");
    startTransition(async () => {
      try {
        const email = String(formData.get("email") || "");
        const client = starxAuthClient();
        const result = await client.sendVerificationEmail({ email, callbackURL: "/dashboard" });
        if (result?.error) {
          setError(toFriendlyAuthMessage(result.error.message, "确认邮件没有发送成功，请稍后再试。"));
          return;
        }
        setError("");
        setMessage("确认邮件已发送。请打开邮件里的确认按钮；如果没看到，可以检查垃圾邮件。");
      } finally {
        setPendingAction("");
      }
    });
  }

  return (
    <div className="grid gap-4">
      {token ? (
        <Button type="button" onClick={verifyToken} disabled={busy} aria-busy={verifying}>
          {verifying ? <Loader2 className="animate-spin" size={17} /> : <MailCheck size={17} />}
          {verifying ? "正在确认..." : "确认邮箱"}
        </Button>
      ) : (
        <form onSubmit={(event) => submitForm(event, resend)} className="grid gap-4">
          <TextField variant="line" label="邮箱" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
          <Button type="submit" disabled={busy} aria-busy={resending}>
            {resending ? <Loader2 className="animate-spin" size={17} /> : <MailCheck size={17} />}
            {resending ? "正在发送..." : "重新发送确认邮件"}
          </Button>
        </form>
      )}
      <p
        aria-live="polite"
        role={error ? "alert" : "status"}
        className={`max-w-sm text-sm leading-6 ${error ? "text-zinc-300" : "text-zinc-400"}`}
      >
        {error || message}
      </p>
    </div>
  );
}

function submitForm(event: FormEvent<HTMLFormElement>, action: (formData: FormData) => void) {
  event.preventDefault();
  action(new FormData(event.currentTarget));
}
