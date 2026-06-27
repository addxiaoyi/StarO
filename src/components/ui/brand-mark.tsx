import Link from "next/link";

export function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-3 group">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="13" stroke={dark ? "#3b82f6" : "#60a5fa"} strokeWidth="1" fill="none" opacity={dark ? 0.8 : 0.6} />
        <circle cx="16" cy="16" r="9" fill="url(#brand-grad)" />
        <circle cx="13" cy="13" r="2" fill="white" fillOpacity="0.35" />
        <defs>
          <radialGradient id="brand-grad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>
        </defs>
      </svg>
      <span className={`text-[14px] font-medium tracking-wider ${dark ? "text-gray-900" : "text-white"}`}>
        StarX
      </span>
    </Link>
  );
}
