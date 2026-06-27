type StatusPillProps = {
  label: string;
  tone?: "ok" | "warn" | "danger" | "muted";
};

const toneClass = {
  ok: "border-sky-300/35 bg-sky-400/10 text-sky-100",
  warn: "border-yellow-300/35 bg-yellow-300/10 text-yellow-100",
  danger: "border-red-400/35 bg-red-500/10 text-red-100",
  muted: "border-white/12 bg-white/[0.045] text-zinc-300",
};

export function StatusPill({ label, tone = "muted" }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClass[tone]}`}>
      {label}
    </span>
  );
}
