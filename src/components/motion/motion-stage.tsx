"use client";

import type { ReactNode } from "react";

type MotionVariant = "landing" | "auth" | "app";

type MotionStageProps = {
  children: ReactNode;
  className?: string;
  variant: MotionVariant;
};

export function MotionStage({ children, className = "", variant }: MotionStageProps) {
  return (
    <div className={`motion-stage relative isolate ${className}`}>
      <StageBackdrop variant={variant} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function StageBackdrop({ variant }: { variant: MotionVariant }) {
  if (variant === "auth") {
    return null;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 顶部细线 */}
      <div className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)]" />

      {/* 简洁的背景光效 - 使用 GPU 加速的 CSS 动画 */}
      {variant === "landing" && (
        <>
          <div className="ambient-glow ambient-glow-1" />
          <div className="ambient-glow ambient-glow-2" />
        </>
      )}
      {variant === "app" && (
        <>
          <div className="ambient-glow ambient-glow-3" />
          <div className="ambient-glow ambient-glow-4" />
        </>
      )}
    </div>
  );
}
