"use client";

import Image from "next/image";
import Link from "next/link";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { formatINR } from "@/lib/money";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";
import { useCart, type CartLine } from "@/stores/cart";

const stepper =
  "inline-flex size-11 items-center justify-center transition-[transform,color] duration-150 ease-ui hover:text-accent active:scale-[0.9] disabled:pointer-events-none disabled:opacity-30";

export function CartLineItem({ line }: { line: CartLine }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  return (
    <article className="grid grid-cols-[5.5rem_1fr] gap-4" aria-label={`${line.name}, size ${line.size}`}>
      <Link href={`/products/${line.productSlug}`} className="relative block aspect-[4/5] overflow-hidden bg-background-tertiary">
        {line.image ? (
          <Image src={line.image} alt="" fill sizes="88px" className="object-cover" />
        ) : (
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-heading03 font-bold text-foreground-subtle">
            K
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/products/${line.productSlug}`} className="text-body02 font-semibold hover:text-accent">
            {line.name}
          </Link>
          <span className="shrink-0 font-mono text-body02 tabular-nums">{formatINR(line.unitPaise * line.qty)}</span>
        </div>
        <p className="font-mono text-caption02 uppercase text-foreground-subtle">
          {line.colour} · Size {line.size}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="-ml-3 flex items-center" role="group" aria-label={`Quantity of ${line.name}`}>
            <button
              type="button"
              className={stepper}
              aria-label="Decrease quantity"
              disabled={line.qty <= 1}
              onClick={() => setQty(line.variantId, line.qty - 1)}
            >
              <MinusIcon size={16} />
            </button>
            <output aria-live="polite" className="w-6 text-center font-mono text-body02 tabular-nums">
              {line.qty}
            </output>
            <button
              type="button"
              className={stepper}
              aria-label="Increase quantity"
              disabled={line.qty >= MAX_QTY_PER_LINE}
              onClick={() => setQty(line.variantId, line.qty + 1)}
            >
              <PlusIcon size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => remove(line.variantId)}
            className="min-h-11 font-mono text-caption02 uppercase text-foreground-subtle underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
