"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "./icons";

type FieldBase = {
  label: string;
  /** Helper text under the field, always read with it. */
  hint?: string;
  /** Error message. Marks the field invalid and is read by screen readers. */
  error?: string;
  className?: string;
};

const control = [
  "w-full bg-transparent text-body01 text-foreground placeholder:text-foreground-subtle",
  "border-0 border-b border-border-strong px-0",
  "transition-[border-color] duration-200 ease-ui",
  "hover:border-foreground-secondary focus:border-accent focus:outline-none",
  "aria-[invalid=true]:border-error",
  "disabled:opacity-50",
].join(" ");

function useFieldIds(hint?: string, error?: string) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { id, hintId, errorId, describedBy };
}

function Frame({
  id,
  label,
  hint,
  hintId,
  error,
  errorId,
  className,
  children,
}: FieldBase & { id: string; hintId?: string; errorId?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="font-mono text-caption01 uppercase text-foreground-secondary">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="text-body02 text-foreground-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-body02 text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ label, hint, error, className, ...rest }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const ids = useFieldIds(hint, error);
  return (
    <Frame {...ids} id={rest.id ?? ids.id} label={label} hint={hint} error={error} className={className}>
      <input
        id={rest.id ?? ids.id}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(control, "h-12")}
        {...rest}
      />
    </Frame>
  );
}

export function Textarea({ label, hint, error, className, ...rest }: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ids = useFieldIds(hint, error);
  return (
    <Frame {...ids} id={rest.id ?? ids.id} label={label} hint={hint} error={error} className={className}>
      <textarea
        id={rest.id ?? ids.id}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(control, "min-h-32 resize-y py-3")}
        {...rest}
      />
    </Frame>
  );
}

export function Select({
  label,
  hint,
  error,
  className,
  children,
  ...rest
}: FieldBase & SelectHTMLAttributes<HTMLSelectElement>) {
  const ids = useFieldIds(hint, error);
  return (
    <Frame {...ids} id={rest.id ?? ids.id} label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        <select
          id={rest.id ?? ids.id}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cn(control, "h-12 appearance-none pr-8 [&>option]:bg-background-tertiary")}
          {...rest}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-foreground-subtle" />
      </div>
    </Frame>
  );
}
