import Link from "next/link";

export function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-3 group">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="url(#brand-x-bg)" />
        <path
          d="M11 11L21 21M21 11L11 21"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="brand-x-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <span className={`text-[14px] font-medium tracking-wider ${dark ? "text-gray-900" : "text-white"}`}>
        X
      </span>
    </Link>
  );
}
