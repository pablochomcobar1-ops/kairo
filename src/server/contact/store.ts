import "server-only";
import { escapeHtml, sendEmail } from "@/server/email";
import { createAdminClient } from "@/server/supabase/admin";
import type { ContactStore } from "./core";

/** Messages go to the contact_messages table (only admins can read it). */
export function supabaseContactStore(): ContactStore {
  return {
    async insert(row) {
      const { error } = await createAdminClient().from("contact_messages").insert(row);
      if (error) throw new Error(`Contact: insert failed: ${error.message}`);
    },
    // CONTACT_INBOX set → a copy lands in your email too (needs RESEND_API_KEY)
    async notify(row) {
      const to = process.env.CONTACT_INBOX;
      if (!to) return;
      await sendEmail({
        to,
        subject: `Kairo contact: ${row.name}`,
        text: `${row.name} <${row.email}>${row.phone ? ` · ${row.phone}` : ""}\n\n${row.message}`,
        html: `<p><strong>${escapeHtml(row.name)}</strong> &lt;${escapeHtml(row.email)}&gt;${row.phone ? ` · ${escapeHtml(row.phone)}` : ""}</p><p style="white-space:pre-wrap">${escapeHtml(row.message)}</p>`,
      });
    },
  };
}
