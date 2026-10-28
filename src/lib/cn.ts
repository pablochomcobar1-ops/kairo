import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Our type scale shares the `text-*` prefix with colours (text-accent, text-foreground…).
 * Registering the sizes stops tailwind-merge from treating `text-accent text-hero01`
 * as a conflict and deleting one of them.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "hero01",
            "hero02",
            "heading01",
            "heading02",
            "heading03",
            "body01",
            "body02",
            "caption01",
            "caption02",
          ],
        },
      ],
    },
  },
});

/** Merge class names; use only when classes are conditional or come from props. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
