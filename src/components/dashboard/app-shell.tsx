import type { ReactNode } from "react";
import Link from "next/link";
import { MotionStage } from "@/components/motion/motion-stage";
import { BrandMark } from "@/components/ui/brand-mark";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="shell-grid min-h-screen">
      <MotionStage variant="app">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 lg:px-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div data-motion-brand>
              <BrandMark />
            </div>
            <nav className="flex w-full items-center gap-2 overflow-x-auto pb-1 text-sm text-zinc-400 sm:w-auto sm:overflow-visible sm:pb-0" data-motion-nav>
              <Link className="focus-ring shrink-0 rounded-full px-4 py-2 hover:bg-white/[0.07] hover:text-white" href="/dashboard">
                账号中心
              </Link>
              <Link className="focus-ring shrink-0 rounded-full px-4 py-2 hover:bg-white/[0.07] hover:text-white" href="/admin">
                成员管理
              </Link>
              <Link className="focus-ring shrink-0 rounded-full px-4 py-2 hover:bg-white/[0.07] hover:text-white" href="/admin/audit-logs">
                审计日志
              </Link>
              <Link className="focus-ring shrink-0 rounded-full px-4 py-2 hover:bg-white/[0.07] hover:text-white" href="/applications">
                应用接入
              </Link>
              <Link className="focus-ring shrink-0 rounded-full px-4 py-2 hover:bg-white/[0.07] hover:text-white" href="/oauth/consent">
                确认应用访问
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </MotionStage>
    </main>
  );
}
