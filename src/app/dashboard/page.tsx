import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { requireServerSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await requireServerSession(new Headers(await headers()));

  if (!session?.user) {
    redirect("/sign-in?callbackURL=/dashboard");
  }

  return (
    <AppShell>
      <div className="py-10" data-motion-rise>
        <DashboardClient user={session.user} />
      </div>
    </AppShell>
  );
}
