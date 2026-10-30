import type { Metadata } from "next";
import { AuthShell } from "@/components/account/AuthShell";
import { ForgotForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account"
      title="Forgot your password?"
      intro="Enter your email and we'll send a link to choose a new one."
    >
      <ForgotForm />
    </AuthShell>
  );
}
