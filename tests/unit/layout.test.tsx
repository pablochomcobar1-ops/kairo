import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...rest} />,
}));

const { Header } = await import("@/components/layout/Header");
const { MegaMenu } = await import("@/components/layout/MegaMenu");
const { CartDrawer } = await import("@/components/cart/CartDrawer");
const { Footer } = await import("@/components/layout/Footer");
const { useCart } = await import("@/stores/cart");
const { useUi } = await import("@/stores/ui");

const tee = {
  variantId: "v-tee",
  productSlug: "static-heavy-tee",
  name: "Static Heavy Tee",
  size: "L",
  colour: "Bone",
  image: null,
  unitPaise: 220000,
  qty: 1,
};

/** The free-shipping message (a live region, so screen readers hear it change). */
const shippingNote = () => screen.getByText((_, el) => el?.tagName === "P" && /free shipping/.test(el.textContent ?? ""));

beforeEach(() => {
  localStorage.clear();
  useCart.setState({ lines: [] });
  useUi.setState({ cartOpen: false, heroCount: 0 });
});

describe("MegaMenu", () => {
  it("is a disclosure: the button says whether the panel is open", async () => {
    const user = userEvent.setup();
    render(<MegaMenu />);
    const button = screen.getByRole("button", { name: /shop/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /old money/i })).not.toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    for (const name of [/streetwear/i, /formal/i, /old money/i, /riding/i, /shop all/i]) {
      expect(screen.getByRole("link", { name })).toBeVisible();
    }
  });

  it("closes on Escape and puts focus back on the button", async () => {
    const user = userEvent.setup();
    render(<MegaMenu />);
    const button = screen.getByRole("button", { name: /shop/i });
    await user.click(button);
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });
});

describe("Header", () => {
  it("shows how many items are in the bag and opens it", async () => {
    const user = userEvent.setup();
    render(<Header />);
    act(() => useCart.getState().add({ ...tee, qty: 2 }));
    const bag = screen.getByRole("button", { name: "Open bag (2)" });
    await user.click(bag);
    expect(useUi.getState().cartOpen).toBe(true);
  });

  it("has a skip link to the main content", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
  });

  it("names its icon links", () => {
    render(<Header />);
    for (const name of ["Search", "Wishlist", "Account", "KAIRO home"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });
});

describe("CartDrawer", () => {
  it("offers the four wardrobes when the bag is empty", () => {
    useUi.setState({ cartOpen: true });
    render(<CartDrawer />);
    const drawer = screen.getByRole("dialog", { name: "Your bag" });
    expect(within(drawer).getByText("Nothing in here yet.")).toBeInTheDocument();
    expect(within(drawer).getAllByRole("link")).toHaveLength(4);
  });

  it("shows lines, subtotal and how far you are from free shipping", () => {
    useCart.setState({ lines: [tee] });
    useUi.setState({ cartOpen: true });
    render(<CartDrawer />);
    const drawer = screen.getByRole("dialog", { name: "Your bag (1)" });
    expect(within(drawer).getByText("Static Heavy Tee")).toBeInTheDocument();
    expect(shippingNote()).toHaveTextContent("Add ₹800 more for free shipping.");
    expect(within(drawer).getByRole("link", { name: "Checkout" })).toHaveAttribute("href", "/checkout");
  });

  it("changes quantity, stops at 5, and removes", async () => {
    const user = userEvent.setup();
    useCart.setState({ lines: [{ ...tee, qty: 4 }] });
    useUi.setState({ cartOpen: true });
    render(<CartDrawer />);

    const minus = screen.getByRole("button", { name: "Decrease quantity" });
    const plus = screen.getByRole("button", { name: "Increase quantity" });
    await user.click(plus);
    expect(useCart.getState().lines[0].qty).toBe(5);
    expect(plus).toBeDisabled();
    expect(shippingNote()).toHaveTextContent("You've unlocked free shipping.");

    await user.click(minus);
    expect(useCart.getState().lines[0].qty).toBe(4);

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(useCart.getState().lines).toHaveLength(0);
  });
});

describe("Footer", () => {
  it("credits Jainam, says Kairo is a concept brand, and opens the credit in a new tab", () => {
    render(<Footer />);
    const credit = screen.getByRole("link", { name: /designed & built by jainam gondaliya/i });
    expect(credit).toHaveAttribute("target", "_blank");
    expect(credit).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByText(/Kairo is a concept brand\. Images are AI concept visuals\./)).toBeInTheDocument();
  });
});
