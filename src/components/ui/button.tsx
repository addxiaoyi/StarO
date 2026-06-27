import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";

const variantClass: Record<Variant, string> = {
  // 主要按钮：白色背景、深色文字、高对比度
  primary: "bg-white text-black hover:bg-zinc-100 active:bg-zinc-200",
  // 次要按钮：深色背景、白色文字
  secondary: "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 active:bg-zinc-600",
  // 描边按钮：透明背景、白色边框和文字
  outline: "bg-transparent text-white border border-white hover:bg-white/10 active:bg-white/20",
  // 幽灵按钮：透明背景、灰色文字
  ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5 active:bg-white/10",
  danger: "bg-red-600 text-white hover:bg-red-500 active:bg-red-700",
};

const baseClass = "focus-ring inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";

const sizeClass = {
  sm: "h-9 px-5 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
};

export function Button({ className = "", variant = "primary", size = "md", ...props }: ButtonProps) {
  return <button className={`${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${className}`} {...props} />;
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
};

export function LinkButton({ href, className = "", variant = "primary", size = "md", children, ...props }: LinkButtonProps) {
  return (
    <Link href={href} className={`${baseClass} ${variantClass[variant]} ${sizeClass[size]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
