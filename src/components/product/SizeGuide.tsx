"use client";

import { Dialog } from "@/components/ui/Dialog";
import { SIZE_TABLES, type SizeTableId } from "@/lib/size-guide";
import { SizeTable } from "./SizeTable";

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
      <SizeTable table={table} />
    </Dialog>
  );
}
