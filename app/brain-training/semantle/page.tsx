import type { Metadata } from "next";
import { getGameBySlug } from "@/lib/games/catalog";
import { dailyGameJsonLd } from "@/lib/games/structured-data";
import { JsonLd } from "@/components/JsonLd";
import { Semantle } from "@/components/games/semantle/Semantle";

const game = getGameBySlug("semantle")!;

export const metadata: Metadata = {
  title: game.seoTitle,
  description: game.seoDescription,
  alternates: { canonical: game.playHref },
  openGraph: {
    type: "website",
    siteName: "Slubstack",
    title: game.seoTitle,
    description: game.seoDescription,
    url: game.playHref,
  },
  twitter: {
    card: "summary_large_image",
    title: game.seoTitle,
    description: game.seoDescription,
  },
};

export default function SemantlePage() {
  return (
    <>
      <Semantle />
      <JsonLd data={dailyGameJsonLd(game)} />
    </>
  );
}
