"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/reviews", label: "Reviews", count: "reviews" },
  { href: "/admin/messages", label: "Messages", count: "messages" },
] as const;

/** The admin sidebar (a scrolling row on phones). Counts show what is waiting. */
export function AdminNav({ counts }: { counts?: { reviews: number; messages: number } }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        const n = "count" in l && counts ? counts[l.count] : 0;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center justify-between gap-4 px-3 font-mono text-caption01 tracking-[0.12em] uppercase transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-foreground-secondary hover:bg-background-secondary hover:text-foreground",
            )}
          >
            {l.label}
            {n > 0 && (
              <span
                className={cn(
                  "min-w-6 px-1.5 text-center tabular-nums",
                  active ? "bg-background text-foreground" : "bg-accent text-accent-foreground",
                )}
              >
                {n}
                <span className="sr-only"> waiting</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
