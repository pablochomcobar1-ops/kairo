"use client";

import { useActionState, useState } from "react";
import { cancelOrder, type AdminState } from "@/server/actions/admin";
import { ActionMessage } from "./AdminAction";

const idle: AdminState = { status: "idle", message: "" };

/** Cancel needs a reason and a second click, because it can't be undone. */
export function CancelOrder({ orderId, status }: { orderId: string; status: string }) {
  const [open, setOpen] = useState(false);
  const [state, run, pending] = useActionState(cancelOrder, idle);

  if (!open)
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-10 items-center self-start border border-error/60 px-4 font-mono text-caption01 tracking-[0.12em] text-error uppercase transition-colors hover:bg-error hover:text-background"
        >
          Cancel order…
        </button>
        {state.status !== "idle" && <ActionMessage state={state} />}
      </div>
    );

  return (
    <form action={run} className="flex flex-col gap-3 border border-error/40 p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <label className="flex flex-col gap-2">
        <span className="font-mono text-caption02 tracking-[0.12em] text-foreground-secondary uppercase">
          Reason (shown in the order history)
        </span>
        <input
          name="note"
          required
          minLength={3}
          maxLength={300}
          autoFocus
          className="border-0 border-b border-border-strong bg-transparent py-2 text-body01 focus:border-accent focus:outline-none"
          aria-invalid={state.fields?.note ? true : undefined}
        />
      </label>
      <p className="text-body02 text-foreground-secondary">
        Stock goes back on the shelf. A paid order is marked &ldquo;refund due&rdquo;: refund it in
        the Razorpay dashboard, then press &ldquo;Refund sent&rdquo; here.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 items-center bg-error px-4 font-mono text-caption01 tracking-[0.12em] text-background uppercase disabled:opacity-50"
        >
          {pending ? "Cancelling…" : "Cancel this order"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-10 px-2 font-mono text-caption01 tracking-[0.12em] text-foreground-secondary uppercase hover:text-foreground"
        >
          Keep it
        </button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}
