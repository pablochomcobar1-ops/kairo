"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { HeartIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { setWishlisted } from "@/server/actions/wishlist";
import { useUi } from "@/stores/ui";
import { useWishlist } from "@/stores/wishlist";

/**
 * The heart. Saves in this browser at once; when signed in, also saves to the
 * account (and puts it back if that fails). The heart pops when it fills.
 */
export function WishlistButton({
  slug,
  name,
  className,
  size = 18,
}: {
  slug: string;
  name: string;
  className?: string;
  size?: number;
}) {
  const saved = useWishlist((s) => s.slugs.includes(slug));
  const toggle = useWishlist((s) => s.toggle);
  const signedIn = useUi((s) => s.signedIn);
  const reduce = useReducedMotion();
  const [pop, setPop] = useState(0);

  function onClick() {
    const now = toggle(slug);
    if (now) setPop((n) => n + 1);
    if (signedIn) {
      void setWishlisted(slug, now).then((r) => {
        if (!r.ok && useWishlist.getState().slugs.includes(slug) === now) toggle(slug);
      });
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={cn(
        "inline-flex size-11 items-center justify-center transition-[color,transform] duration-150 ease-ui hover:text-accent active:scale-[0.9]",
        saved && "text-accent",
        className,
      )}
    >
      <motion.span
        key={pop}
        initial={reduce || pop === 0 ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 14 }}
        className="inline-flex"
      >
        <HeartIcon filled={saved} size={size} />
      </motion.span>
    </button>
  );
}
