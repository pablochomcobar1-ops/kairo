import type { ReactNode } from "react";

/** Title row for an admin page. */
export function AdminHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-heading01 font-bold">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-64 animate-pulse bg-background-secondary" />
      <div className="h-64 animate-pulse bg-background-secondary" />
    </div>
  );
}

export const th =
  "py-3 pr-4 text-left font-mono text-caption02 font-normal tracking-[0.12em] text-foreground-subtle uppercase";
export const td = "py-3 pr-4 align-top";
