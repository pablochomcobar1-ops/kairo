import { z } from "zod";

/**
 * Every form the site accepts, described once. The server parses every
 * submission with these (the browser's own checks are only a convenience).
 * Text is trimmed and length-limited; nothing here is ever rendered as HTML.
 */

const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(
      min,
      min <= 1 ? `Enter ${label}.` : `${label[0].toUpperCase()}${label.slice(1)} is too short.`,
    )
    .max(max, `${label[0].toUpperCase()}${label.slice(1)} is too long.`);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "That email is too long.")
  .pipe(z.email("Enter an email like name@example.com."));

/** bcrypt only reads the first 72 bytes, so longer passwords are refused rather than silently cut. */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.")
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Use at least one letter and one number.");

/** Indian mobile: 10 digits starting 6–9. Spaces, dashes and a +91 / 0 prefix are removed first. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91(?=\d{10}$)|0(?=\d{10}$))/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number."));

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a 6-digit pincode.");

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

// ---------- Accounts ----------

export const signupSchema = z.object({
  fullName: text(2, 120, "your name"),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(72, "Use at most 72 characters."),
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "The two passwords don't match.",
    path: ["confirm"],
  });

export const profileSchema = z.object({
  fullName: text(2, 120, "your name"),
  phone: z.union([z.literal(""), phoneSchema]).transform((v) => (v === "" ? null : v)),
});

export const addressSchema = z.object({
  name: text(2, 120, "the name"),
  phone: phoneSchema,
  line1: text(3, 200, "the address"),
  line2: z
    .string()
    .trim()
    .max(200, "Line 2 is too long.")
    .transform((v) => v || null),
  city: text(2, 80, "the city"),
  state: z.enum(INDIAN_STATES, "Choose a state."),
  pincode: pincodeSchema,
  isDefault: z.boolean().default(false),
});

// ---------- Shop ----------

export const contactSchema = z.object({
  name: text(2, 120, "your name"),
  email: emailSchema,
  phone: z.union([z.literal(""), phoneSchema]).transform((v) => (v === "" ? null : v)),
  message: text(10, 4000, "your message"),
});

export const reviewSchema = z.object({
  productSlug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(120),
  rating: z.coerce.number().int().min(1, "Choose a rating.").max(5, "Choose a rating."),
  authorName: text(2, 60, "your name"),
  title: text(2, 120, "a title"),
  body: text(10, 2000, "your review"),
});

/** KRO-YYMMDD-XXXX, without 0/O/1/I (see generate_order_number in the database). */
export const orderNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^KRO-\d{6}-[A-HJ-NP-Z2-9]{4}$/, "Order numbers look like KRO-261030-AB7K.");

export const trackSchema = z.object({ email: emailSchema, orderNumber: orderNumberSchema });

export const checkoutSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema.omit({ isDefault: true }),
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3,20}$/, "That code doesn't look right.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  items: z
    .array(z.object({ variantId: z.uuid(), qty: z.number().int().min(1).max(5) }))
    .min(1, "Your bag is empty.")
    .max(20, "Too many different pieces in one order."),
});

// ---------- Helpers ----------

/** First error per field, for showing next to each input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    out[key] ??= issue.message;
  }
  return out;
}

/**
 * Where to send someone after logging in. Only paths on this site are allowed
 * ("/account"), never "//evil.com" or "https://…", so a crafted link can't
 * bounce people to another website (open redirect).
 */
export function safeNextPath(raw: unknown, fallback = "/account"): string {
  if (typeof raw !== "string" || raw.length > 300) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(raw)) return fallback;
  return raw;
}
