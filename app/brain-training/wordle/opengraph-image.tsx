import { getGameBySlug } from "@/lib/games/catalog";
import { renderOgCard } from "@/lib/og/card";

export const runtime = "nodejs";

export { alt, size, contentType } from "@/lib/og/card";

export default function Image() {
  const game = getGameBySlug("wordle");
  return renderOgCard({
    name: game?.name,
    accent: game?.accent,
    tagline: "Free daily game on",
  });
}
