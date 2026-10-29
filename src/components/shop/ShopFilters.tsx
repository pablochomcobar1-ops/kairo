"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Drawer, DialogClose } from "@/components/ui/Dialog";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { swatch } from "@/lib/colours";
import {
  PRICE_BANDS,
  SORT_LABELS,
  activeFilterCount,
  colourKey,
  filtersToQuery,
  type Filters,
  type Sort,
} from "@/lib/filters";
import { formatINR } from "@/lib/money";

type Ctx = { filters: Filters; pending: boolean; update: (next: Filters) => void };
const FilterContext = createContext<Ctx | null>(null);

function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters outside <FiltersProvider>");
  return ctx;
}

/**
 * Holds the current filters. A change updates the URL (so it can be shared and
 * Back works); the server then sends the new results. Controls flip at once
 * (optimistic) and the results dim until the new ones arrive.
 */
export function FiltersProvider({ filters, children }: { filters: Filters; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(filters);

  const update = (next: Filters) =>
    start(() => {
      setOptimistic(next);
      const q = filtersToQuery(next);
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    });

  return (
    <FilterContext.Provider value={{ filters: optimistic, pending, update }}>
      {children}
    </FilterContext.Provider>
  );
}

/** Wraps the results: dims while new ones load and tells screen readers it is busy. */
export function ResultsRegion({ children }: { children: ReactNode }) {
  const { pending } = useFilters();
  return (
    <div
      aria-busy={pending}
      className={cn("transition-opacity duration-200", pending && "opacity-50")}
    >
      {children}
    </div>
  );
}

const chip =
  "inline-flex min-h-11 items-center gap-2 border px-3.5 text-body02 transition-[color,border-color,background-color,transform] duration-150 ease-ui active:scale-[0.97]";
const chipOn = "border-foreground bg-foreground text-background";
const chipOff = "border-border-strong hover:border-foreground-secondary";

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function useIsPhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setPhone(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return phone;
}

/**
 * The bar above the grid: Filter button (opens a sheet with size, colour and
 * price), the active filters as removable chips, the count and the sort.
 */
export function FilterBar({
  facets,
  total,
}: {
  facets: { sizes: string[]; colours: string[] };
  total: number;
}) {
  const { filters: f, update, pending } = useFilters();
  const [open, setOpen] = useState(false);
  const phone = useIsPhone();
  const count = activeFilterCount(f);
  const band = PRICE_BANDS.find(
    (b) =>
      (b.min === undefined ? f.minPaise === undefined : f.minPaise === b.min * 100) &&
      (b.max === undefined ? f.maxPaise === undefined : f.maxPaise === b.max * 100),
  );
  const priceLabel =
    f.minPaise === undefined && f.maxPaise === undefined
      ? null
      : (band?.label ??
        `${f.minPaise !== undefined ? formatINR(f.minPaise) : "Any"} – ${f.maxPaise !== undefined ? formatINR(f.maxPaise) : "any"}`);
  const colourName = (key: string) => facets.colours.find((c) => colourKey(c) === key) ?? key;
  const none: Filters = {
    sizes: [],
    colours: [],
    minPaise: undefined,
    maxPaise: undefined,
    sort: f.sort,
  };

  return (
    <div className="sticky top-0 z-30 -mx-gutter border-y border-border bg-background/90 px-gutter backdrop-blur-md">
      <div className="mx-auto flex max-w-site flex-wrap items-center gap-3 py-3">
        <Drawer
          open={open}
          onOpenChange={setOpen}
          side={phone ? "bottom" : "left"}
          title="Filter"
          description="Choose sizes, colours and a price range. Results update as you choose."
          trigger={
            <button
              type="button"
              className={cn(chip, chipOff, "font-mono text-caption01 tracking-[0.14em] uppercase")}
            >
              Filter
              {count > 0 && (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-accent text-[11px] text-accent-foreground">
                  {count}
                </span>
              )}
            </button>
          }
          footer={
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => update(none)}
                disabled={count === 0}
                className="font-mono text-caption01 tracking-[0.14em] uppercase underline underline-offset-4 disabled:opacity-40"
              >
                Clear all
              </button>
              <DialogClose className="inline-flex h-12 items-center bg-foreground px-6 font-mono text-button tracking-[0.14em] text-background uppercase transition-transform active:scale-[0.97]">
                {pending ? "Updating…" : `Show ${total} ${total === 1 ? "piece" : "pieces"}`}
              </DialogClose>
            </div>
          }
        >
          <div className="flex flex-col gap-10">
            {facets.sizes.length > 0 && (
              <fieldset>
                <legend className="mb-4 font-mono text-caption01 tracking-[0.14em] uppercase">
                  Size
                </legend>
                <div className="flex flex-wrap gap-2">
                  {facets.sizes.map((s) => {
                    const on = f.sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() => update({ ...f, sizes: toggle(f.sizes, s) })}
                        className={cn(
                          chip,
                          "min-w-12 justify-center font-mono",
                          on ? chipOn : chipOff,
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
            {facets.colours.length > 0 && (
              <fieldset>
                <legend className="mb-4 font-mono text-caption01 tracking-[0.14em] uppercase">
                  Colour
                </legend>
                <div className="flex flex-wrap gap-2">
                  {facets.colours.map((c) => {
                    const key = colourKey(c);
                    const on = f.colours.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => update({ ...f, colours: toggle(f.colours, key) })}
                        className={cn(chip, on ? chipOn : chipOff)}
                      >
                        <span
                          aria-hidden="true"
                          className="size-4 rounded-full border border-border-strong"
                          style={{ background: swatch(c) }}
                        />
                        {c}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
            <fieldset>
              <legend className="mb-4 font-mono text-caption01 tracking-[0.14em] uppercase">
                Price
              </legend>
              <div className="flex flex-wrap gap-2">
                {PRICE_BANDS.map((b) => {
                  const on = band?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        update(
                          on
                            ? { ...f, minPaise: undefined, maxPaise: undefined }
                            : {
                                ...f,
                                minPaise: b.min === undefined ? undefined : b.min * 100,
                                maxPaise: b.max === undefined ? undefined : b.max * 100,
                              },
                        )
                      }
                      className={cn(chip, on ? chipOn : chipOff)}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </Drawer>

        {/* active filters, each removable */}
        <ul className="flex flex-1 flex-wrap gap-2" aria-label="Active filters">
          {f.sizes.map((s) => (
            <ActiveChip
              key={`s-${s}`}
              label={`Size ${s}`}
              onRemove={() => update({ ...f, sizes: f.sizes.filter((x) => x !== s) })}
            />
          ))}
          {f.colours.map((c) => (
            <ActiveChip
              key={`c-${c}`}
              label={colourName(c)}
              onRemove={() => update({ ...f, colours: f.colours.filter((x) => x !== c) })}
            />
          ))}
          {priceLabel && (
            <ActiveChip
              label={priceLabel}
              onRemove={() => update({ ...f, minPaise: undefined, maxPaise: undefined })}
            />
          )}
        </ul>

        <p
          className="font-mono text-caption01 tracking-[0.12em] text-foreground-secondary uppercase tabular-nums"
          aria-live="polite"
        >
          {total} {total === 1 ? "piece" : "pieces"}
        </p>
        <label className="relative inline-flex items-center">
          <span className="sr-only">Sort by</span>
          <select
            value={f.sort}
            onChange={(e) => update({ ...f, sort: e.target.value as Sort })}
            className="h-11 cursor-pointer appearance-none border border-border-strong bg-transparent py-0 pr-9 pl-3.5 text-body02 hover:border-foreground-secondary focus:border-accent focus:outline-none [&>option]:bg-background-tertiary"
          >
            {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="pointer-events-none absolute right-3 text-caption02">
            ▾
          </span>
        </label>
      </div>
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="inline-flex h-9 items-center gap-1.5 border border-border-strong px-3 text-body02 transition-colors hover:border-accent hover:text-accent"
      >
        {label}
        <CloseIcon size={14} />
      </button>
    </li>
  );
}
