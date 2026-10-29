import { COLLECTIONS } from "@/lib/collections";

/** Everything search looks through, lower-case, in one string. */
export function buildSearchText(p: {
  name: string;
  collection: string;
  fabric: string;
  description: string;
  colours: string[];
}): string {
  const collection = COLLECTIONS.find((c) => c.slug === p.collection)?.name ?? p.collection;
  return [p.name, collection, p.fabric, p.colours.join(" "), p.description]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ");
}
