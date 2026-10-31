"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormMessage, idle, Turnstile } from "@/components/account/FormBits";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { sendContactMessage } from "@/server/actions/contact";

/** Name, email, an optional mobile and the message. Saved for the team; a reply comes by email. */
export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, idle);
  const f = state.fields ?? {};
  const v = state.values ?? {};
  const done = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "ok") done.current?.focus();
  }, [state]);

  if (state.status === "ok") {
    return (
      <div className="flex flex-col gap-3 border border-border p-8" role="status">
        <h2 ref={done} tabIndex={-1} className="font-display text-heading03 font-bold outline-none">
          Message sent
        </h2>
        <p className="max-w-prose text-body01 text-foreground-secondary">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-7 sm:grid-cols-2">
      <Input
        label="Name"
        name="name"
        defaultValue={v.name}
        autoComplete="name"
        required
        maxLength={120}
        error={f.name}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        defaultValue={v.email}
        autoComplete="email"
        inputMode="email"
        required
        maxLength={254}
        error={f.email}
      />
      <Input
        label="Mobile (optional)"
        name="phone"
        type="tel"
        defaultValue={v.phone}
        autoComplete="tel-national"
        inputMode="tel"
        hint="Only if you'd like a call back."
        error={f.phone}
        className="sm:col-span-2"
      />
      <Textarea
        label="Message"
        name="message"
        defaultValue={v.message}
        rows={6}
        required
        maxLength={4000}
        hint="Order number helps, if it's about an order."
        error={f.message}
        className="sm:col-span-2"
      />
      {/* people never see this field; bots fill it in */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="sm:col-span-2">
        <Turnstile resetKey={state} />
      </div>
      <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
        <Button type="submit" loading={pending}>
          Send message
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
