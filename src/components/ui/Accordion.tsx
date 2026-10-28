"use client";

import * as RadixAccordion from "@radix-ui/react-accordion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PlusIcon } from "./icons";

export type AccordionItem = { id: string; title: string; content: ReactNode };

/** Fabric/fit/care on product pages, FAQ. Arrow keys move between headings. */
export function Accordion({
  items,
  defaultOpen,
  className,
}: {
  items: AccordionItem[];
  defaultOpen?: string;
  className?: string;
}) {
  return (
    <RadixAccordion.Root
      type="single"
      collapsible
      defaultValue={defaultOpen}
      className={cn("border-t border-border", className)}
    >
      {items.map((item) => (
        <RadixAccordion.Item key={item.id} value={item.id} className="border-b border-border">
          <RadixAccordion.Header asChild>
            <h3>
              <RadixAccordion.Trigger className="group flex min-h-14 w-full items-center justify-between gap-6 py-4 text-left font-mono text-caption01 uppercase transition-colors duration-150 hover:text-accent">
                {item.title}
                <PlusIcon
                  size={18}
                  className="shrink-0 transition-transform duration-200 ease-ui group-data-[state=open]:rotate-45"
                />
              </RadixAccordion.Trigger>
            </h3>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="pb-6 text-body02 text-foreground-secondary">{item.content}</div>
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}
