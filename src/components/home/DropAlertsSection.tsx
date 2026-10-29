import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { DropAlertForm } from "./DropAlertForm";

/** 9 · Drop alerts signup, the last thing before the footer. */
export function DropAlertsSection() {
  return (
    <section aria-labelledby="alerts-title" className="border-t border-border px-gutter py-section">
      <div className="mx-auto grid max-w-site gap-10 md:grid-cols-2 md:items-end">
        <div className="flex flex-col gap-5">
          <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
            Drop alerts
          </p>
          <div id="alerts-title">
            <SplitText
              text={"First in line.\nEvery time."}
              className="font-display text-hero02 font-bold"
            />
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-md text-body01 text-foreground-secondary">
              One email when a drop opens, nothing in between. Unsubscribe in one click.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <DropAlertForm label="Your email" />
        </Reveal>
      </div>
    </section>
  );
}
