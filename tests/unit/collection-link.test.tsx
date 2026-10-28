import { fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const go = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest} />
  ),
}));
vi.mock("@/components/layout/Curtain", () => ({
  useCurtain: () => ({ go, busy: false }),
}));

const { CollectionLink } = await import("@/components/layout/CollectionLink");

describe("CollectionLink", () => {
  beforeEach(() => go.mockClear());

  it("plays the curtain in the destination's theme on a plain click", () => {
    render(<CollectionLink href="/collections/old-money">Old Money</CollectionLink>);
    fireEvent.click(screen.getByRole("link", { name: "Old Money" }));
    expect(go).toHaveBeenCalledWith("/collections/old-money", "old-money");
  });

  it("uses an explicit theme when given (e.g. a product page)", () => {
    render(
      <CollectionLink href="/products/nightfall-riding-jacket" theme="riding">
        Jacket
      </CollectionLink>,
    );
    fireEvent.click(screen.getByRole("link", { name: "Jacket" }));
    expect(go).toHaveBeenCalledWith("/products/nightfall-riding-jacket", "riding");
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }])(
    "leaves the browser alone for %o (new tab, new window)",
    (modifier) => {
      render(<CollectionLink href="/collections/riding">Riding</CollectionLink>);
      fireEvent.click(screen.getByRole("link", { name: "Riding" }), modifier);
      expect(go).not.toHaveBeenCalled();
    },
  );

  it("stays a real, crawlable link", () => {
    render(<CollectionLink href="/collections/formal">Formal</CollectionLink>);
    expect(screen.getByRole("link", { name: "Formal" })).toHaveAttribute("href", "/collections/formal");
  });
});
