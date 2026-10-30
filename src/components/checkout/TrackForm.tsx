"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { ORDER_STATUS_LABEL, ORDER_STEPS, stepIndex } from "@/lib/orders";
import { trackOrder, type TrackState } from "@/server/actions/checkout";

const idle: TrackState = { status: "idle", message: "" };
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });

export function TrackForm({ initialOrder }: { initialOrder: string }) {
  const [state, action, pending] = useActionState(trackOrder, idle);
  const v = state.status !== "found" ? state.values : undefined;

  return (
    <div className="flex flex-col gap-10">
      <form action={action} className="grid gap-6 sm:grid-cols-2" noValidate>
        <Input
          label="Order number"
          name="orderNumber"
          required
          autoComplete="off"
          placeholder="KRO-261030-AB7K"
          defaultValue={v?.orderNumber ?? initialOrder}
          className="font-mono"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={v?.email}
        />
        <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
          <Button type="submit" loading={pending}>
            Track
          </Button>
          {state.status === "error" && (
            <p role="alert" className="text-body02 text-error">
              {state.message}
            </p>
          )}
        </div>
      </form>

      {state.status === "found" && (
        <section
          aria-labelledby="track-result"
          className="flex flex-col gap-8 border-t border-border pt-8"
        >
          <div className="flex flex-col gap-1">
            <h2 id="track-result" className="font-mono text-heading03 tracking-[0.1em] text-accent">
              {state.order.number}
            </h2>
            <p className="text-body02 text-foreground-secondary" role="status">
              {state.order.statusLabel} · placed {day(state.order.placedAt)}
            </p>
          </div>
          {state.order.status === "cancelled" ? (
            <p className="text-body02 text-error">This order was cancelled.</p>
          ) : (
            <ol className="grid grid-cols-4 gap-2" aria-label="Delivery progress">
              {ORDER_STEPS.map((s, i) => {
                const done = i <= stepIndex(state.order.status);
                const at = state.order.events.find((e) => e.status === s)?.at;
                return (
                  <li
                    key={s}
                    className="flex flex-col gap-3"
                    aria-current={s === state.order.status ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "h-1 w-full origin-left transition-transform duration-700 ease-out-expo",
                        done ? "bg-accent" : "bg-border",
                      )}
                    />
                    <span
                      className={cn(
                        "font-mono text-caption02 tracking-[0.12em] uppercase",
                        done ? "text-foreground" : "text-foreground-subtle",
                      )}
                    >
                      {ORDER_STATUS_LABEL[s]}
                    </span>
                    {at && <span className="text-caption02 text-foreground-subtle">{day(at)}</span>}
                  </li>
                );
              })}
            </ol>
          )}
          <ul className="flex flex-col gap-2 text-body02 text-foreground-secondary">
            {state.order.items.map((i, k) => (
              <li key={k}>
                {i.name} · {i.colour} · {i.size} × {i.qty}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
