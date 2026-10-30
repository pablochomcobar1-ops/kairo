"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addressSchema, fieldErrors } from "@/lib/validation";
import { accountsEnabled } from "@/server/auth";
import { createServerClient } from "@/server/supabase/server";
import type { FormState } from "./auth";

const FIELDS = ["id", "name", "phone", "line1", "line2", "city", "state", "pincode", "isDefault"];
const keep = (form: FormData) =>
  Object.fromEntries(
    FIELDS.map((k) => [
      k,
      typeof form.get(k) === "string" ? String(form.get(k)).slice(0, 300) : "",
    ]),
  );

const MAX_ADDRESSES = 10;
const uuid = z.uuid();

const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

async function signedInClient() {
  if (!accountsEnabled()) return null;
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, userId: data.user.id } : null;
}

/**
 * Add or edit an address. Row Level Security limits every query here to the
 * shopper's own rows; the user id always comes from the session, never the form.
 */
export async function saveAddress(_prev: FormState, form: FormData): Promise<FormState> {
  const ctx = await signedInClient();
  if (!ctx) return { values: keep(form), status: "error", message: "Please sign in again." };

  const parsed = addressSchema.safeParse({
    name: str(form, "name"),
    phone: str(form, "phone"),
    line1: str(form, "line1"),
    line2: str(form, "line2"),
    city: str(form, "city"),
    state: str(form, "state"),
    pincode: str(form, "pincode"),
    isDefault: form.get("isDefault") === "on",
  });
  if (!parsed.success)
    return {
      values: keep(form),
      status: "error",
      message: "Check the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };

  const rawId = str(form, "id");
  const id = rawId ? uuid.safeParse(rawId) : null;
  if (id && !id.success)
    return {
      values: keep(form),
      status: "error",
      message: "Something went wrong. Please try again.",
    };

  const { supabase, userId } = ctx;
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const isFirst = (count ?? 0) === 0;
  if (!id && (count ?? 0) >= MAX_ADDRESSES)
    return {
      values: keep(form),
      status: "error",
      message: `You can keep up to ${MAX_ADDRESSES} addresses.`,
    };

  const { isDefault, ...fields } = parsed.data;
  const makeDefault = isDefault || isFirst;
  // only one default per account (a unique index enforces it): clear the old one first
  if (makeDefault)
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("is_default", true);

  const row = { ...fields, is_default: makeDefault };
  const { error } = id?.success
    ? await supabase.from("addresses").update(row).eq("id", id.data).eq("user_id", userId)
    : await supabase.from("addresses").insert({ ...row, user_id: userId });
  if (error) {
    console.error("[addresses] save:", error.message);
    return {
      values: keep(form),
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
  revalidatePath("/account/addresses");
  return { status: "ok", message: id ? "Address updated." : "Address added." };
}

export async function deleteAddress(id: unknown): Promise<{ ok: boolean }> {
  const ctx = await signedInClient();
  const parsed = uuid.safeParse(id);
  if (!ctx || !parsed.success) return { ok: false };
  const { error } = await ctx.supabase
    .from("addresses")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", ctx.userId);
  revalidatePath("/account/addresses");
  return { ok: !error };
}

export async function makeDefaultAddress(id: unknown): Promise<{ ok: boolean }> {
  const ctx = await signedInClient();
  const parsed = uuid.safeParse(id);
  if (!ctx || !parsed.success) return { ok: false };
  await ctx.supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", ctx.userId)
    .eq("is_default", true);
  const { error } = await ctx.supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", parsed.data)
    .eq("user_id", ctx.userId);
  revalidatePath("/account/addresses");
  return { ok: !error };
}
