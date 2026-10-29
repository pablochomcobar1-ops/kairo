/** Site-wide facts used in the footer, metadata and structured data. */
export const SITE = {
  name: "KAIRO",
  tagline: "Four lives. One label.",
  city: "Ahmedabad",
  /** Where "Designed & built by Jainam Gondaliya" links to. */
  creditName: "Jainam Gondaliya",
  creditUrl: process.env.NEXT_PUBLIC_CREDIT_URL || "https://github.com/pablochomcobar1-ops",
} as const;
