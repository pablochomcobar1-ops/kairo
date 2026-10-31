import { contactSchema, fieldErrors } from "@/lib/validation";

/**
 * A message from the contact page, without Next.js or Supabase so it is
 * unit-tested. Bots that fill the hidden "website" field get a normal-looking
 * thank-you and nothing is saved.
 */
export interface ContactRow {
  name: string;
  email: string;
  phone: string | null;
  message: string;
}

export interface ContactStore {
  insert(row: ContactRow): Promise<void>;
  /** optional heads-up email to the store owner; failures never block the message */
  notify?(row: ContactRow): Promise<unknown>;
}

export type ContactResult =
  | { status: "ok"; message: string; saved: boolean }
  | { status: "error"; message: string; fields?: Record<string, string> };

export const CONTACT_THANKS =
  "Thanks, your message is with us. We reply within one working day, from Ahmedabad.";

export function parseContact(input: {
  name: unknown;
  email: unknown;
  phone: unknown;
  message: unknown;
}) {
  return contactSchema.safeParse(input);
}

export async function sendContactCore(
  store: ContactStore,
  input: { name: unknown; email: unknown; phone: unknown; message: unknown; website?: unknown },
): Promise<ContactResult> {
  if (typeof input.website === "string" && input.website.length > 0)
    return { status: "ok", message: CONTACT_THANKS, saved: false };

  const parsed = parseContact(input);
  if (!parsed.success)
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };

  await store.insert(parsed.data);
  if (store.notify) await store.notify(parsed.data).catch(() => {});
  return { status: "ok", message: CONTACT_THANKS, saved: true };
}
