import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { GAME_CATALOG, getGameBySlug, SITE_URL } from "@/lib/games/catalog";
import { JsonLd } from "@/components/JsonLd";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GAME_CATALOG.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return {};

  const url = `${SITE_URL}/play/${game.slug}`;
  return {
    title: game.seoTitle,
    description: game.seoDescription,
    alternates: { canonical: `/play/${game.slug}` },
    openGraph: {
      type: "website",
      url,
      title: game.seoTitle,
      description: game.seoDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: game.seoTitle,
      description: game.seoDescription,
    },
  };
}

export default async function PlayLandingPage({ params }: Props) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const accent = game.accent;
  const idx = GAME_CATALOG.findIndex((g) => g.slug === game.slug);
  const more = Array.from({ length: 4 }, (_, k) => GAME_CATALOG[(idx + k + 1) % GAME_CATALOG.length]);

  const url = `${SITE_URL}/play/${game.slug}`;

  const gameName = game.name.replace(/\?+$/, "");
  const features = game.requiresAccount
    ? ["Free to play", "Free account needed", "Plays in your browser"]
    : ["Free to play", "No sign-up needed", "Plays in your browser"];
  const faqs = [
    {
      q: `Is ${gameName} free to play?`,
      a: game.requiresAccount
        ? `Yes. ${gameName} is completely free to play on Slubstack. You sign in with a free account to build with other players on the shared island.`
        : `Yes. ${gameName} is completely free to play on Slubstack, with no sign-up needed to start.`,
    },
    {
      q: `Do I need an account to play ${gameName}?`,
      a: game.requiresAccount
        ? `Yes. ${gameName} is a shared multiplayer world, so you sign in with a free Slubstack account before you join. Your account also saves your progress and stats across Slubstack.`
        : `No. You can start playing ${gameName} as a guest straight away. A free account lets you save your daily streak, track your stats and climb the league.`,
    },
    {
      q: `How do I play ${gameName}?`,
      a: game.how.join(" "),
    },
    {
      q: `Can I play ${gameName} on mobile?`,
      a: `Yes. ${gameName} runs in any modern browser, and Slubstack is a progressive web app you can add to your home screen to play like an app on iOS or Android.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        name: game.name,
        url,
        description: game.seoDescription,
        image: `${SITE_URL}/play/${game.slug}/opengraph-image`,
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
          { "@type": "ListItem", position: 2, name: "Games", item: `${SITE_URL}/play` },
          { "@type": "ListItem", position: 3, name: game.name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pt-6 pb-24 lg:max-w-[940px] lg:px-8 lg:py-12">
      <JsonLd data={jsonLd} />
      <section
        className="relative overflow-hidden rounded-3xl p-7 lg:p-12"
        style={{
          background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 18%, var(--surface)) 0%, var(--surface) 72%)`,
          border: `1.5px solid color-mix(in srgb, ${accent} 26%, transparent)`,
          boxShadow: `0 20px 55px -20px color-mix(in srgb, ${accent} 45%, transparent)`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full blur-3xl"
          style={{ background: `color-mix(in srgb, ${accent} 32%, transparent)` }}
        />

        <div className="relative">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold tracking-widest uppercase"
            style={{
              background: `color-mix(in srgb, ${accent} 14%, var(--surface))`,
              color: accent,
              border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
            }}
          >
            <Sparkles size={13} strokeWidth={2.5} /> Free game
          </span>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-fg lg:text-6xl">{game.name}</h1>

          <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-muted lg:text-lg">{game.intro}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {features.map((f) => (
              <span
                key={f}
                className="rounded-full px-3 py-1 text-[12.5px] font-semibold text-muted"
                style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}
              >
                {f}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={game.playHref}
              className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[16px] font-bold text-white transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
              style={{ background: accent, boxShadow: `0 12px 30px -8px color-mix(in srgb, ${accent} 60%, transparent)` }}
            >
              Play {game.name} <ArrowRight size={18} />
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-muted transition-colors hover:text-fg"
              style={{ border: "1.5px solid var(--border)" }}
            >
              Browse all games
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-bold tracking-tight text-fg lg:text-2xl">How to play</h2>
        <ol className="mt-5 grid gap-3 lg:grid-cols-3">
          {game.how.map((step, i) => (
            <li
              key={step}
              className="rounded-2xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[15px] font-extrabold text-white"
                style={{ background: accent }}
              >
                {i + 1}
              </div>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-bold tracking-tight text-fg lg:text-2xl">Frequently asked questions</h2>
        <div className="mt-5 grid gap-3">
          {faqs.map((f) => (
            <div
              key={f.q}
              className="rounded-2xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h3 className="text-[15px] font-bold text-fg">{f.q}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold tracking-tight text-fg lg:text-2xl">More free games</h2>
          <Link href="/play" className="text-[14px] font-semibold" style={{ color: accent }}>
            See all
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {more.map((g) => (
            <Link
              key={g.slug}
              href={`/play/${g.slug}`}
              className="group rounded-2xl p-4 transition-transform duration-150 hover:-translate-y-0.5"
              style={{
                background: `color-mix(in srgb, ${g.accent} 8%, var(--surface))`,
                border: `1px solid color-mix(in srgb, ${g.accent} 22%, transparent)`,
              }}
            >
              <div className="h-8 w-8 rounded-xl shadow-sm" style={{ background: g.accent }} />
              <div className="mt-3 text-[14px] font-bold leading-tight text-fg">{g.name}</div>
              <div className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-muted">
                Play <ArrowRight size={12} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-12 text-center text-[13px] leading-relaxed text-muted">
        {game.requiresAccount
          ? `${game.name} is free to play on Slubstack with a free account.`
          : `${game.name} is free to play on Slubstack, no sign-up needed to start.`}
      </p>
    </div>
  );
}
