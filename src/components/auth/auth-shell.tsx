import type { ReactNode } from "react";
import Link from "next/link";
import { MotionStage } from "@/components/motion/motion-stage";
import Cubes from "@/components/react-bits/cubes";
import { BrandMark } from "@/components/ui/brand-mark";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="auth-canvas min-h-[100dvh]">
      <MotionStage variant="auth" className="auth-content-stage">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:items-center lg:gap-14 lg:px-8">
          <section className="relative min-h-[8.5rem] max-w-xl shrink-0 overflow-visible sm:min-h-[10rem] lg:min-h-0">
            <Cubes
              aria-hidden="true"
              className="auth-cubes"
              gridSize={5}
              maxAngle={18}
              radius={1.9}
              cellGap={{ row: 10, col: 10 }}
              borderStyle="1px solid rgba(160,205,255,0.32)"
              faceColor="rgba(13,22,31,0.82)"
              rippleColor="rgba(77,171,255,0.68)"
              rippleSpeed={1.6}
              autoAnimate
              interactive
              rippleOnClick
              shadow="0 22px 60px rgba(41,151,255,0.12)"
              style={{
                width: "clamp(44rem, 54vw, 62rem)",
                filter: "saturate(1.08) drop-shadow(0 24px 58px rgba(41,151,255,0.12))",
              }}
            />
            <div className="relative z-10 md:hidden" data-motion-brand>
              <BrandMark />
            </div>
            <h1 className="relative z-10 mt-8 hidden text-6xl font-semibold leading-[1.05] text-white lg:block lg:mt-16" data-motion-primary>
              <span className="block">账号应该</span>
              <span className="block">安静地工作。</span>
            </h1>
            <p className="relative z-10 mt-7 hidden max-w-md text-lg leading-8 text-zinc-300 lg:block" data-motion-secondary>
              只留下必要的步骤。登录、设备、安全设置和应用访问，都在同一个地方自然完成。
            </p>
            <Link href="/" className="relative z-10 mt-10 hidden text-sm font-semibold text-zinc-300 transition hover:text-white lg:inline-flex" data-motion-secondary>
              返回首页
            </Link>
          </section>
          <section className="auth-panel mx-auto w-full max-w-[420px] self-start lg:pl-10" data-motion-scale>
            <header>
              <h2 className="text-4xl font-semibold leading-tight text-white" data-motion-primary>{title}</h2>
              <p className="mt-3 text-[0.95rem] leading-7 text-zinc-300" data-motion-secondary>{description}</p>
            </header>
            <div className="mt-10" data-motion-rise>
              {children}
            </div>
            {footer ? <div className="mt-9 text-sm text-zinc-400" data-motion-rise>{footer}</div> : null}
          </section>
        </div>
      </MotionStage>
    </main>
  );
}
