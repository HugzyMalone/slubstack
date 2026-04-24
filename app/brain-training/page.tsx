import Link from "next/link";

function MathIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="6" x2="9" y2="6" />
      <line x1="15" y1="18" x2="19" y2="18" />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.47 1.232 0 1.702l-1.879 1.879a.5.5 0 01-.86-.349V11.5a2 2 0 00-2-2h-1.13a.5.5 0 01-.349-.86l1.879-1.879a1.2 1.2 0 000-1.702L15.39 3.49a1.2 1.2 0 00-1.702 0L11.81 5.368a.5.5 0 01-.86-.35V3.5a2 2 0 00-2-2H4.5a2 2 0 00-2 2v4.45a2 2 0 002 2h1.518a.5.5 0 01.35.86L4.49 12.688a1.2 1.2 0 000 1.702l1.567 1.568c.23.23.556.338.878.289" />
      <path d="M4.5 19.5v-3.17a.5.5 0 01.86-.349l1.879 1.879a1.2 1.2 0 001.702 0l1.879-1.879a.5.5 0 01.86.349v1.17a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2h-1.17a.5.5 0 01-.349-.86l1.879-1.879" />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function SpeedIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function WordleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="9.5" y="3" width="5" height="5" rx="1" />
      <rect x="16" y="3" width="5" height="5" rx="1" />
      <rect x="3" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="16" y="9.5" width="5" height="5" rx="1" />
    </svg>
  );
}

function ConnectionsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const LIVE = [
  {
    href: "/brain-training/math-blitz",
    Icon: MathIcon,
    iconBg: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
    title: "Math Blitz",
    description: "30 seconds · how many can you get?",
    badge: null,
  },
  {
    href: "/brain-training/wordle",
    Icon: WordleIcon,
    iconBg: "linear-gradient(135deg, #6aaa64 0%, #c9b458 100%)",
    title: "Wordle",
    description: "Daily word puzzle · 6 tries to guess",
    badge: null,
  },
  {
    href: "/brain-training/connections",
    Icon: ConnectionsIcon,
    iconBg: "linear-gradient(135deg, #f9e04b 0%, #9b59d0 100%)",
    title: "Connections",
    description: "Daily · group four sets of four",
    badge: "New",
  },
];

const COMING_SOON = [
  {
    Icon: MemoryIcon,
    iconBg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
    title: "Memory Match",
    description: "Flip cards and find the pairs",
  },
  {
    Icon: PuzzleIcon,
    iconBg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    title: "Word Puzzles",
    description: "Unscramble, fill-in-the-blank & more",
  },
  {
    Icon: SpeedIcon,
    iconBg: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
    title: "Speed Recall",
    description: "How fast can you remember?",
  },
];

export default function BrainTrainingPage() {
  return (
    <div className="w-full px-4 pb-24 pt-8 lg:max-w-[1200px] lg:mx-auto lg:px-8 lg:py-10 lg:pb-16">
      <div className="mb-6 lg:mb-10 lg:max-w-2xl">
        <p className="text-[11px] font-semibold tracking-widest text-muted uppercase mb-1">Brain Training</p>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Sharpen your memory, focus &amp; logic.</h1>
        <p className="mt-2 text-sm lg:text-base text-muted">Short daily games that build real cognitive habits. XP counts toward your overall level.</p>
      </div>

      {/* Mobile — vertical list */}
      <div className="flex flex-col gap-3 lg:hidden">
        {LIVE.map(({ href, Icon, iconBg, title, description, badge }) => (
          <Link
            key={title}
            href={href}
            className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all active:scale-[0.98]"
            style={{
              background: "var(--surface)",
              border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
              boxShadow: "0 2px 8px color-mix(in srgb, var(--fg) 4%, transparent)",
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: iconBg }}>
              <Icon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold">{title}</span>
                {badge && (
                  <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white" style={{ background: iconBg }}>
                    {badge}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted">{description}</div>
            </div>
            <ChevronRight />
          </Link>
        ))}

        <div className="mb-1 mt-2 text-xs font-semibold uppercase tracking-widest text-muted">Coming soon</div>

        {COMING_SOON.map(({ Icon, iconBg, title, description }) => (
          <div
            key={title}
            className="flex items-center gap-4 rounded-2xl px-5 py-4 opacity-45"
            style={{ background: "var(--surface)", border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)" }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: iconBg }}>
              <Icon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">{title}</div>
              <div className="text-sm text-muted">{description}</div>
            </div>
            <span className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted">Soon</span>
          </div>
        ))}
      </div>

      {/* Desktop — card grid */}
      <div className="hidden lg:block">
        <h2 className="text-xs font-semibold tracking-widest text-muted uppercase mb-4">Daily games</h2>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {LIVE.map(({ href, Icon, iconBg, title, description, badge }) => (
            <Link
              key={title}
              href={href}
              className="group flex flex-col gap-4 rounded-2xl p-6 transition-all duration-150 hover:-translate-y-0.5"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-panel)",
                minHeight: 170,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: iconBg }}>
                  <Icon />
                </div>
                {badge && (
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white" style={{ background: iconBg }}>
                    {badge}
                  </span>
                )}
              </div>
              <div>
                <div className="text-[17px] font-bold leading-tight">{title}</div>
                <div className="mt-1 text-[13px] leading-snug text-muted">{description}</div>
              </div>
              <div className="mt-auto flex items-center gap-1 text-[13px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ color: "var(--accent)" }}>
                Play <ChevronRight />
              </div>
            </Link>
          ))}
        </div>

        <h2 className="text-xs font-semibold tracking-widest text-muted uppercase mt-10 mb-4">Coming soon</h2>
        <div className="grid grid-cols-3 gap-4">
          {COMING_SOON.map(({ Icon, iconBg, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl p-5 opacity-55"
              style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: iconBg }}>
                  <Icon />
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Soon</span>
              </div>
              <div>
                <div className="text-[15px] font-bold leading-tight">{title}</div>
                <div className="mt-1 text-[12px] leading-snug text-muted">{description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
