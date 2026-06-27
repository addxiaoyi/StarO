import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin/admin-client";
import { AppShell } from "@/components/dashboard/app-shell";
import { StatusPill } from "@/components/ui/status-pill";
import { requireServerSession } from "@/lib/auth";

export default async function AdminPage() {
  const session = await requireServerSession(new Headers(await headers()));

  if (!session?.user) {
    redirect("/sign-in?callbackURL=/admin");
  }

  if (session.user.role !== "admin") {
    return (
      <AppShell>
        <section className="py-10">
          <div className="surface rounded-[1.65rem] p-6" data-motion-scale>
            <div data-motion-primary>
              <StatusPill label="需要管理员身份" tone="warn" />
              <h1 className="mt-4 text-3xl font-semibold text-white">这个账号还不能管理成员</h1>
            </div>
            <p className="mt-2 max-w-2xl text-zinc-500" data-motion-secondary>
              你已经登录，但这个账号还没有成员管理权限。
            </p>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="py-10">
        <div className="mb-6" data-motion-primary>
          <StatusPill label="成员管理" tone="ok" />
          <h1 className="mt-4 text-3xl font-semibold text-white">成员管理</h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            查看成员、添加账号、让异常设备退出，或临时暂停账号。
          </p>
        </div>
        <div data-motion-rise>
          <AdminClient />
        </div>
      </section>
    </AppShell>
  );
}
