import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/account/AuthShell";
import { LoginForm } from "@/components/account/AuthForms";
import { safeNextPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell
      eyebrow="Account"
      title="Sign in"
      intro="Your orders, addresses and saved pieces, in one place."
    >
      <Suspense fallback={<div className="min-h-96" />}>
        <Login searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  return <LoginForm next={safeNextPath(params.next)} linkError={params.error === "link"} />;
}
