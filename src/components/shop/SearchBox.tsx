"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { SearchIcon, CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * Search field for /search. Results update as you type (a quarter-second after
 * you stop), and the query stays in the URL so results can be shared.
 */
export function SearchBox({ autoFocus }: { autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const timer = useRef<number | undefined>(undefined);

  const go = (q: string) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const clean = q.trim();
      start(() =>
        router.replace(clean ? `/search?q=${encodeURIComponent(clean)}` : "/search", {
          scroll: false,
        }),
      );
    }, 250);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <form
      role="search"
      action="/search"
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
      className="relative flex items-center border-b-2 border-border-strong transition-colors focus-within:border-accent"
    >
      <SearchIcon
        size={22}
        className={cn(
          "shrink-0 text-foreground-subtle transition-opacity",
          pending && "animate-pulse",
        )}
      />
      <label htmlFor="site-search" className="sr-only">
        Search Kairo
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
        maxLength={80}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          go(e.target.value);
        }}
        placeholder="Hoodie, linen, riding jacket…"
        className="h-16 w-full bg-transparent px-4 font-display text-heading02 font-bold placeholder:font-sans placeholder:text-heading03 placeholder:font-normal placeholder:text-foreground-subtle focus:outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setValue("");
            go("");
          }}
          className="inline-flex size-11 shrink-0 items-center justify-center text-foreground-subtle hover:text-accent"
        >
          <CloseIcon />
        </button>
      )}
    </form>
  );
}
