import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { OAuthActions } from "@/components/oauth/oauth-actions";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { requireServerSession } from "@/lib/auth";

export default async function SelectAccountPage() {
  const session = await requireServerSession(new Headers(await headers()));
  if (!session?.user) {
    redirect("/sign-in?callbackURL=/oauth/select-account");
  }
  const accountName = session.user.email || session.user.name || "当前账号";

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-3xl py-10">
        <Panel>
          <StatusPill label="当前账号" tone="ok" />
          <h1 className="mt-4 text-3xl font-semibold text-white" data-motion-primary>用这个账号继续吗？</h1>
          <p className="mt-3 text-zinc-500" data-motion-secondary>
            接下来会用下面这个已登录账号继续连接应用，不会切换到其他账号。
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-zinc-200" data-motion-secondary>
            <p className="text-xs text-zinc-500">当前账号</p>
            <p className="mt-1 break-all font-semibold text-white">{accountName}</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-500" data-motion-secondary>
            如果不是这个账号，请先退出登录，再换成正确的账号。
          </p>
          <div className="mt-6" data-motion-rise>
            <Suspense fallback={<div className="text-sm text-zinc-500">正在准备按钮...</div>}>
              <OAuthActions kind="account" />
            </Suspense>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
