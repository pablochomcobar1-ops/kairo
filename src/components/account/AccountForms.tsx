"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { INDIAN_STATES } from "@/lib/validation";
import { updateProfile } from "@/server/actions/auth";
import { deleteAddress, makeDefaultAddress, saveAddress } from "@/server/actions/addresses";
import { FormMessage, idle } from "./FormBits";

export function ProfileForm({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, idle);
  const f = state.fields ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="grid gap-6 sm:grid-cols-2" noValidate>
      <Input
        label="Full name"
        name="fullName"
        defaultValue={v.fullName ?? fullName}
        autoComplete="name"
        required
        maxLength={120}
        error={f.fullName}
      />
      <Input
        label="Mobile"
        name="phone"
        defaultValue={v.phone ?? phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        hint="10 digits, for delivery updates."
        error={f.phone}
      />
      <Input
        label="Email"
        value={email}
        readOnly
        disabled
        hint="Your sign-in email can't be changed here."
        className="sm:col-span-2"
      />
      <div className="flex items-center gap-5 sm:col-span-2">
        <Button type="submit" loading={pending}>
          Save details
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export type AddressData = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export function AddressForm({ address, onDone }: { address?: AddressData; onDone?: () => void }) {
  const [state, action, pending] = useActionState(async (prev: typeof idle, form: FormData) => {
    const result = await saveAddress(prev, form);
    if (result.status === "ok") onDone?.();
    return result;
  }, idle);
  const f = state.fields ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="grid gap-6 sm:grid-cols-2" noValidate>
      {address && <input type="hidden" name="id" value={address.id} />}
      <Input
        label="Full name"
        name="name"
        defaultValue={v.name ?? address?.name}
        autoComplete="name"
        required
        error={f.name}
      />
      <Input
        label="Mobile"
        name="phone"
        defaultValue={v.phone ?? address?.phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required
        error={f.phone}
      />
      <Input
        label="House, street"
        name="line1"
        defaultValue={v.line1 ?? address?.line1}
        autoComplete="address-line1"
        required
        className="sm:col-span-2"
        error={f.line1}
      />
      <Input
        label="Area, landmark (optional)"
        name="line2"
        defaultValue={v.line2 ?? address?.line2 ?? ""}
        autoComplete="address-line2"
        className="sm:col-span-2"
        error={f.line2}
      />
      <Input
        label="City"
        name="city"
        defaultValue={v.city ?? address?.city}
        autoComplete="address-level2"
        required
        error={f.city}
      />
      <Input
        label="Pincode"
        name="pincode"
        defaultValue={v.pincode ?? address?.pincode}
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={6}
        required
        error={f.pincode}
      />
      <Select
        label="State"
        name="state"
        defaultValue={v.state || address?.state || "Gujarat"}
        autoComplete="address-level1"
        required
        error={f.state}
        className="sm:col-span-2"
      >
        {INDIAN_STATES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </Select>
      <label className="flex min-h-11 items-center gap-3 text-body02 sm:col-span-2">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={state.values ? v.isDefault === "on" : address?.is_default}
          className="size-5 accent-[var(--k-accent)]"
        />
        Use as my default address
      </label>
      <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
        <Button type="submit" loading={pending}>
          {address ? "Save address" : "Add address"}
        </Button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="font-mono text-caption01 tracking-[0.14em] uppercase underline underline-offset-4 hover:text-accent"
          >
            Cancel
          </button>
        )}
        <FormMessage state={state} />
      </div>
    </form>
  );
}

/** One saved address with Edit / Make default / Delete. */
export function AddressCard({ address }: { address: AddressData }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  if (editing) return <AddressForm address={address} onDone={() => setEditing(false)} />;

  const act = (fn: () => Promise<{ ok: boolean }>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? "" : "That didn't work. Please try again.");
    });

  return (
    <article className="flex flex-col gap-4 border border-border p-6" aria-busy={pending}>
      <div className="flex items-start justify-between gap-4">
        <address className="flex flex-col gap-1 text-body02 not-italic">
          <span className="font-semibold text-foreground">{address.name}</span>
          <span className="text-foreground-secondary">{address.line1}</span>
          {address.line2 && <span className="text-foreground-secondary">{address.line2}</span>}
          <span className="text-foreground-secondary">
            {address.city}, {address.state} {address.pincode}
          </span>
          <span className="font-mono text-foreground-secondary">+91 {address.phone}</span>
        </address>
        {address.is_default && (
          <span className="font-mono text-caption02 tracking-[0.14em] text-accent uppercase">
            Default
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-caption01 tracking-[0.12em] uppercase">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-11 underline underline-offset-4 hover:text-accent"
        >
          Edit
        </button>
        {!address.is_default && (
          <button
            type="button"
            onClick={() => act(() => makeDefaultAddress(address.id))}
            disabled={pending}
            className="min-h-11 underline underline-offset-4 hover:text-accent"
          >
            Make default
          </button>
        )}
        {confirming ? (
          <>
            <button
              type="button"
              onClick={() => act(() => deleteAddress(address.id))}
              disabled={pending}
              className="min-h-11 text-error underline underline-offset-4"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-11 underline underline-offset-4 hover:text-accent"
            >
              Keep it
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-11 underline underline-offset-4 hover:text-accent"
          >
            Delete
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-body02 text-error">
          {error}
        </p>
      )}
    </article>
  );
}

export function NewAddress({ startOpen }: { startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Add an address
      </Button>
    );
  }
  return (
    <section aria-label="New address" className="border border-border p-6">
      <AddressForm onDone={startOpen ? undefined : () => setOpen(false)} />
    </section>
  );
}
