import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getGameBySlug } from "@/lib/games/catalog";

const game = getGameBySlug("connections")!;

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

export default function ConnectionsLayout({ children }: { children: ReactNode }) {
  return children;
}
