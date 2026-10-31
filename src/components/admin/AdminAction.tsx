"use client";

import { useActionState, type ReactNode } from "react";
import type { AdminState } from "@/server/actions/admin";
import { cn } from "@/lib/cn";

const idle: AdminState = { status: "idle", message: "" };

const styles = {
  primary: "bg-foreground text-background hover:bg-accent hover:text-accent-foreground",
  outline: "border border-border-strong text-foreground hover:border-accent hover:text-accent",
  danger: "border border-error/60 text-error hover:bg-error hover:text-background",
};

/** One button that runs an admin action with a few hidden fields, and says what happened. */
export function AdminAction({
  action,
  fields,
  children,
  variant = "outline",
  className,
}: {
  action: (prev: AdminState, form: FormData) => Promise<AdminState>;
  fields?: Record<string, string>;
  children: ReactNode;
  variant?: keyof typeof styles;
  className?: string;
}) {
  const [state, run, pending] = useActionState(action, idle);
  return (
    <form action={run} className={cn("flex flex-wrap items-center gap-3", className)}>
      {Object.entries(fields ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className={cn(
          "inline-flex min-h-10 items-center px-4 font-mono text-caption01 tracking-[0.12em] uppercase transition-colors disabled:opacity-50",
          styles[variant],
        )}
      >
        {pending ? "Working…" : children}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function ActionMessage({ state }: { state: AdminState }) {
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "text-body02",
        state.status === "error" ? "text-error" : "text-foreground-secondary",
      )}
    >
      {state.message}
    </p>
  );
}
