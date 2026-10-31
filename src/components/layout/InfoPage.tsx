import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { cn } from "@/lib/cn";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

/** The plain pages (help, policies, contact): crumbs, an eyebrow, a big title, a short intro, then the content. */
export function InfoPage({
  crumbs,
  eyebrow,
  title,
  intro,
  children,
  wide = false,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  /** content wider than a reading column (tables, two-column layouts) */
  wide?: boolean;
}) {
  return (
    <div className="px-gutter pt-10 pb-section">
      <div className="mx-auto flex max-w-site flex-col gap-14 md:gap-20">
        <header className="flex flex-col gap-6">
          <Breadcrumbs items={crumbs} />
          <Reveal>
            <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
              {eyebrow}
            </p>
          </Reveal>
          <SplitText
            as="h1"
            immediate
            text={title}
            className="font-display text-hero02 font-bold"
          />
          {intro && (
            <Reveal delay={0.2}>
              <div className="max-w-2xl text-body01 text-foreground-secondary">{intro}</div>
            </Reveal>
          )}
        </header>
        <div className={cn(!wide && "max-w-3xl")}>{children}</div>
      </div>
    </div>
  );
}

/** A titled block of copy inside an InfoPage. */
export function InfoSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className="scroll-mt-28 border-t border-border py-10 first:border-t-0 first:pt-0"
    >
      <h2
        id={id ? `${id}-title` : undefined}
        className="mb-5 font-display text-heading03 font-bold"
      >
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-body01 text-foreground-secondary [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-accent [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
