"use client";

import { Dialog } from "@/components/ui/Dialog";
import { SIZE_TABLES, type SizeTableId } from "@/lib/size-guide";

/** "Size guide" link that opens the measurements for this kind of piece. */
export function SizeGuide({ table }: { table: SizeTableId }) {
  const t = SIZE_TABLES[table];
  return (
    <Dialog
      title="Size guide"
      description={t.title}
      trigger={
        <button
          type="button"
          className="font-mono text-caption01 tracking-[0.12em] text-foreground-secondary uppercase underline underline-offset-4 transition-colors hover:text-accent"
        >
          Size guide
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-left text-body02">
            <caption className="sr-only">{t.title}, body measurements</caption>
            <thead>
              <tr className="border-b border-border-strong">
                {t.columns.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="py-3 pr-4 font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map(([size, ...cells]) => (
                <tr key={size} className="border-b border-border">
                  <th scope="row" className="py-3 pr-4 font-mono font-semibold">
                    {size}
                  </th>
                  {cells.map((c, i) => (
                    <td
                      key={i}
                      className="py-3 pr-4 font-mono text-foreground-secondary tabular-nums"
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-body02 text-foreground-secondary">{t.note}</p>
      </div>
    </Dialog>
  );
}
