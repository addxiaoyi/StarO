import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/auth-forms";
import { isProviderConfigured, oauthProviders } from "@/lib/app-config";

export default function SignInPage() {
  const configuredProviders = oauthProviders
    .filter((provider) => isProviderConfigured(provider.env))
    .map(({ id, label }) => ({ id, label }));
  const description = "输入邮箱和密码登录，也可以让我们发送登录邮件，或使用已添加的设备登录。";

  return (
    <AuthShell
      title="登录"
      description={description}
      footer={
        <>
          还没有账号？{" "}
          <Link href="/sign-up" className="font-semibold text-sky-300">
            创建
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="text-sm text-zinc-500">正在打开登录方式...</div>}>
        <SignInForm socialProviders={configuredProviders} />
      </Suspense>
    </AuthShell>
  );
}
