"use client";

import { useActionState, useEffect, useRef } from "react";
import { signInWithGoogle, type FormState } from "@/server/actions/auth";
import { cn } from "@/lib/cn";

export const idle: FormState = { status: "idle", message: "" };

/** The result line under a form: red for problems, quiet for success. Announced to screen readers. */
export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "min-h-6 text-body02",
        state.status === "error" ? "text-error" : "text-foreground-secondary",
        className,
      )}
    >
      {state.message}
    </p>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.9 10.7A5.4 5.4 0 0 1 3.6 9c0-.6.1-1.2.3-1.7V5H.9A9 9 0 0 0 0 9c0 1.5.4 2.9.9 4l3-2.3Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6Z"
      />
    </svg>
  );
}

/** "Continue with Google". Posts to a server action that sends the browser to Google. */
export function GoogleButton({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInWithGoogle, idle);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-3 border border-border-strong text-body02 font-semibold transition-[border-color,transform] duration-150 ease-ui hover:border-foreground-secondary active:scale-[0.98] disabled:opacity-60"
      >
        <GoogleMark />
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {state.status === "error" && <FormMessage state={state} />}
    </form>
  );
}

export function OrDivider() {
  return (
    <div
      className="flex items-center gap-4 font-mono text-caption02 tracking-[0.16em] text-foreground-subtle uppercase"
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Cloudflare's bot check. Usually invisible; it only shows a box when it
 * isn't sure. It adds a hidden "cf-turnstile-response" field to the form.
 * `resetKey` changes after every submit, because each token works only once.
 * Without NEXT_PUBLIC_TURNSTILE_SITE_KEY it renders nothing (the server then
 * skips the check on your PC, and refuses in production).
 */
export function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);

  useEffect(() => {
    if (!sitekey || !box.current) return;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey,
          theme: "auto",
          appearance: "interaction-only",
          action: "form",
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [sitekey]);

  useEffect(() => {
    if (resetKey !== undefined && widget.current && window.turnstile)
      window.turnstile.reset(widget.current);
  }, [resetKey]);

  if (!sitekey) return null;
  return <div ref={box} className="min-h-0 empty:hidden" />;
}
