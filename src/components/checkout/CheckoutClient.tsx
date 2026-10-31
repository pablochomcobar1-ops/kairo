"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { ProductArt } from "@/components/product/ProductArt";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/money";
import { POLICY } from "@/lib/policies";
import { FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/pricing";
import { INDIAN_STATES } from "@/lib/validation";
import {
  confirmPayment,
  createCheckout,
  loadCheckoutProfile,
  quoteCheckout,
  type Quote,
  type SavedAddress,
} from "@/server/actions/checkout";
import { useCart } from "@/stores/cart";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let razorpayScript: Promise<void> | null = null;
function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  razorpayScript ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      razorpayScript = null;
      reject(new Error("Razorpay failed to load"));
    };
    document.head.appendChild(s);
  });
  return razorpayScript;
}

const emptyAddress = { name: "", line1: "", line2: "", city: "", state: "Gujarat", pincode: "" };

/**
 * Checkout: contact, delivery address, coupon, then Razorpay's own payment
 * window. Every price on this page comes from the server (quoteCheckout); the
 * bag in the browser only says which pieces and how many.
 */
export function CheckoutClient() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const removeLine = useCart((s) => s.remove);
  const clearCart = useCart((s) => s.clear);
  const [hydrated, setHydrated] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [chosen, setChosen] = useState<string | "new">("new");

  const [codeInput, setCodeInput] = useState("");
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, startQuote] = useTransition();

  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [paying, setPaying] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const items = useMemo(() => lines.map((l) => ({ variantId: l.variantId, qty: l.qty })), [lines]);
  const bagKey = JSON.stringify(items);

  // the bag is read from this browser after the first paint
  useEffect(() => {
    const unsub = useCart.persist.onFinishHydration(() => setHydrated(true));
    if (useCart.persist.hasHydrated()) queueMicrotask(() => setHydrated(true));
    else void useCart.persist.rehydrate();
    return unsub;
  }, []);

  // signed in: fill email, phone and the default address
  useEffect(() => {
    void loadCheckoutProfile()
      .then((p) => {
        if (!p) return;
        setEmail((e) => e || p.email);
        setPhone((v) => v || p.phone);
        setSaved(p.addresses);
        const first = p.addresses[0];
        if (first) {
          setChosen(first.id);
          setAddress({
            name: first.name,
            line1: first.line1,
            line2: first.line2 ?? "",
            city: first.city,
            state: first.state,
            pincode: first.pincode,
          });
          setPhone((v) => v || first.phone);
        }
      })
      .catch(() => {});
  }, []);

  const refreshQuote = useCallback(
    (couponCode: string) => {
      if (items.length === 0) return;
      startQuote(async () => {
        try {
          setQuote(await quoteCheckout(items, couponCode));
        } catch {
          setQuote({
            ok: false,
            error: "We couldn't check your bag just now. Refresh the page to try again.",
          });
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bagKey stands for items
    [bagKey],
  );

  useEffect(() => {
    if (hydrated) refreshQuote(code);
  }, [hydrated, refreshQuote, code]);

  function pickSaved(id: string) {
    setChosen(id);
    const a = saved.find((s) => s.id === id);
    if (a) {
      setAddress({
        name: a.name,
        line1: a.line1,
        line2: a.line2 ?? "",
        city: a.city,
        state: a.state,
        pincode: a.pincode,
      });
      setPhone(a.phone);
    } else {
      setAddress(emptyAddress);
    }
  }

  async function pay(e: FormEvent) {
    e.preventDefault();
    if (paying) return;
    setMessage(null);
    setFields({});
    setPaying(true);
    try {
      const result = await createCheckout({ email, phone, address, couponCode: code, items });
      if (!result.ok) {
        const shown = [
          "email",
          "phone",
          "couponCode",
          ...Object.keys(emptyAddress).map((k) => `address.${k}`),
        ];
        const unplaced = Object.entries(result.fields ?? {}).find(([k]) => !shown.includes(k));
        setFields(result.fields ?? {});
        setMessage({
          tone: "error",
          text: unplaced ? `${result.error} ${unplaced[1]}` : result.error,
        });
        if (result.variantId) refreshQuote(code);
        setPaying(false);
        window.setTimeout(
          () => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(),
          50,
        );
        return;
      }

      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Razorpay unavailable");
      const rzp = new window.Razorpay({
        key: result.keyId,
        amount: result.amountPaise,
        currency: "INR",
        name: "KAIRO",
        description: `Order ${result.orderNumber} · test mode`,
        order_id: result.razorpayOrderId,
        prefill: result.prefill,
        notes: { order_number: result.orderNumber },
        theme: { color: "#C9A66B", backdrop_color: "#0B0B0C" },
        handler: async (resp: RazorpayResponse) => {
          setMessage({ tone: "info", text: "Payment received. Confirming your order…" });
          const confirmed = await confirmPayment({
            razorpayOrderId: resp.razorpay_order_id,
            razorpayPaymentId: resp.razorpay_payment_id,
            signature: resp.razorpay_signature,
          });
          if (confirmed.ok) {
            clearCart();
            router.push(
              `/checkout/success?order=${encodeURIComponent(confirmed.orderNumber)}${confirmed.outOfStock ? "&issue=stock" : ""}`,
            );
          } else {
            setPaying(false);
            setMessage({ tone: "error", text: confirmed.error });
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setMessage({
              tone: "info",
              text: "Payment cancelled. Your bag is still here whenever you're ready.",
            });
          },
        },
      });
      rzp.on("payment.failed", (r) => {
        setMessage({
          tone: "error",
          text: `Payment didn't go through${r.error?.description ? `: ${r.error.description}` : "."} You can try again.`,
        });
      });
      rzp.open();
    } catch {
      setPaying(false);
      setMessage({
        tone: "error",
        text: "We couldn't open the payment window. Check your connection and try again.",
      });
    }
  }

  if (!hydrated) return <div className="min-h-[60svh]" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-5 py-10">
        <p className="font-display text-heading02 font-bold">Your bag is empty.</p>
        <Link href="/shop" className={buttonClasses("outline", "md")}>
          Back to the shop
        </Link>
      </div>
    );
  }

  const q = quote?.ok ? quote : null;
  const remaining = q
    ? Math.max(0, FREE_SHIPPING_THRESHOLD_PAISE - (q.totals.subtotal - q.totals.discount))
    : 0;
  const f = (k: string) => fields[k];
  const set = (k: keyof typeof address) => (e: { target: { value: string } }) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }));

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_26rem] lg:gap-16">
      <form
        ref={formRef}
        onSubmit={pay}
        noValidate
        className="flex flex-col gap-12"
        aria-busy={paying}
      >
        <fieldset className="flex flex-col gap-6">
          <legend className="mb-6 font-mono text-caption01 tracking-[0.16em] uppercase">
            1 · Contact
          </legend>
          <div className="grid gap-6 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={f("email")}
              hint="Your confirmation goes here."
            />
            <Input
              label="Mobile"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={f("phone")}
              hint="For delivery updates."
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-6">
          <legend className="mb-6 font-mono text-caption01 tracking-[0.16em] uppercase">
            2 · Delivery
          </legend>
          {saved.length > 0 && (
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Saved addresses">
              {saved.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 border p-4 text-body02 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent",
                    chosen === a.id
                      ? "border-foreground"
                      : "border-border-strong hover:border-foreground-secondary",
                  )}
                >
                  <input
                    type="radio"
                    name="saved"
                    checked={chosen === a.id}
                    onChange={() => pickSaved(a.id)}
                    className="mt-1 accent-[var(--k-accent)]"
                  />
                  <span>
                    <span className="font-semibold">{a.name}</span>, {a.line1}, {a.city} {a.pincode}
                  </span>
                </label>
              ))}
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 border p-4 text-body02 has-focus-visible:outline-2 has-focus-visible:outline-accent",
                  chosen === "new" ? "border-foreground" : "border-border-strong",
                )}
              >
                <input
                  type="radio"
                  name="saved"
                  checked={chosen === "new"}
                  onChange={() => pickSaved("new")}
                  className="accent-[var(--k-accent)]"
                />
                A different address
              </label>
            </div>
          )}
          {(chosen === "new" ||
            saved.length === 0 ||
            Object.keys(fields).some((k) => k.startsWith("address."))) && (
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                label="Full name"
                autoComplete="name"
                required
                value={address.name}
                onChange={set("name")}
                error={f("address.name")}
                className="sm:col-span-2"
              />
              <Input
                label="House, street"
                autoComplete="address-line1"
                required
                value={address.line1}
                onChange={set("line1")}
                error={f("address.line1")}
                className="sm:col-span-2"
              />
              <Input
                label="Area, landmark (optional)"
                autoComplete="address-line2"
                value={address.line2}
                onChange={set("line2")}
                error={f("address.line2")}
                className="sm:col-span-2"
              />
              <Input
                label="City"
                autoComplete="address-level2"
                required
                value={address.city}
                onChange={set("city")}
                error={f("address.city")}
              />
              <Input
                label="Pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                required
                value={address.pincode}
                onChange={set("pincode")}
                error={f("address.pincode")}
              />
              <Select
                label="State"
                autoComplete="address-level1"
                value={address.state}
                onChange={set("state")}
                error={f("address.state")}
                className="sm:col-span-2"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
          )}
        </fieldset>

        <div className="flex flex-col gap-4">
          <p className="font-mono text-caption01 tracking-[0.16em] uppercase">3 · Pay</p>
          <p className="text-body02 text-foreground-secondary">
            You&apos;ll pay in Razorpay&apos;s secure window (card, UPI or netbanking). Kairo never
            sees your card details. This store runs in{" "}
            <strong className="text-foreground">test mode</strong>: use Razorpay&apos;s test card,
            no real money moves.
          </p>
          <Button type="submit" size="lg" loading={paying} disabled={!q}>
            {q ? `Pay ${formatINR(q.totals.total)}` : "Pay"}
          </Button>
          {message && (
            <p
              role={message.tone === "error" ? "alert" : "status"}
              className={cn(
                "text-body02",
                message.tone === "error" ? "text-error" : "text-foreground-secondary",
              )}
            >
              {message.text}
            </p>
          )}
        </div>
      </form>

      <aside
        aria-label="Order summary"
        className="flex flex-col gap-6 self-start border border-border bg-background-secondary p-6 lg:sticky lg:top-24"
      >
        <h2 className="font-mono text-caption01 tracking-[0.16em] uppercase">Your order</h2>

        {quote && !quote.ok ? (
          <div
            role="alert"
            className="flex flex-col gap-3 border border-error/40 p-4 text-body02 text-error"
          >
            <p>{quote.error}</p>
            {quote.variantId && (
              <button
                type="button"
                onClick={() => removeLine(quote.variantId!)}
                className="self-start underline underline-offset-4"
              >
                Remove it from my bag
              </button>
            )}
          </div>
        ) : null}

        <ul
          className={cn(
            "flex flex-col divide-y divide-border transition-opacity",
            quoting && "opacity-60",
          )}
          aria-busy={quoting}
        >
          {(q?.lines ?? []).map((l) => (
            <li key={l.variantId} className="flex gap-4 py-4 first:pt-0">
              <div className="w-14 shrink-0 overflow-hidden bg-background-tertiary">
                <div className="relative aspect-[3/4]">
                  {l.image ? (
                    <Image src={l.image} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <ProductArt name={l.name} collection="" />
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 text-body02">
                <span className="font-semibold">{l.name}</span>
                <span className="text-foreground-secondary">
                  {l.colour} · {l.size} · Qty {l.qty}
                </span>
              </div>
              <span className="font-mono text-body02 tabular-nums">
                {formatINR(l.unitPaise * l.qty)}
              </span>
            </li>
          ))}
          {!q && !quote && (
            <li className="py-4 text-body02 text-foreground-subtle">Checking prices and stock…</li>
          )}
        </ul>

        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-3">
            <Input
              label="Coupon"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              maxLength={20}
              autoComplete="off"
              className="flex-1"
              error={q?.couponError ?? f("couponCode")}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setCode(codeInput.trim())}
              disabled={quoting || !codeInput.trim()}
            >
              Apply
            </Button>
          </div>
          {q?.coupon && (
            <p className="flex items-center justify-between text-body02 text-accent" role="status">
              <span>{q.coupon.code} applied</span>
              <button
                type="button"
                onClick={() => {
                  setCode("");
                  setCodeInput("");
                }}
                className="text-foreground-secondary underline underline-offset-4 hover:text-foreground"
              >
                Remove
              </button>
            </p>
          )}
        </div>

        {q && (
          <dl className="flex flex-col gap-2 border-t border-border pt-4 text-body02">
            <div className="flex justify-between">
              <dt className="text-foreground-secondary">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatINR(q.totals.subtotal)}</dd>
            </div>
            {q.totals.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">Discount</dt>
                <dd className="font-mono text-accent tabular-nums">
                  −{formatINR(q.totals.discount)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-foreground-secondary">Delivery</dt>
              <dd className="font-mono tabular-nums">
                {q.totals.shipping ? formatINR(q.totals.shipping) : "Free"}
              </dd>
            </div>
            {remaining > 0 && (
              <p className="text-caption01 text-foreground-subtle">
                Add {formatINR(remaining)} more for free delivery.
              </p>
            )}
            <div className="mt-2 flex justify-between border-t border-border pt-3 text-body01 font-semibold">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">{formatINR(q.totals.total)}</dd>
            </div>
          </dl>
        )}
        <p className="font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase">
          {POLICY.short}
        </p>
      </aside>
    </div>
  );
}
