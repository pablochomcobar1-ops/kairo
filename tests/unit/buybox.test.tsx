import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BuyBox } from "@/components/product/BuyBox";
import { useCart } from "@/stores/cart";
import { useUi } from "@/stores/ui";

const product = {
  slug: "static-heavy-tee",
  name: "Static Heavy Tee",
  pricePaise: 220000,
  compareAtPaise: null,
  images: [],
};
const variants = [
  { id: "v-black-s", size: "S", colour: "Black", stock: 4 },
  { id: "v-black-m", size: "M", colour: "Black", stock: 0 },
  { id: "v-black-l", size: "L", colour: "Black", stock: 2 },
  { id: "v-bone-m", size: "M", colour: "Bone", stock: 9 },
];

describe("BuyBox", () => {
  beforeEach(() => {
    useCart.setState({ lines: [] });
    useUi.setState({ cartOpen: false });
    vi.useFakeTimers();
  });

  it("asks for a size before adding", () => {
    render(<BuyBox product={product} variants={variants} />);
    fireEvent.click(screen.getByRole("button", { name: /select a size/i }));
    expect(screen.getByText("Choose a size first.")).toBeTruthy();
    expect(useCart.getState().lines).toHaveLength(0);
  });

  it("sold-out sizes can't be picked", () => {
    render(<BuyBox product={product} variants={variants} />);
    const m = screen.getByRole("radio", { name: "M, sold out" });
    expect((m as HTMLInputElement).disabled).toBe(true);
  });

  it("adds the chosen size, shows low stock, opens the bag", () => {
    render(<BuyBox product={product} variants={variants} />);
    fireEvent.click(screen.getByRole("radio", { name: "L" }));
    expect(screen.getByText(/Only 2 left in L/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /add to bag/i }));
    expect(useCart.getState().lines).toEqual([
      expect.objectContaining({
        variantId: "v-black-l",
        size: "L",
        colour: "Black",
        unitPaise: 220000,
        qty: 1,
      }),
    ]);
    act(() => vi.advanceTimersByTime(500));
    expect(useUi.getState().cartOpen).toBe(true);
  });

  it("switching colour shows that colour's sizes and drops a size it doesn't have", () => {
    render(<BuyBox product={product} variants={variants} />);
    fireEvent.click(screen.getByRole("radio", { name: "S" }));
    fireEvent.click(screen.getByRole("radio", { name: "Bone" }));
    const sizes = screen
      .getAllByRole("radio")
      .filter((r) => r.getAttribute("name")?.endsWith("-size"));
    expect(sizes.map((r) => r.getAttribute("value"))).toEqual(["v-bone-m"]);
    expect(sizes.every((r) => !(r as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByRole("button", { name: /select a size/i })).toBeTruthy();
  });

  it("one-size pieces need no size choice", () => {
    render(
      <BuyBox
        product={{ ...product, name: "Knit Silk Tie" }}
        variants={[{ id: "tie", size: "ONE", colour: "Navy", stock: 5 }]}
      />,
    );
    expect(screen.queryByText("Size")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /add to bag/i }));
    expect(useCart.getState().lines[0]).toMatchObject({ variantId: "tie", size: "ONE" });
  });
});
