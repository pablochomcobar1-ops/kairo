import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminNavFallback } from "@/components/admin/AdminNavFallback";
import { getCounts } from "@/server/admin/data";
import { getUser } from "@/server/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · KAIRO" },
  robots: { index: false, follow: false },
};

async function NavWithCounts() {
  const user = await getUser();
  // counts only for an admin; anyone else is sent away by the page itself
  const counts = user?.role === "admin" ? await getCounts() : undefined;
  return <AdminNav counts={counts} />;
}

/** The admin panel: its own shell, no shop header or footer. Every page checks for an admin itself. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 z-10 flex flex-col gap-4 border-b border-border bg-background px-gutter py-4 lg:h-svh lg:border-r lg:border-b-0 lg:px-5 lg:py-8">
        <div className="flex items-baseline justify-between gap-4 lg:flex-col lg:gap-1">
          <Link href="/admin" className="font-display text-heading03 font-bold tracking-[0.3em]">
            KAIRO
          </Link>
          <span className="font-mono text-caption02 tracking-[0.2em] text-accent uppercase">
            Admin
          </span>
        </div>
        <Suspense fallback={<AdminNavFallback />}>
          <NavWithCounts />
        </Suspense>
        <Link
          href="/"
          className="mt-auto hidden font-mono text-caption01 tracking-[0.12em] text-foreground-subtle uppercase hover:text-foreground lg:block"
        >
          ← Back to the shop
        </Link>
      </aside>
      <main
        id="main"
        tabIndex={-1}
        className="min-w-0 px-gutter py-8 outline-none lg:px-12 lg:py-12"
      >
        {children}
      </main>
    </div>
  );
}
