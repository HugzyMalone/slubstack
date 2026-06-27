import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GAME_CATALOG, SITE_URL } from "@/lib/games/catalog";

const TITLE = "Free Online Games — Word, Trivia & Party Games | Slubstack";
const DESCRIPTION =
  "Play free online games in your browser — daily word puzzles, mental maths, film trivia and multiplayer party games. No sign-up needed to start.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/play" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/play`,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function PlayHubPage() {
  return (
    <div className="px-4 pt-10 pb-24 lg:max-w-[960px] lg:mx-auto lg:px-8 lg:py-16">
      <p className="text-[12px] font-semibold tracking-widest text-muted uppercase">Slubstack</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight lg:text-4xl">Free online games</h1>
      <p className="mt-4 max-w-[640px] text-base leading-relaxed text-muted lg:text-lg">
        Daily word puzzles, mental maths, film trivia and silly multiplayer party games — all free
        to play in your browser, no sign-up needed to start.
      </p>

      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {GAME_CATALOG.map((game) => (
          <li key={game.slug}>
            <Link
              href={`/play/${game.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-border bg-[var(--surface)] p-6 transition-all hover:-translate-y-0.5 hover:shadow-sm"
            >
              <span className="flex items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: game.accent }} />
                <span className="text-lg font-bold tracking-tight">{game.name}</span>
              </span>
              <span className="mt-3 flex-1 text-[15px] leading-relaxed text-muted">
                {game.seoDescription}
              </span>
              <span
                className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold"
                style={{ color: game.accent }}
              >
                Play {game.name}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-2xl border border-border bg-[var(--surface)] p-6">
        <p className="text-sm leading-relaxed text-muted">
          Slubstack is a free games and learning hub. Browse the full{" "}
          <Link href="/games" className="font-semibold underline">
            games library
          </Link>{" "}
          to see everything you can play.
        </p>
      </div>
    </div>
  );
}
