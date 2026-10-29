import Link from "next/link";
import { cn } from "@/lib/cn";
import { publicSiteUrl } from "@/lib/site-url";

export type Crumb = { label: string; href: string };

/**
 * Home › Riding › Nightfall Riding Jacket. The last crumb is the current page
 * (not a link). Also tells Google the page's place in the site (BreadcrumbList).
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all = [{ label: "Home", href: "/" }, ...items];
  const base = publicSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${base}${c.href}`,
    })),
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("font-mono text-caption02 tracking-[0.12em] uppercase", className)}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-foreground-subtle">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-foreground-secondary">
                  {c.label}
                </span>
              ) : (
                <>
                  <Link href={c.href} className="transition-colors hover:text-accent">
                    {c.label}
                  </Link>
                  <span aria-hidden="true">›</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
    </nav>
  );
}

/** JSON for a <script> tag: "<" escaped so text in the data can never close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
