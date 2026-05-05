import Link from "next/link";

function FilmIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.5" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H3.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h2.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

const MODES = [
  {
    href: "/trivia/actors",
    Icon: FilmIcon,
    iconBg: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)",
    title: "Actor Blitz",
    description: "Guess the movie star from their photo",
    tag: "30 sec · Race the clock",
    accent: "#8b5cf6",
  },
];

const COMING_SOON = [
  { Icon: TrophyIcon, iconBg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)", title: "Sports Stars", description: "Identify legendary athletes" },
  { Icon: MusicIcon, iconBg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", title: "Music Icons", description: "Name that musician" },
];

export default function TriviaPage() {
  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Trivia</h1>
        <p className="mt-1 text-sm text-muted">Pick a game and challenge your friends.</p>
      </div>

      <div className="flex flex-col gap-3">
        {MODES.map(({ href, Icon, iconBg, title, description, tag, accent }) => (
          <Link key={href} href={href} className="block active:scale-[0.99] transition-transform duration-150">
            <div
              className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-150"
              style={{
                background: "var(--surface)",
                border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ background: iconBg }}
              >
                <Icon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold">{title}</div>
                <div className="text-sm text-muted">{description}</div>
                <div className="mt-1 text-xs font-medium" style={{ color: accent }}>{tag}</div>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: accent }}
              >
                Play
              </span>
            </div>
          </Link>
        ))}

        <div className="mt-2 mb-1 text-xs font-semibold uppercase tracking-widest text-muted">Coming soon</div>

        {COMING_SOON.map(({ Icon, iconBg, title, description }) => (
          <div
            key={title}
            className="flex items-center gap-4 rounded-2xl px-5 py-4 opacity-45"
            style={{
              background: "var(--surface)",
              border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
            }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: iconBg }}
            >
              <Icon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">{title}</div>
              <div className="text-sm text-muted">{description}</div>
            </div>
            <span className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted">
              Soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
