import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApplicationsClient } from "@/components/applications/applications-client";
import { AppShell } from "@/components/dashboard/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { requireServerSession } from "@/lib/auth";

export default async function ApplicationsPage() {
  const session = await requireServerSession(new Headers(await headers()));

  if (!session?.user) {
    redirect("/sign-in?callbackURL=/applications");
  }

  return (
    <AppShell>
      <section className="py-10">
        <div className="mb-6" data-motion-primary>
          <StatusPill label="应用接入" tone="ok" />
          <h1 className="mt-4 text-3xl font-semibold text-white">应用接入</h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            给需要接入账号中心的应用登记回调地址，并管理它们的应用编号和密钥。
          </p>
        </div>
        <div data-motion-rise>
          <ApplicationsClient />
        </div>
      </section>
    </AppShell>
  );
}
