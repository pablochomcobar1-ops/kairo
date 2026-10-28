"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CloseIcon } from "./icons";

type Common = {
  title: string;
  /** Optional line under the title, read as the dialog's description. */
  description?: string;
  /** Element that opens it (a <button>). Omit when controlling `open` yourself. */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
};

/**
 * Centred modal (size guide, quick view). Focus is trapped inside, Escape and
 * the backdrop close it, and focus returns to the trigger. Modals stay centred,
 * so they scale from the middle rather than from the trigger.
 */
export function Dialog({ title, description, trigger, open, onOpenChange, children, className }: Common) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[80] bg-black/60 data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[81] flex max-h-[88svh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col",
            "border border-border bg-background-secondary text-foreground shadow-2xl",
            "data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in",
            className,
          )}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <header className="flex items-start justify-between gap-6 border-b border-border px-6 py-5">
            <div className="flex flex-col gap-1">
              <RadixDialog.Title className="font-display text-heading03 font-bold">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="text-body02 text-foreground-secondary">{description}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              aria-label="Close"
              className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center transition-[transform,color] duration-150 ease-ui hover:text-accent active:scale-[0.94]"
            >
              <CloseIcon />
            </RadixDialog.Close>
          </header>
          <div className="overflow-y-auto px-6 py-6">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export type DrawerSide = "right" | "left" | "bottom";

const sides: Record<DrawerSide, string> = {
  right:
    "inset-y-0 right-0 h-dvh w-full max-w-md border-l data-[state=closed]:animate-drawer-right-out data-[state=open]:animate-drawer-right-in",
  left:
    "inset-y-0 left-0 h-dvh w-full max-w-md border-r data-[state=closed]:animate-drawer-left-out data-[state=open]:animate-drawer-left-in",
  bottom:
    "inset-x-0 bottom-0 max-h-[85dvh] w-full border-t data-[state=closed]:animate-drawer-bottom-out data-[state=open]:animate-drawer-bottom-in",
};

/** Side sheet: cart (right), mobile menu (left), filters on phones (bottom). */
export function Drawer({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  side = "right",
  footer,
  children,
  className,
}: Common & { side?: DrawerSide; footer?: ReactNode }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[80] bg-black/60 data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in" />
        <RadixDialog.Content
          className={cn(
            "fixed z-[81] flex flex-col border-border bg-background-secondary text-foreground shadow-2xl",
            sides[side],
            className,
          )}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <header className="flex items-center justify-between gap-6 border-b border-border px-6 py-4">
            <RadixDialog.Title className="font-mono text-caption01 uppercase">{title}</RadixDialog.Title>
            {description && <RadixDialog.Description className="sr-only">{description}</RadixDialog.Description>}
            <RadixDialog.Close
              aria-label="Close"
              className="-mr-2 inline-flex size-11 items-center justify-center transition-[transform,color] duration-150 ease-ui hover:text-accent active:scale-[0.94]"
            >
              <CloseIcon />
            </RadixDialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">{children}</div>
          {footer && <footer className="border-t border-border px-6 py-5">{footer}</footer>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Close button for use inside dialog/drawer content (e.g. "Continue shopping"). */
export const DialogClose = RadixDialog.Close;
