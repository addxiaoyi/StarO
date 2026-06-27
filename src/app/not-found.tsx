import { ArrowLeft, LayoutDashboard, ShieldCheck } from "lucide-react";
import { MotionStage } from "@/components/motion/motion-stage";
import { BrandMark } from "@/components/ui/brand-mark";
import { LinkButton } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";

export default function NotFound() {
  return (
    <main className="shell-grid min-h-screen">
      <MotionStage variant="auth">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 lg:px-8">
          <header data-motion-brand>
            <BrandMark />
          </header>

          <section className="grid flex-1 items-center py-16">
            <div className="surface mx-auto w-full max-w-2xl rounded-[2rem] p-6 sm:p-8" data-motion-scale>
              <div className="inline-flex rounded-2xl bg-white/8 p-3 text-white" data-motion-primary>
                <ShieldCheck size={22} />
              </div>
              <div className="mt-5" data-motion-primary>
                <StatusPill label="页面找不到" tone="muted" />
                <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  这个页面暂时打不开
                </h1>
              </div>
              <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400" data-motion-secondary>
                可能是地址写错了，或这个页面已经移动。你可以回到首页，或者进入账号中心继续操作。
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row" data-motion-rise>
                <LinkButton href="/">
                  <ArrowLeft size={17} />
                  回到首页
                </LinkButton>
                <LinkButton href="/dashboard" variant="secondary">
                  <LayoutDashboard size={17} />
                  进入账号中心
                </LinkButton>
              </div>
            </div>
          </section>
        </div>
      </MotionStage>
    </main>
  );
}
