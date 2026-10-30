"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/server/actions/auth";
import { FormMessage, GoogleButton, OrDivider, Turnstile, idle } from "./FormBits";

const link = "text-foreground underline underline-offset-4 transition-colors hover:text-accent";

export function LoginForm({ next, linkError }: { next: string; linkError?: boolean }) {
  const [state, action, pending] = useActionState(signIn, idle);
  const f = state.fields ?? {};
  const v = state.values ?? {};
  return (
    <div className="flex flex-col gap-8">
      {linkError && (
        <p role="alert" className="border border-error/40 px-4 py-3 text-body02 text-error">
          That link has expired or was already used. Sign in, or ask for a new link.
        </p>
      )}
      <GoogleButton next={next} />
      <OrDivider />
      <form action={action} className="flex flex-col gap-6" noValidate>
        <input type="hidden" name="next" value={next} />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={v.email}
          error={f.email}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={f.password}
        />
        <div className="-mt-2 flex justify-end">
          <Link
            href="/forgot-password"
            className="text-body02 text-foreground-secondary underline underline-offset-4 hover:text-accent"
          >
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={pending}>
          Sign in
        </Button>
        <FormMessage state={state} />
      </form>
      <p className="text-body02 text-foreground-secondary">
        New to Kairo?{" "}
        <Link
          href={`/signup${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className={link}
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUp, idle);
  const f = state.fields ?? {};
  const v = state.values ?? {};

  if (state.status === "ok") {
    return (
      <div className="flex flex-col gap-5" role="status">
        <p className="font-display text-heading02 font-bold">Check your inbox.</p>
        <p className="text-body01 text-foreground-secondary">{state.message}</p>
        <p className="text-body02 text-foreground-subtle">
          Nothing there? Look in spam, or wait a minute and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <GoogleButton next={next} />
      <OrDivider />
      <form action={action} className="flex flex-col gap-6" noValidate>
        <Input
          label="Full name"
          name="fullName"
          autoComplete="name"
          required
          maxLength={120}
          defaultValue={v.fullName}
          error={f.fullName}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={v.email}
          error={f.email}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          hint="At least 8 characters, with a letter and a number."
          error={f.password}
        />
        <Turnstile resetKey={state} />
        <Button type="submit" size="lg" loading={pending}>
          Create account
        </Button>
        <FormMessage state={state} />
        <p className="text-body02 text-foreground-subtle">
          By creating an account you agree to the{" "}
          <Link href="/terms" className={link}>
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className={link}>
            privacy policy
          </Link>
          .
        </p>
      </form>
      <p className="text-body02 text-foreground-secondary">
        Already have an account?{" "}
        <Link href="/login" className={link}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, idle);
  const f = state.fields ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={v.email}
        error={f.email}
        disabled={state.status === "ok"}
      />
      <Button type="submit" size="lg" loading={pending} disabled={state.status === "ok"}>
        Send reset link
      </Button>
      <FormMessage state={state} />
      <Link
        href="/login"
        className="text-body02 text-foreground-secondary underline underline-offset-4 hover:text-accent"
      >
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, idle);
  const f = state.fields ?? {};
  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <Input
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
        hint="At least 8 characters, with a letter and a number."
        error={f.password}
      />
      <Input
        label="Type it again"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        error={f.confirm}
      />
      <Button type="submit" size="lg" loading={pending}>
        Save new password
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
