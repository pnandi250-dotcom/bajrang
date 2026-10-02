import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "gold" | "soft" | "ghost" | "deep";
type Size = "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary:
    "bg-linear-to-b from-saffron-400 to-saffron-600 text-white shadow-soft hover:from-saffron-400 hover:to-saffron-500 active:translate-y-px",
  gold: "bg-linear-to-b from-gold-300 to-gold-500 text-ink-900 shadow-soft active:translate-y-px",
  soft: "bg-white/85 text-saffron-700 border border-saffron-200 active:bg-saffron-50",
  ghost: "bg-transparent text-ink-700 active:bg-saffron-50",
  deep: "bg-linear-to-b from-sindoor-500 to-sindoor-700 text-cream-100 shadow-soft active:translate-y-px",
};

const sizes: Record<Size, string> = {
  md: "text-base px-5 py-3 rounded-2xl",
  lg: "text-lg px-6 py-4 rounded-3xl",
  xl: "text-xl px-7 py-5 rounded-[28px]",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "lg",
  block = false,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      className={cn(
        "pressable inline-flex items-center justify-center gap-2 font-semibold tracking-wide",
        "transition-all duration-200 select-none",
        "disabled:bg-none disabled:bg-cream-300 disabled:text-ink-500 disabled:shadow-none disabled:opacity-100 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}