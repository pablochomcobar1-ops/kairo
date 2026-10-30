import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackForm } from "@/components/checkout/TrackForm";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Check where your Kairo order is with its number and your email.",
};

export default function TrackPage({ searchParams }: PageProps<"/track">) {
  return (
    <div className="px-gutter py-section">
      <div className="mx-auto flex max-w-xl flex-col gap-10">
        <header className="flex flex-col gap-4">
          <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">Orders</p>
          <h1 className="font-display text-heading01 font-bold">Track an order</h1>
          <p className="text-body01 text-foreground-secondary">
            Use the order number from your confirmation email and the email you ordered with.
          </p>
        </header>
        <Suspense fallback={<div className="min-h-64" />}>
          <Track searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Track({ searchParams }: Pick<PageProps<"/track">, "searchParams">) {
  const params = await searchParams;
  const order = typeof params.order === "string" ? params.order.slice(0, 20).toUpperCase() : "";
  return <TrackForm initialOrder={/^[A-Z0-9-]*$/.test(order) ? order : ""} />;
}
