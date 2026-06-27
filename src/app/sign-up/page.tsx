import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/auth-forms";

export default function SignUpPage() {
  return (
    <AuthShell
      title="创建账号"
      description="填好这三项，再到邮箱里点一下确认。"
      footer={
        <>
          已有账号？{" "}
          <Link href="/sign-in" className="font-semibold text-sky-300">
            登录
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="text-sm text-zinc-500">正在打开创建账号...</div>}>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
