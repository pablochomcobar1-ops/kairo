import { CollectionLink } from "@/components/layout/CollectionLink";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { CollectionInfo } from "@/lib/collections";
import { cn } from "@/lib/cn";

/** The words over each room: number and mood, name, tagline, the way in. */
export function RoomPanel({
  room,
  headingLevel = "h3",
  headingId,
  className,
}: {
  room: CollectionInfo;
  headingLevel?: "h2" | "h3";
  headingId?: string;
  className?: string;
}) {
  const Heading = headingLevel;
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <p className="font-mono text-caption01 uppercase text-accent">
        {room.number} · {room.mood}
      </p>
      <Heading id={headingId} className="font-display text-hero02 font-bold">
        {room.name}
      </Heading>
      <p className="text-heading03 text-foreground-secondary">{room.tagline}</p>
      <CollectionLink
        href={room.href}
        className="group mt-2 inline-flex min-h-11 items-center gap-3 self-start font-mono text-caption01 uppercase transition-colors duration-150 hover:text-accent"
      >
        Enter {room.name}
        <ArrowRightIcon size={16} className="transition-transform duration-200 ease-ui group-hover:translate-x-1" />
      </CollectionLink>
    </div>
  );
}
