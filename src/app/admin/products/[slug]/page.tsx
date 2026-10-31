import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader, AdminSkeleton } from "@/components/admin/AdminPage";
import { ProductEditForm } from "@/components/admin/ProductEditForm";
import { getProductForEdit, requireAdmin } from "@/server/admin/data";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[slug]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <EditProduct params={params} />
    </Suspense>
  );
}

async function EditProduct({ params }: Pick<PageProps<"/admin/products/[slug]">, "params">) {
  const { slug } = await params;
  await requireAdmin(`/admin/products/${slug}`);
  const p = await getProductForEdit(slug);
  if (!p) notFound();

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/products"
        className="mb-6 inline-block font-mono text-caption01 tracking-[0.12em] text-foreground-secondary uppercase hover:text-accent"
      >
        ← Products
      </Link>
      <AdminHeader eyebrow={p.collection.name} title={p.name}>
        <Link
          href={`/products/${p.slug}`}
          target="_blank"
          className="font-mono text-caption01 tracking-[0.12em] text-foreground-secondary uppercase hover:text-accent"
        >
          View in the shop ↗
        </Link>
      </AdminHeader>
      <ProductEditForm product={p} />
    </div>
  );
}
