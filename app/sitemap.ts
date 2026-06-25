import type { MetadataRoute } from "next";
import { GAME_CATALOG, SITE_URL } from "@/lib/games/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/games`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/play`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...GAME_CATALOG.map((g) => ({
      url: `${SITE_URL}/play/${g.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
