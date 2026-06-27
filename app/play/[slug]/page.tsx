import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { GAME_CATALOG, getGameBySlug, SITE_URL } from "@/lib/games/catalog";

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

  return (
    <div className="px-4 pt-10 pb-24 lg:max-w-[760px] lg:mx-auto lg:px-8 lg:py-16">
      <p className="text-[12px] font-semibold tracking-widest text-muted uppercase">Slubstack</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight lg:text-4xl">{game.name}</h1>
      <p className="mt-4 text-base leading-relaxed text-muted lg:text-lg">{game.intro}</p>

      <Link
        href={game.playHref}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-[15px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
        style={{ background: game.accent }}
      >
        Play {game.name} <ArrowRight size={18} />
      </Link>

      <h2 className="mt-12 text-lg font-bold tracking-tight">How to play</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {game.how.map((step) => (
          <li key={step} className="flex items-start gap-3 text-[15px] leading-relaxed text-muted">
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: game.accent }}
            >
              <Check size={14} strokeWidth={3} />
            </span>
            {step}
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-2xl border border-border bg-[var(--surface)] p-6">
        <p className="text-sm leading-relaxed text-muted">
          {game.name} is free to play on Slubstack, with no sign-up needed to start.
          Browse the rest of the{" "}
          <Link href="/games" className="font-semibold underline" style={{ color: game.accent }}>
            games
          </Link>{" "}
          while you are here.
        </p>
      </div>
    </div>
  );
}
