import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  variant?: "filled" | "line";
};

const inputClass = {
  filled:
    "h-12 rounded-2xl border border-white/16 bg-black/35 px-4 text-base text-white placeholder:text-zinc-500 transition focus:border-sky-300/70",
  line:
    "h-12 rounded-none border-0 border-b border-white/28 bg-transparent px-0 text-[1.05rem] text-white placeholder:text-zinc-500 transition focus:border-white/70",
};

export function TextField({ label, hint, className = "", id, variant = "filled", ...props }: TextFieldProps) {
  const reactId = useId().replaceAll(":", "");
  const fallbackId = props.name || label.toLowerCase().replaceAll(" ", "-");
  const inputId = id || `${fallbackId}-${reactId}`;

  return (
    <label className="grid gap-2 text-sm text-zinc-200" htmlFor={inputId}>
      <span className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        {hint ? <span className="text-xs text-zinc-400">{hint}</span> : null}
      </span>
      <input
        id={inputId}
        className={`focus-ring ${inputClass[variant]} ${className}`}
        {...props}
      />
    </label>
  );
}
