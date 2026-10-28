import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  /** Required: what the button does, read by screen readers ("Open bag"). */
  label: string;
  icon: ReactNode;
  /** Small number shown on the icon, e.g. bag count. */
  count?: number;
};

/** A 44×44 icon-only button. The label is mandatory so it is never anonymous. */
export function IconButton({ label, icon, count, className, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      aria-label={count ? `${label} (${count})` : label}
      className={cn(
        "relative inline-flex size-11 items-center justify-center text-foreground",
        "transition-[transform,color] duration-150 ease-ui hover:text-accent active:scale-[0.94]",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {icon}
      {count ? (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-pill bg-accent px-1 font-mono text-[10px] leading-4 text-accent-foreground"
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </button>
  );
}
