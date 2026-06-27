import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="找回登录密码"
      description="输入登录邮箱。如果有对应账号，我们会发送一封找回密码邮件。"
      footer={
        <Link href="/sign-in" className="font-semibold text-sky-300">
          返回登录
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
