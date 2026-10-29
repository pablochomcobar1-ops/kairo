import type { Metadata } from "next";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { CompleteTheLook } from "@/components/home/CompleteTheLook";
import { DropAlertsSection } from "@/components/home/DropAlertsSection";
import { DropTeaser } from "@/components/home/DropTeaser";
import { Hero } from "@/components/home/Hero";
import { NewInCarousel } from "@/components/home/NewInCarousel";
import { ReviewsStrip } from "@/components/home/ReviewsStrip";
import { StorySection } from "@/components/home/StorySection";
import { WardrobeJourney } from "@/components/three/journey/WardrobeJourney";
import { weekdayIST } from "@/lib/countdown";
import { getHomeData } from "@/server/catalog";

export const metadata: Metadata = {
  title: { absolute: "KAIRO — Four lives. One label." },
  description:
    "Menswear from Ahmedabad in four wardrobes: Streetwear, Formal, Old Money and Riding. Concept store by Jainam Gondaliya.",
};

export default async function HomePage() {
  const { newIn, drop, look, reviews } = await getHomeData();
  const dropShort = drop ? (drop.name.split("—")[0] ?? drop.name).trim() : null;

  const marquee = [
    "Four lives. One label.",
    "Cut in Ahmedabad",
    ...(drop && dropShort ? [`${dropShort} ${weekdayIST(drop.startsAt)}`] : []),
    "Streetwear · Formal · Old Money · Riding",
    "Free shipping over ₹3,000",
  ];

  return (
    <>
      <Hero dropSlug={drop?.slug ?? null} dropLabel={dropShort} />
      <BrandMarquee items={marquee} />
      <WardrobeJourney />
      {drop && drop.products.length > 0 && <DropTeaser drop={drop} />}
      {newIn.length > 0 && <NewInCarousel products={newIn} />}
      {look.length > 1 && <CompleteTheLook look={look} />}
      <StorySection />
      <ReviewsStrip reviews={reviews} />
      <DropAlertsSection />
    </>
  );
}
