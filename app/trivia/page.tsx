import Link from "next/link";

const MODES = [
  {
    href: "/trivia/actors",
    emoji: "🎬",
    title: "Actor Blitz",
    description: "Guess the movie star from their photo",
    tag: "60 sec · Race the clock",
    accent: "#8b5cf6",
  },
];

const COMING_SOON = [
  { emoji: "🏆", title: "Sports Stars", description: "Identify legendary athletes" },
  { emoji: "🎵", title: "Music Icons", description: "Name that musician" },
];

export default function TriviaPage() {
  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Trivia</h1>
        <p className="mt-1 text-sm text-muted">Pick a game and challenge your friends.</p>
      </div>

      <div className="flex flex-col gap-3">
        {MODES.map(({ href, emoji, title, description, tag, accent }) => (
          <Link key={href} href={href} className="block active:scale-[0.99]">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 transition-all duration-150">
              <span className="text-4xl">{emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{title}</div>
                <div className="text-sm text-muted">{description}</div>
                <div className="mt-1 text-xs font-medium" style={{ color: accent }}>{tag}</div>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ background: accent }}
              >
                Play
              </span>
            </div>
          </Link>
        ))}

        <div className="mt-2 mb-1 text-xs font-semibold uppercase tracking-widest text-muted">Coming soon</div>

        {COMING_SOON.map(({ emoji, title, description }) => (
          <div
            key={title}
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 opacity-50"
          >
            <span className="text-4xl">{emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold">{title}</div>
              <div className="text-sm text-muted">{description}</div>
            </div>
            <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
              Soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
