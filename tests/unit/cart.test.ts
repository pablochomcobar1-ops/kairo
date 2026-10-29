import { beforeEach, describe, expect, it } from "vitest";
import { cartCount, cartSubtotal, useCart, type CartLine } from "@/stores/cart";
import { FREE_SHIPPING_THRESHOLD_PAISE, freeShippingProgress } from "@/lib/pricing";

const jacket: CartLine = {
  variantId: "v-jacket-m",
  productSlug: "nightfall-riding-jacket",
  name: "Nightfall Riding Jacket",
  size: "M",
  colour: "Black",
  image: null,
  unitPaise: 1490000,
  qty: 1,
};
const tee: CartLine = { ...jacket, variantId: "v-tee-l", productSlug: "static-heavy-tee", name: "Static Heavy Tee", size: "L", unitPaise: 220000 };

beforeEach(() => {
  localStorage.clear();
  useCart.setState({ lines: [] });
});

describe("cart store", () => {
  it("adds a new line", () => {
    useCart.getState().add(jacket);
    expect(useCart.getState().lines).toHaveLength(1);
  });

  it("sums quantity when the same size is added twice", () => {
    useCart.getState().add(jacket);
    useCart.getState().add({ ...jacket, qty: 2 });
    expect(useCart.getState().lines).toEqual([{ ...jacket, qty: 3 }]);
  });

  it("keeps different sizes of one product as separate lines", () => {
    useCart.getState().add(jacket);
    useCart.getState().add({ ...jacket, variantId: "v-jacket-l", size: "L" });
    expect(useCart.getState().lines).toHaveLength(2);
  });

  it("never goes above 5 of one item, or below 1", () => {
    useCart.getState().add({ ...jacket, qty: 4 });
    useCart.getState().add({ ...jacket, qty: 4 });
    expect(useCart.getState().lines[0].qty).toBe(5);
    useCart.getState().setQty(jacket.variantId, 0);
    expect(useCart.getState().lines[0].qty).toBe(1);
    useCart.getState().setQty(jacket.variantId, 99);
    expect(useCart.getState().lines[0].qty).toBe(5);
  });

  it("ignores junk quantities", () => {
    useCart.getState().add({ ...jacket, qty: Number.NaN });
    expect(useCart.getState().lines[0].qty).toBe(1);
    useCart.getState().setQty(jacket.variantId, 2.7);
    expect(useCart.getState().lines[0].qty).toBe(2);
  });

  it("removes a line and clears the bag", () => {
    useCart.getState().add(jacket);
    useCart.getState().add(tee);
    useCart.getState().remove(jacket.variantId);
    expect(useCart.getState().lines.map((l) => l.variantId)).toEqual([tee.variantId]);
    useCart.getState().clear();
    expect(useCart.getState().lines).toEqual([]);
  });

  it("counts items and adds up the display subtotal", () => {
    useCart.getState().add({ ...jacket, qty: 2 });
    useCart.getState().add(tee);
    const { lines } = useCart.getState();
    expect(cartCount(lines)).toBe(3);
    expect(cartSubtotal(lines)).toBe(2 * 1490000 + 220000);
  });

  it("saves the bag so it survives a reload", async () => {
    useCart.getState().add(tee);
    const raw = localStorage.getItem("kairo-cart-v1") ?? "{}";
    expect(JSON.parse(raw).state.lines).toHaveLength(1);

    // simulate a reload: memory is wiped (which also writes), storage still has the old bag
    useCart.setState({ lines: [] });
    localStorage.setItem("kairo-cart-v1", raw);
    await useCart.persist.rehydrate();
    expect(useCart.getState().lines).toHaveLength(1);
  });

  it("throws away a corrupted saved bag instead of crashing", async () => {
    localStorage.setItem("kairo-cart-v1", JSON.stringify({ state: { lines: [{ variantId: 5, qty: "lots" }] }, version: 1 }));
    await useCart.persist.rehydrate();
    expect(useCart.getState().lines).toEqual([]);
  });
});

describe("freeShippingProgress", () => {
  it("says how much is left until free shipping", () => {
    expect(freeShippingProgress(220000)).toEqual({ remainingPaise: 80000, ratio: 220000 / FREE_SHIPPING_THRESHOLD_PAISE, unlocked: false });
  });

  it("unlocks at exactly ₹3,000", () => {
    expect(freeShippingProgress(300000)).toEqual({ remainingPaise: 0, ratio: 1, unlocked: true });
    expect(freeShippingProgress(1490000).ratio).toBe(1);
  });

  it("handles an empty bag", () => {
    expect(freeShippingProgress(0)).toEqual({ remainingPaise: 300000, ratio: 0, unlocked: false });
  });
});
