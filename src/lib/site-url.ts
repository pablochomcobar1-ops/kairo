/** The site's own address without a trailing slash, for canonical links and structured data. */
export function publicSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
