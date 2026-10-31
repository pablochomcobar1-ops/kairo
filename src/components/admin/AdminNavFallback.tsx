import Link from "next/link";

/** The sidebar while the live one (with counts and the current page) loads. No URL reading here. */
export function AdminNavFallback() {
  const links = [
    ["/admin", "Overview"],
    ["/admin/orders", "Orders"],
    ["/admin/products", "Products"],
    ["/admin/reviews", "Reviews"],
    ["/admin/messages", "Messages"],
  ] as const;
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {links.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className="flex min-h-11 shrink-0 items-center px-3 font-mono text-caption01 tracking-[0.12em] text-foreground-secondary uppercase"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
