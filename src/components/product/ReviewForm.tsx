"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { FormMessage, idle, Turnstile } from "@/components/account/FormBits";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { CloseIcon, PlusIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { submitReview } from "@/server/actions/reviews";

const MAX_PHOTOS = 4;
const MAX_SIDE = 1600;
const MAX_BYTES = 1_400_000;
const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/**
 * Shrink a photo to at most 1600px and re-save it as JPEG. Keeps uploads
 * small, and re-drawing it drops the hidden data phones add (like location).
 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.82, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("too large");
}

type Photo = { id: string; blob: Blob; url: string };

function StarPicker({
  value,
  onChange,
  error,
}: {
  value: number;
  onChange: (n: number) => void;
  error?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset aria-describedby={error ? "rating-error" : undefined}>
      <legend className="mb-3 font-mono text-caption02 tracking-[0.12em] text-foreground-secondary uppercase">
        Your rating
      </legend>
      <div className="flex items-center gap-4">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="cursor-pointer p-1 has-focus-visible:outline-2 has-focus-visible:outline-accent"
              onMouseEnter={() => setHover(n)}
            >
              <input
                type="radio"
                name="rating"
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                className="sr-only"
                aria-label={`${n} ${n === 1 ? "star" : "stars"}, ${RATING_WORDS[n]}`}
              />
              <svg
                viewBox="0 0 20 20"
                width={28}
                height={28}
                aria-hidden="true"
                className={cn(
                  "transition-colors duration-150",
                  n <= shown ? "text-accent" : "text-border-strong",
                )}
              >
                <path
                  fill="currentColor"
                  d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z"
                />
              </svg>
            </label>
          ))}
        </div>
        <span className="text-body02 text-foreground-secondary" aria-hidden="true">
          {RATING_WORDS[shown]}
        </span>
      </div>
      {error && (
        <p id="rating-error" className="mt-2 text-body02 text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** "Write a review": stars, a title, the review and up to 4 photos. Saved as pending until approved. */
export function ReviewForm({
  productSlug,
  productName,
}: {
  productSlug: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitReview, idle);
  const [, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState<string>();
  const [preparing, setPreparing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // a field's error goes away as soon as it is changed, not only on the next submit
  const [edited, setEdited] = useState<ReadonlySet<string>>(new Set());
  const f = Object.fromEntries(
    Object.entries(state.fields ?? {}).filter(([name]) => !edited.has(name)),
  );
  const markEdited = (name: string) => setEdited((s) => (s.has(name) ? s : new Set(s).add(name)));
  const v = state.values ?? {};

  // previews are object URLs: free them all when the form goes away
  const previewUrls = useRef(new Set<string>());
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  useEffect(() => {
    if (state.status === "ok") heading.current?.focus();
  }, [state]);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setPhotoError(undefined);
    markEdited("photos");
    const room = MAX_PHOTOS - photos.length;
    const picked = [...files].slice(0, room);
    if (files.length > room) setPhotoError(`Up to ${MAX_PHOTOS} photos.`);
    setPreparing(true);
    const added: Photo[] = [];
    for (const file of picked) {
      try {
        const blob = await shrink(file);
        const url = URL.createObjectURL(blob);
        previewUrls.current.add(url);
        added.push({ id: crypto.randomUUID(), blob, url });
      } catch {
        setPhotoError(`We couldn't use "${file.name}". Try a JPEG or PNG photo.`);
      }
    }
    setPhotos((p) => [...p, ...added]);
    setPreparing(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((list) => {
      const gone = list.find((p) => p.id === id);
      if (gone) {
        URL.revokeObjectURL(gone.url);
        previewUrls.current.delete(gone.url);
      }
      return list.filter((p) => p.id !== id);
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.delete("photos");
    photos.forEach((p, i) => data.append("photos", p.blob, `photo-${i + 1}.jpg`));
    startTransition(() => action(data));
    setAttempt((n) => n + 1);
    setEdited(new Set());
  }

  if (state.status === "ok") {
    return (
      <div className="flex flex-col gap-2 border border-border p-6" role="status">
        <h3
          ref={heading}
          tabIndex={-1}
          className="font-display text-heading03 font-bold outline-none"
        >
          Thank you
        </h3>
        <p className="max-w-prose text-body02 text-foreground-secondary">{state.message}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-controls="review-form"
      >
        Write a review
      </Button>
    );
  }

  return (
    <form
      id="review-form"
      onSubmit={onSubmit}
      onInput={(e) => {
        const name = (e.target as HTMLInputElement).name;
        if (name) markEdited(name);
      }}
      noValidate
      className="flex flex-col gap-7 border border-border p-6 md:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-heading03 font-bold">Review {productName}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="-m-2 p-2 text-foreground-secondary hover:text-foreground"
          aria-label="Close the review form"
        >
          <CloseIcon width={18} height={18} />
        </button>
      </div>
      <input type="hidden" name="productSlug" value={productSlug} />

      <StarPicker
        value={rating || Number(v.rating) || 0}
        onChange={(n) => {
          setRating(n);
          markEdited("rating");
        }}
        error={f.rating}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label="Your name"
          name="authorName"
          defaultValue={v.authorName}
          autoComplete="given-name"
          hint="Shown with your review."
          required
          maxLength={60}
          error={f.authorName}
        />
        <Input
          label="Title"
          name="title"
          defaultValue={v.title}
          required
          maxLength={120}
          error={f.title}
        />
      </div>
      <Textarea
        label="Your review"
        name="body"
        defaultValue={v.body}
        rows={5}
        required
        maxLength={2000}
        hint="Fit, fabric, how it wears. 10 to 2,000 characters."
        error={f.body}
      />

      <div className="flex flex-col gap-3">
        <span
          id="photos-label"
          className="font-mono text-caption02 tracking-[0.12em] text-foreground-secondary uppercase"
        >
          Photos (optional, up to {MAX_PHOTOS})
        </span>
        <ul className="flex flex-wrap gap-3" aria-labelledby="photos-label">
          {photos.map((p, i) => (
            <li key={p.id} className="relative size-20 overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- a local preview, not a hosted image */}
              <img src={p.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                className="absolute top-1 right-1 grid size-6 place-items-center bg-background/85 text-foreground"
                aria-label={`Remove photo ${i + 1}`}
              >
                <CloseIcon width={12} height={12} />
              </button>
            </li>
          ))}
          {photos.length < MAX_PHOTOS && (
            <li>
              <label
                className={cn(
                  "grid size-20 cursor-pointer place-items-center border border-dashed border-border-strong text-foreground-secondary transition-colors hover:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-accent",
                  preparing && "animate-pulse",
                )}
              >
                <PlusIcon width={18} height={18} aria-hidden="true" />
                <span className="sr-only">{preparing ? "Preparing photos" : "Add photos"}</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  className="sr-only"
                  disabled={preparing}
                  onChange={(e) => addPhotos(e.target.files)}
                />
              </label>
            </li>
          )}
        </ul>
        {(photoError || f.photos) && (
          <p className="text-body02 text-error">{photoError ?? f.photos}</p>
        )}
      </div>

      <Turnstile resetKey={attempt} />

      <div className="flex flex-wrap items-center gap-5">
        <Button type="submit" loading={pending} disabled={preparing}>
          Submit review
        </Button>
        <FormMessage state={state} />
      </div>
      <p className="text-caption01 text-foreground-subtle">
        Reviews are checked before they appear. If you&apos;re signed in and bought this piece,
        yours will carry a Verified buyer tag.
      </p>
    </form>
  );
}
