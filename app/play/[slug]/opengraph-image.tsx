import { getGameBySlug } from "@/lib/games/catalog";
import { renderOgCard } from "@/lib/og/card";

export const runtime = "nodejs";

export { alt, size, contentType } from "@/lib/og/card";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  return renderOgCard(
    game ? { name: game.name, accent: game.accent, tagline: "Free daily game on" } : undefined,
  );
}
