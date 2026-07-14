import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuditLogClient } from "@/components/admin/audit-log-client";
import { AppShell } from "@/components/dashboard/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { requireServerSession } from "@/lib/auth";

export default async function AuditLogPage() {
  const session = await requireServerSession(new Headers(await headers()));

  if (!session?.user) {
    redirect("/sign-in?callbackURL=/admin/audit-logs");
  }

  if (session.user.role !== "admin") {
    return (
      <AppShell>
        <section className="py-10">
          <div className="surface rounded-[1.65rem] p-6">
            <StatusPill label="需要管理员身份" tone="warn" />
            <h1 className="mt-4 text-3xl font-semibold text-white">无权访问</h1>
            <p className="mt-2 text-zinc-500">此页面仅对管理员开放。</p>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="py-10">
        <div className="mb-6">
          <StatusPill label="审计日志" tone="ok" />
          <h1 className="mt-4 text-3xl font-semibold text-white">安全审计日志</h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            查看系统中的关键操作记录，包括用户管理、认证事件、OAuth 授权等。
          </p>
        </div>
        <AuditLogClient />
      </section>
    </AppShell>
  );
}
