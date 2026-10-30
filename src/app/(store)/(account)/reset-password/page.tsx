import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/account/AuthShell";
import { ResetForm } from "@/components/account/AuthForms";
import { getUser } from "@/server/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

/** Reached from the email link: the link signs the visitor in just long enough to set a new password. */
export default function ResetPasswordPage() {
  return (
    <AuthShell eyebrow="Account" title="Choose a new password">
      <Suspense fallback={<div className="min-h-64" />}>
        <Reset />
      </Suspense>
    </AuthShell>
  );
}

async function Reset() {
  const user = await getUser();
  if (!user) {
    return (
      <p className="text-body01 text-foreground-secondary">
        This reset link has expired or was already used.{" "}
        <Link
          href="/forgot-password"
          className="text-foreground underline underline-offset-4 hover:text-accent"
        >
          Ask for a new one
        </Link>
        .
      </p>
    );
  }
  return <ResetForm />;
}
