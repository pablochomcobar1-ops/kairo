import type { ReactNode } from "react";
import { accountsEnabled } from "@/server/auth";

/** The narrow, calm frame shared by sign-in, sign-up and password pages (always Noir). */
export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="px-gutter py-section">
      <div className="mx-auto flex w-full max-w-md flex-col gap-10">
        <header className="flex flex-col gap-4">
          <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
            {eyebrow}
          </p>
          <h1 className="font-display text-heading01 font-bold">{title}</h1>
          {intro && <p className="text-body01 text-foreground-secondary">{intro}</p>}
        </header>
        {accountsEnabled() ? (
          children
        ) : (
          <p
            role="status"
            className="border border-border-strong px-4 py-3 text-body02 text-foreground-secondary"
          >
            Accounts are switched off in this preview (no Supabase settings). Everything else in the
            shop works.
          </p>
        )}
      </div>
    </div>
  );
}
