import { fieldErrors, reviewSchema } from "@/lib/validation";

/**
 * Reviews, without Next.js or Supabase, so the rules are unit-tested:
 *  - every new review waits as "pending" until an admin approves it,
 *  - "Verified buyer" only when the signed-in reviewer has a PAID order with
 *    that product (checked in the database, never taken from the form),
 *  - photos must really be JPEG / PNG / WebP (checked by their first bytes,
 *    not by the name or the type the browser claims) and small.
 */

export const MAX_PHOTOS = 4;
/** Per photo, after the browser has shrunk it. Hosting caps a whole request near 4.5 MB. */
export const MAX_PHOTO_BYTES = 1_500_000;
export const MAX_TOTAL_PHOTO_BYTES = 4_000_000;

export type PhotoKind = "jpg" | "png" | "webp";

/** Identify an image by its magic bytes. Anything else (SVG, HTML, a renamed .exe) is refused. */
export function sniffImage(bytes: Uint8Array): PhotoKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "jpg";
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)
  )
    return "png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "webp";
  return null;
}

export type PhotoCheck =
  { ok: true; photos: { bytes: Uint8Array; kind: PhotoKind }[] } | { ok: false; error: string };

export async function checkPhotos(files: Blob[]): Promise<PhotoCheck> {
  const real = files.filter((f) => f.size > 0);
  if (real.length > MAX_PHOTOS) return { ok: false, error: `Add up to ${MAX_PHOTOS} photos.` };
  if (real.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_PHOTO_BYTES)
    return { ok: false, error: "Those photos are too large together. Try fewer." };
  const photos: { bytes: Uint8Array; kind: PhotoKind }[] = [];
  for (const f of real) {
    if (f.size > MAX_PHOTO_BYTES) return { ok: false, error: "Each photo must be under 1.5 MB." };
    const bytes = new Uint8Array(await f.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) return { ok: false, error: "Photos must be JPEG, PNG or WebP images." };
    photos.push({ bytes, kind });
  }
  return { ok: true, photos };
}

export interface ReviewStore {
  /** a published product's id, or null */
  productId(slug: string): Promise<string | null>;
  /** true only with a paid order containing this product */
  isVerifiedBuyer(userId: string, productId: string): Promise<boolean>;
  /** the user's existing review of this product (one per person per product), if any */
  hasReviewed(userId: string, productId: string): Promise<boolean>;
  insert(row: {
    id: string;
    product_id: string;
    user_id: string | null;
    author_name: string;
    rating: number;
    title: string;
    body: string;
    is_verified: boolean;
    photo_paths: string[];
  }): Promise<void>;
  /** saves the photos under `<reviewId>/` and returns their paths */
  uploadPhotos(
    reviewId: string,
    photos: { bytes: Uint8Array; kind: PhotoKind }[],
  ): Promise<string[]>;
  /** clean-up when the review itself could not be saved */
  removePhotos(paths: string[]): Promise<void>;
}

export type ReviewResult =
  | { status: "ok"; message: string; verified: boolean }
  | { status: "error"; message: string; fields?: Record<string, string> };

export async function submitReviewCore(
  store: ReviewStore,
  input: {
    productSlug: unknown;
    rating: unknown;
    authorName: unknown;
    title: unknown;
    body: unknown;
  },
  photoFiles: Blob[],
  userId: string | null,
): Promise<ReviewResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success)
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };

  const photos = await checkPhotos(photoFiles);
  if (!photos.ok)
    return { status: "error", message: photos.error, fields: { photos: photos.error } };

  const productId = await store.productId(parsed.data.productSlug);
  if (!productId) return { status: "error", message: "We couldn't find that piece." };

  if (userId && (await store.hasReviewed(userId, productId))) {
    return { status: "error", message: "You've already reviewed this piece. Thank you!" };
  }

  const verified = userId ? await store.isVerifiedBuyer(userId, productId) : false;
  const reviewId = crypto.randomUUID();
  // photos first, so the row is written once with its photo paths
  const photoPaths = photos.photos.length ? await store.uploadPhotos(reviewId, photos.photos) : [];
  try {
    await store.insert({
      id: reviewId,
      product_id: productId,
      user_id: userId,
      author_name: parsed.data.authorName,
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      is_verified: verified,
      photo_paths: photoPaths,
    });
  } catch (err) {
    if (photoPaths.length) await store.removePhotos(photoPaths).catch(() => {});
    throw err;
  }

  return {
    status: "ok",
    verified,
    message: "Your review will appear once it's been checked, usually within a day.",
  };
}
