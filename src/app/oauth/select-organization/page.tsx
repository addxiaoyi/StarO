import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { OAuthActions } from "@/components/oauth/oauth-actions";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { requireServerSession } from "@/lib/auth";

export default async function SelectOrganizationPage() {
  const session = await requireServerSession(new Headers(await headers()));
  if (!session?.user) {
    redirect("/sign-in?callbackURL=/oauth/select-organization");
  }

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-3xl py-10">
        <Panel>
          <StatusPill label="带上团队" tone="warn" />
          <h1 className="mt-4 text-3xl font-semibold text-white" data-motion-primary>是否带上团队信息？</h1>
          <p className="mt-3 text-zinc-500" data-motion-secondary>
            这个应用想查看你所在团队的信息。如果这次需要带上团队信息，可以继续。
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-zinc-400" data-motion-secondary>
            没有看到要使用的团队？先回账号中心确认团队设置，再从应用重新发起连接。
          </div>
          <div className="mt-6" data-motion-rise>
            <Suspense fallback={<div className="text-sm text-zinc-500">正在准备按钮...</div>}>
              <OAuthActions kind="organization" />
            </Suspense>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
