import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "outline" | "ghost";
export type ButtonSize = "md" | "lg";

const base = [
  "relative inline-flex select-none items-center justify-center gap-2",
  "font-sans text-button font-semibold uppercase tracking-[0.14em]",
  // press feedback: scale down on press; colour changes ease; nothing uses `transition: all`
  "transition-[transform,background-color,color,border-color] duration-150 ease-ui",
  "active:scale-[0.97]",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

const variants: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-background hover:bg-accent hover:text-accent-foreground",
  outline: "border border-border-strong text-foreground hover:border-accent hover:text-accent",
  ghost: "text-foreground underline-offset-[6px] hover:text-accent hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-12 px-6",
  lg: "h-14 px-8",
};

/** Shared classes so links and buttons look identical. */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], variant === "ghost" ? "h-11 px-1" : sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, keeps the width, blocks clicks and sets aria-busy. */
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="size-4 animate-spin rounded-pill border-2 border-current border-r-transparent" />
        </span>
      )}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** A link that looks like a button (for navigation, never for actions). */
export function ButtonLink({ variant = "primary", size = "md", className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />;
}
