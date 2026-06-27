import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="确认邮箱"
      description="确认这个邮箱属于你，这样我们才能继续保护你的账号。"
      footer={
        <Link href="/sign-in" className="font-semibold text-sky-300">
          返回登录
        </Link>
      }
    >
      <Suspense fallback={<div className="text-sm text-zinc-500">正在打开确认页面...</div>}>
        <VerifyEmailPanel />
      </Suspense>
    </AuthShell>
  );
}
