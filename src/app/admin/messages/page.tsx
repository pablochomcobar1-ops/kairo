import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminAction } from "@/components/admin/AdminAction";
import { AdminHeader, AdminSkeleton } from "@/components/admin/AdminPage";
import { adminDate } from "@/components/admin/StatusBadge";
import { cn } from "@/lib/cn";
import { setMessageHandled } from "@/server/actions/admin";
import { getMessages, requireAdmin } from "@/server/admin/data";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Messages />
    </Suspense>
  );
}

async function Messages() {
  await requireAdmin("/admin/messages");
  const messages = await getMessages();
  const open = messages.filter((m) => !m.is_handled).length;

  return (
    <>
      <AdminHeader title="Messages" eyebrow={`${open} open · from the contact page`} />
      {messages.length === 0 ? (
        <p className="py-10 text-body01 text-foreground-secondary">No messages yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "grid grid-cols-1 gap-4 border p-5 lg:grid-cols-[1fr_auto]",
                m.is_handled ? "border-border opacity-60" : "border-border-strong",
              )}
            >
              <div className="flex flex-col gap-2">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold">{m.name}</span>
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to Kairo")}`}
                    className="text-body02 text-foreground-secondary underline underline-offset-4 hover:text-accent"
                  >
                    {m.email}
                  </a>
                  {m.phone && (
                    <span className="font-mono text-body02 text-foreground-secondary">
                      {m.phone}
                    </span>
                  )}
                  <span className="font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase">
                    {adminDate(m.created_at)}
                  </span>
                </p>
                <p className="max-w-prose text-body01 whitespace-pre-line text-foreground-secondary">
                  {m.message}
                </p>
              </div>
              <AdminAction
                action={setMessageHandled}
                fields={{ messageId: m.id, handled: String(!m.is_handled) }}
                variant={m.is_handled ? "outline" : "primary"}
                className="self-start"
              >
                {m.is_handled ? "Reopen" : "Mark handled"}
              </AdminAction>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
