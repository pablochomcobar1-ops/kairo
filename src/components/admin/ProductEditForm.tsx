"use client";

import { useActionState, useTransition, type FormEvent } from "react";
import { saveProduct, type AdminState } from "@/server/actions/admin";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { AdminProduct } from "@/server/admin/data";
import { ActionMessage } from "./AdminAction";
import { LOW_STOCK } from "@/lib/admin";
import { cn } from "@/lib/cn";

const idle: AdminState = { status: "idle", message: "" };
const rupees = (paise: number | null) => (paise == null ? "" : String(Math.round(paise / 100)));

/** Edit a piece: name, prices, copy, visibility and stock per size. What you typed stays put after an error. */
export function ProductEditForm({ product }: { product: AdminProduct }) {
  const [state, action, pending] = useActionState(saveProduct, idle);
  const [, start] = useTransition();
  const f = state.fields ?? {};

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    start(() => action(data)); // called by hand so the form isn't emptied after saving
  }

  const colours = [...new Set(product.variants.map((v) => v.colour))];

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-12">
      <input type="hidden" name="productId" value={product.id} />

      <fieldset className="grid min-w-0 gap-7 sm:grid-cols-2">
        <legend className="mb-6 font-display text-heading03 font-bold">Details</legend>
        <Input
          label="Name"
          name="name"
          defaultValue={product.name}
          required
          maxLength={120}
          error={f.name}
          className="sm:col-span-2"
        />
        <Input
          label="Price (₹)"
          name="price"
          defaultValue={rupees(product.price_paise)}
          inputMode="numeric"
          required
          error={f.price}
          hint="Whole rupees."
        />
        <Input
          label="Was price (₹)"
          name="compareAt"
          defaultValue={rupees(product.compare_at_paise)}
          inputMode="numeric"
          error={f.compareAt}
          hint="Leave empty unless it's reduced."
        />
        <label className="flex min-h-11 items-center gap-3 sm:col-span-2">
          <input
            type="checkbox"
            name="published"
            defaultChecked={product.is_published}
            className="size-5 accent-(--color-accent)"
          />
          <span className="text-body01">Shown in the shop</span>
        </label>
      </fieldset>

      <fieldset className="grid min-w-0 gap-7">
        <legend className="mb-6 font-display text-heading03 font-bold">Copy</legend>
        <Textarea
          label="Description"
          name="description"
          defaultValue={product.description}
          rows={4}
          maxLength={1200}
          error={f.description}
        />
        <div className="grid gap-7 sm:grid-cols-3">
          <Textarea
            label="Fabric"
            name="fabric"
            defaultValue={product.fabric}
            rows={2}
            maxLength={200}
            error={f.fabric}
          />
          <Textarea
            label="Fit"
            name="fit"
            defaultValue={product.fit}
            rows={2}
            maxLength={200}
            error={f.fit}
          />
          <Textarea
            label="Care"
            name="care"
            defaultValue={product.care}
            rows={2}
            maxLength={200}
            error={f.care}
          />
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-6 font-display text-heading03 font-bold">Stock</legend>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[24rem] border-collapse text-left text-body02">
            <thead>
              <tr className="border-b border-border-strong">
                <th
                  scope="col"
                  className="py-3 pr-4 font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase"
                >
                  Size
                </th>
                {colours.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="py-3 pr-4 font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...new Set(product.variants.map((v) => v.size))].map((size) => (
                <tr key={size} className="border-b border-border">
                  <th scope="row" className="py-2 pr-4 font-mono font-semibold">
                    {size}
                  </th>
                  {colours.map((c) => {
                    const v = product.variants.find((x) => x.size === size && x.colour === c);
                    return (
                      <td key={c} className="py-2 pr-4">
                        {v ? (
                          <input
                            name={`stock:${v.id}`}
                            defaultValue={v.stock}
                            inputMode="numeric"
                            aria-label={`Stock, ${c}, size ${size}`}
                            className={cn(
                              "w-20 border border-border-strong bg-transparent px-2 py-1.5 font-mono tabular-nums focus:border-accent focus:outline-none",
                              v.stock <= LOW_STOCK && "border-error/60 text-error",
                            )}
                          />
                        ) : (
                          <span className="text-foreground-subtle">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>

      <div className="sticky bottom-0 -mx-gutter flex flex-wrap items-center gap-5 border-t border-border bg-background px-gutter py-4">
        <Button type="submit" loading={pending}>
          Save changes
        </Button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}
