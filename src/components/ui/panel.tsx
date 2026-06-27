import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className = "" }: PanelProps) {
  return <section className={`surface rounded-[1.65rem] p-5 ${className}`} data-motion-scale>{children}</section>;
}
