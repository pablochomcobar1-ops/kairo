import { describe, expect, it } from "vitest";
import { checkPhotos, sniffImage, submitReviewCore, type ReviewStore } from "@/server/reviews/core";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const WEBP = new Uint8Array([
  ...new TextEncoder().encode("RIFF"),
  0,
  0,
  0,
  0,
  ...new TextEncoder().encode("WEBP"),
]);
const blob = (bytes: Uint8Array, type = "image/jpeg") => new Blob([bytes as BlobPart], { type });

type Row = Parameters<ReviewStore["insert"]>[0];
function fakeStore(paidBuyers: string[] = []) {
  const rows: (Row & { status: string })[] = [];
  const uploaded: string[] = [];
  const store: ReviewStore = {
    productId: async (slug) => (slug === "static-heavy-tee" ? "p1" : null),
    isVerifiedBuyer: async (userId) => paidBuyers.includes(userId),
    hasReviewed: async (userId, productId) =>
      rows.some((r) => r.user_id === userId && r.product_id === productId),
    insert: async (row) => {
      if (row.title === "FAIL") throw new Error("db down");
      rows.push({ ...row, status: "pending" });
    },
    uploadPhotos: async (id, photos) => {
      const paths = photos.map((p, i) => `${id}/${i}.${p.kind}`);
      uploaded.push(...paths);
      return paths;
    },
    removePhotos: async (paths) => {
      for (const p of paths) uploaded.splice(uploaded.indexOf(p), 1);
    },
  };
  return { store, rows, uploaded };
}

const input = {
  productSlug: "static-heavy-tee",
  rating: "5",
  authorName: "Arjun",
  title: "Heavy and soft",
  body: "Holds its shape after many washes.",
};

describe("submitReviewCore", () => {
  it("a guest review is saved as pending and not verified", async () => {
    const { store, rows } = fakeStore();
    const r = await submitReviewCore(store, input, [], null);
    expect(r.status).toBe("ok");
    expect(rows[0]).toMatchObject({
      status: "pending",
      is_verified: false,
      user_id: null,
      rating: 5,
    });
  });

  it("a signed-in shopper with a paid order gets Verified buyer", async () => {
    const { store, rows } = fakeStore(["u-paid"]);
    await submitReviewCore(store, input, [], "u-paid");
    expect(rows[0].is_verified).toBe(true);
  });

  it("a shopper with only a failed order is not verified", async () => {
    const { store, rows } = fakeStore([]); // the database only counts paid orders
    await submitReviewCore(store, input, [], "u-failed");
    expect(rows[0].is_verified).toBe(false);
  });

  it("one review per person per piece", async () => {
    const { store } = fakeStore();
    await submitReviewCore(store, input, [], "u1");
    const again = await submitReviewCore(store, input, [], "u1");
    expect(again.status).toBe("error");
  });

  it("rejects unknown pieces and bad fields", async () => {
    const { store, rows } = fakeStore();
    expect(
      (await submitReviewCore(store, { ...input, productSlug: "nope" }, [], null)).status,
    ).toBe("error");
    const bad = await submitReviewCore(
      store,
      { ...input, body: "a".repeat(2001), rating: "9" },
      [],
      null,
    );
    expect(bad.status === "error" && bad.fields).toMatchObject({
      body: expect.any(String),
      rating: expect.any(String),
    });
    expect(rows).toHaveLength(0);
  });

  it("stores photos under the review's id", async () => {
    const { store, rows } = fakeStore();
    await submitReviewCore(store, input, [blob(JPEG), blob(PNG, "image/png")], null);
    const id = rows[0].id;
    expect(rows[0].photo_paths).toEqual([`${id}/0.jpg`, `${id}/1.png`]);
  });

  it("removes uploaded photos if the review can't be saved", async () => {
    const { store, uploaded } = fakeStore();
    await expect(
      submitReviewCore(store, { ...input, title: "FAIL" }, [blob(JPEG)], null),
    ).rejects.toThrow();
    expect(uploaded).toEqual([]);
  });
});

describe("photos", () => {
  it("knows real images by their bytes", () => {
    expect(sniffImage(JPEG)).toBe("jpg");
    expect(sniffImage(PNG)).toBe("png");
    expect(sniffImage(WEBP)).toBe("webp");
    expect(sniffImage(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("rejects a non-image even when it claims to be one", async () => {
    const fake = new Blob([new TextEncoder().encode("<html>")], { type: "image/png" });
    expect(await checkPhotos([fake])).toMatchObject({ ok: false });
  });

  it("rejects a photo over the size limit, and more than 4", async () => {
    const big = new Uint8Array(1_600_000);
    big.set(JPEG);
    expect(await checkPhotos([blob(big)])).toMatchObject({ ok: false });
    expect(await checkPhotos(Array.from({ length: 5 }, () => blob(JPEG)))).toMatchObject({
      ok: false,
    });
    expect(await checkPhotos([blob(JPEG), new Blob([])])).toMatchObject({ ok: true }); // empty file inputs are ignored
  });
});
