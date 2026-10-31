import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminAction } from "@/components/admin/AdminAction";
import { AdminHeader, AdminSkeleton, td, th } from "@/components/admin/AdminPage";
import { Price } from "@/components/ui/Price";
import { cleanSearch } from "@/lib/admin";
import { collectionBySlug } from "@/lib/collections";
import { setPublished } from "@/server/actions/admin";
import { getProducts, requireAdmin } from "@/server/admin/data";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}

async function Products({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  await requireAdmin("/admin/products");
  const q = cleanSearch((await searchParams).q);
  const products = await getProducts(q);

  return (
    <>
      <AdminHeader title="Products" eyebrow={`${products.length} pieces`}>
        <form role="search" className="flex w-full max-w-sm items-end gap-3 sm:w-auto">
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase">
              Name
            </span>
            <input
              name="q"
              defaultValue={q}
              type="search"
              className="border-0 border-b border-border-strong bg-transparent py-2 text-body01 focus:border-accent focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="min-h-10 border border-border-strong px-4 font-mono text-caption01 uppercase hover:border-accent hover:text-accent"
          >
            Find
          </button>
        </form>
      </AdminHeader>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-body02">
          <thead>
            <tr className="border-b border-border-strong">
              <th className={th} scope="col">
                Piece
              </th>
              <th className={th} scope="col">
                Collection
              </th>
              <th className={`${th} text-right`} scope="col">
                Price
              </th>
              <th className={`${th} text-right`} scope="col">
                In stock
              </th>
              <th className={th} scope="col">
                In the shop
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border transition-colors hover:bg-background-secondary"
              >
                <td className={td}>
                  <Link
                    href={`/admin/products/${p.slug}`}
                    className="font-semibold hover:text-accent"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className={`${td} text-foreground-secondary`}>
                  {collectionBySlug(p.collection)?.name ?? p.collection}
                </td>
                <td className={`${td} text-right`}>
                  <Price paise={p.pricePaise} compareAtPaise={p.compareAtPaise} />
                </td>
                <td className={`${td} text-right font-mono tabular-nums`}>
                  {p.stock}
                  {p.lowSizes > 0 && (
                    <span className="block text-caption01 text-accent">{p.lowSizes} sizes low</span>
                  )}
                </td>
                <td className={td}>
                  <AdminAction
                    action={setPublished}
                    fields={{ productId: p.id, published: String(!p.published) }}
                    variant={p.published ? "outline" : "primary"}
                  >
                    {p.published ? "Shown · hide" : "Hidden · show"}
                  </AdminAction>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
