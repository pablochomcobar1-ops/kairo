/**
 * Money is stored and calculated as whole paise (₹1 = 100 paise).
 * Only display code turns it into rupees.
 */

const whole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const withPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1490000 → "₹14,900"; 149050 → "₹1,490.50". Indian digit grouping (₹1,49,000). */
export function formatINR(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new Error(`formatINR expects integer paise, got ${paise}`);
  }
  return paise % 100 === 0 ? whole.format(paise / 100) : withPaise.format(paise / 100);
}

/** For admin inputs typed in rupees. Rounds to the nearest paisa. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
