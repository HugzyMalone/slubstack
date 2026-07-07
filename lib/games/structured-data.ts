import { SITE_URL, type GameCatalogEntry } from "@/lib/games/catalog";

export function dailyGameJsonLd(game: GameCatalogEntry) {
  const url = `${SITE_URL}${game.playHref}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        name: game.name,
        url,
        description: game.seoDescription,
        image: `${url}/opengraph-image`,
        applicationCategory: "GameApplication",
        operatingSystem: "Web browser",
        isAccessibleForFree: true,
        publisher: { "@id": `${SITE_URL}/#organization` },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "GBP",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Games", item: `${SITE_URL}/games` },
          { "@type": "ListItem", position: 3, name: game.name, item: url },
        ],
      },
    ],
  };
}
