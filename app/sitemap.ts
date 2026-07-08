import type { MetadataRoute } from "next";
import { GAME_CATALOG, SITE_URL } from "@/lib/games/catalog";

const DAILY_GAME_SLUGS = ["wordle", "connections", "semantle"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const dailyGames = GAME_CATALOG.filter((g) =>
    (DAILY_GAME_SLUGS as readonly string[]).includes(g.slug),
  );
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/games`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/play`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...dailyGames.map((g) => ({
      url: `${SITE_URL}${g.playHref}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...GAME_CATALOG.map((g) => ({
      url: `${SITE_URL}/play/${g.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
