"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useActionState, useId } from "react";
import { joinDropAlerts, type DropAlertState } from "@/server/actions/dropAlerts";
import { cn } from "@/lib/cn";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";

const initial: DropAlertState = { status: "idle", message: "" };

/**
 * Email signup for drops. The underline draws in from the left on focus; on
 * success the button shrinks into a check. Works without JavaScript too (the
 * form posts to the server action like a normal form).
 */
export function DropAlertForm({
  dropSlug,
  label = "Email",
  className,
}: {
  dropSlug?: string | null;
  label?: string;
  className?: string;
}) {
  const [state, action, pending] = useActionState(joinDropAlerts, initial);
  const reduce = useReducedMotion();
  const id = useId();
  const done = state.status === "ok";

  return (
    <form action={action} className={cn("w-full max-w-xl", className)} noValidate>
      <input type="hidden" name="drop" value={dropSlug ?? ""} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label
        htmlFor={`${id}-email`}
        className="font-mono text-caption02 tracking-[0.16em] text-foreground-subtle uppercase"
      >
        {label}
      </label>
      <div className="group relative mt-2 flex items-center gap-3">
        <input
          id={`${id}-email`}
          name="email"
          defaultValue={state.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="you@example.com"
          disabled={done}
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={`${id}-msg`}
          className="peer h-14 w-full border-0 border-b border-border-strong bg-transparent text-body01 placeholder:text-foreground-subtle focus:outline-none disabled:opacity-60"
        />
        {/* the underline that draws on focus */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-500 ease-out-expo peer-focus:scale-x-100"
        />
        <motion.button
          type="submit"
          disabled={pending || done}
          layout={!reduce}
          aria-label={done ? "Signed up" : "Notify me"}
          className={cn(
            "inline-flex h-12 shrink-0 items-center justify-center gap-2 overflow-hidden bg-accent font-mono text-caption01 tracking-[0.14em] text-accent-foreground uppercase",
            "transition-[opacity,transform] duration-150 ease-ui active:scale-[0.97] disabled:cursor-default",
            done ? "w-12 rounded-full" : "px-5",
            pending && "opacity-70",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {done ? (
              <motion.span
                key="ok"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
              >
                <CheckIcon />
              </motion.span>
            ) : (
              <motion.span
                key="go"
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-2"
              >
                {pending ? "Saving" : "Notify me"}
                <ArrowRightIcon size={16} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      <p
        id={`${id}-msg`}
        role="status"
        className={cn(
          "mt-3 min-h-6 text-body02",
          state.status === "error" ? "text-error" : "text-foreground-secondary",
        )}
      >
        {state.message}
      </p>
    </form>
  );
}
