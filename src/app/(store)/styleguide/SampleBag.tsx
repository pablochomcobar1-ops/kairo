"use client";

import { Button } from "@/components/ui/Button";
import { useCart, type CartLine } from "@/stores/cart";
import { useUi } from "@/stores/ui";

/** Styleguide-only: puts sample lines in the bag so the drawer can be tried before product pages exist. */
const SAMPLES: CartLine[] = [
  {
    variantId: "sample-nightfall-m",
    productSlug: "nightfall-riding-jacket",
    name: "Nightfall Riding Jacket",
    size: "M",
    colour: "Black",
    image: null,
    unitPaise: 1490000,
    qty: 1,
  },
  {
    variantId: "sample-static-l",
    productSlug: "static-heavy-tee",
    name: "Static Heavy Tee",
    size: "L",
    colour: "Bone",
    image: null,
    unitPaise: 220000,
    qty: 1,
  },
];

export function SampleBag() {
  const add = useCart((s) => s.add);
  const clear = useCart((s) => s.clear);
  const setCartOpen = useUi((s) => s.setCartOpen);

  return (
    <div className="flex flex-wrap gap-4">
      {SAMPLES.map((line) => (
        <Button
          key={line.variantId}
          variant="outline"
          onClick={() => {
            add(line);
            setCartOpen(true);
          }}
        >
          Add {line.name}
        </Button>
      ))}
      <Button variant="ghost" onClick={clear}>
        Empty the bag
      </Button>
    </div>
  );
}
