import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="设置新密码"
      description="从邮件里的链接进入后，重新设置一个新的登录密码。"
      footer={
        <Link href="/sign-in" className="font-semibold text-sky-300">
          返回登录
        </Link>
      }
    >
      <Suspense fallback={<div className="text-sm text-zinc-500">正在打开设置页面...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
