"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { loadQuickView, type QuickViewData } from "@/server/actions/catalog";
import { Dialog } from "@/components/ui/Dialog";
import { Price } from "@/components/ui/Price";
import { Skeleton } from "@/components/ui/Skeleton";
import { PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { BuyBox } from "./BuyBox";
import { DropGate } from "./DropGate";
import { ProductGallery } from "./ProductGallery";

/**
 * "Quick view" on a product card: size picker and Add to bag in a dialog,
 * without leaving the grid. Escape closes it and focus returns to the button.
 * Details load when it opens, so grids stay light.
 */
export function QuickView({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<QuickViewData | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && !data) {
      setFailed(false);
      start(async () => {
        try {
          const result = await loadQuickView(slug);
          if (result) setData(result);
          else setFailed(true);
        } catch {
          setFailed(true);
        }
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={name}
      className="max-w-4xl"
      trigger={
        <button
          type="button"
          aria-label={`Quick view: ${name}`}
          className={cn(
            "inline-flex h-10 items-center gap-2 bg-background/85 px-3 font-mono text-caption02 tracking-[0.14em] text-foreground uppercase backdrop-blur-sm transition-[opacity,transform,color] duration-200 ease-ui hover:text-accent active:scale-[0.96]",
            className,
          )}
        >
          <PlusIcon size={14} />
          <span className="hidden md:inline">Quick view</span>
        </button>
      }
    >
      {pending || (!data && !failed) ? (
        <div className="grid gap-6 md:grid-cols-2" aria-busy="true">
          <Skeleton className="aspect-[3/4]" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24" />
            <Skeleton className="h-14" />
          </div>
        </div>
      ) : failed || !data ? (
        <p className="text-body02 text-foreground-secondary">
          This piece couldn&apos;t load just now.{" "}
          <Link href={`/products/${slug}`} className="text-accent underline underline-offset-4">
            Open the full page
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <ProductGallery
            name={data.name}
            collection={data.collection}
            images={data.images}
            compact
          />
          <div className="flex flex-col gap-6">
            <Price
              paise={data.pricePaise}
              compareAtPaise={data.compareAtPaise}
              className="text-heading03"
            />
            <p className="line-clamp-3 text-body02 text-foreground-secondary">{data.description}</p>
            <DropGate drop={data.drop}>
              <BuyBox
                product={data}
                variants={data.variants}
                onAdded={() => window.setTimeout(() => setOpen(false), 400)}
              />
            </DropGate>
            <Link
              href={`/products/${data.slug}`}
              className="font-mono text-caption01 tracking-[0.14em] text-accent uppercase underline-offset-4 hover:underline"
            >
              Full details →
            </Link>
          </div>
        </div>
      )}
    </Dialog>
  );
}
