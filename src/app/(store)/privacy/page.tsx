import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Kairo stores about you, why, who processes it, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      crumbs={[{ label: "Privacy", href: "/privacy" }]}
      eyebrow="Legal · Updated 31 October 2026"
      title="Privacy"
      intro="Kairo is a concept store built as a portfolio project. It still treats your data as a real shop should: only what's needed, kept private, deleted on request."
    >
      <InfoSection id="what" title="What we keep">
        <ul>
          <li>
            <strong>Account:</strong> your email, name and, if you add them, mobile number and
            delivery addresses.
          </li>
          <li>
            <strong>Orders:</strong> what you bought, delivery details, and the payment reference
            from Razorpay. Card and UPI details never reach us.
          </li>
          <li>
            <strong>Reviews:</strong> the name you chose, your review and any photos. Photos are
            stored privately and shown only once the review is approved. They are resized in your
            browser before upload, which also removes hidden photo data such as location.
          </li>
          <li>
            <strong>Messages and drop alerts:</strong> what you send through Contact, and the email
            you leave for a drop.
          </li>
        </ul>
      </InfoSection>
      <InfoSection id="browser" title="In your browser">
        <p>
          One sign-in cookie keeps you signed in; it can&apos;t be read by scripts on the page. Your
          bag, wishlist and whether you&apos;ve seen the intro are kept in your browser&apos;s
          storage. There are no advertising or tracking cookies.
        </p>
      </InfoSection>
      <InfoSection id="who" title="Who processes it">
        <ul>
          <li>Supabase: database, accounts and photo storage.</li>
          <li>Razorpay: payments (test mode).</li>
          <li>Resend: order confirmation emails.</li>
          <li>Cloudflare Turnstile: telling people from bots on forms.</li>
          <li>
            Upstash: counting form attempts to stop abuse, using a scrambled form of your IP
            address.
          </li>
          <li>Vercel: hosting the site.</li>
        </ul>
      </InfoSection>
      <InfoSection id="delete" title="Seeing or deleting your data">
        <p>
          Signed in, you can see and change your details, addresses and orders under Account. To
          delete your account and everything tied to it, send a message through{" "}
          <Link href="/contact">Contact</Link> from the email on the account.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
