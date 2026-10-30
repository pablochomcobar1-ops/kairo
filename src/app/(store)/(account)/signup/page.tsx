import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/account/AuthShell";
import { SignupForm } from "@/components/account/AuthForms";
import { safeNextPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <AuthShell
      eyebrow="Account"
      title="Create an account"
      intro="Track orders, save addresses and keep a wishlist across devices. Checking out as a guest still works."
    >
      <Suspense fallback={<div className="min-h-96" />}>
        <Signup searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function Signup({ searchParams }: Pick<PageProps<"/signup">, "searchParams">) {
  const params = await searchParams;
  return <SignupForm next={safeNextPath(params.next)} />;
}
