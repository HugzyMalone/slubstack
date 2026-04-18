import Link from "next/link";

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const LANGUAGES = [
  {
    href: "/spanish",
    code: "ES",
    title: "Spanish",
    description: "Match, quiz & type",
    iconBg: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)",
    badge: "New",
    accentColor: "#c2410c",
    units: "5 units · 75 words",
  },
  {
    href: "/mandarin",
    code: "中",
    title: "Mandarin",
    description: "Characters, pinyin & phrases",
    iconBg: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)",
    badge: null,
    accentColor: "#e11d48",
    units: "8 units · 160 cards",
  },
  {
    href: "/german",
    code: "DE",
    title: "German",
    description: "Start with Hallo",
    iconBg: "linear-gradient(135deg, #c2410c 0%, #f97316 100%)",
    badge: null,
    accentColor: "#f97316",
    units: "2 units · 35 words",
  },
];

export default function LanguagesPage() {
  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Languages</h1>
        <p className="mt-1 text-sm text-muted">Pick a language and start learning.</p>
      </div>

      <div className="flex flex-col gap-3">
        {LANGUAGES.map(({ href, code, title, description, iconBg, badge, units }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-150 active:scale-[0.98]"
            style={{
              background: "var(--surface)",
              border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
              boxShadow: "0 2px 8px color-mix(in srgb, var(--fg) 4%, transparent)",
            }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
              style={{ background: iconBg }}
            >
              {code}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold">{title}</span>
                {badge && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                    style={{ background: iconBg }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted">{description}</div>
              <div className="mt-0.5 text-xs text-muted/60">{units}</div>
            </div>
            <span className="shrink-0 text-muted"><ChevronRight /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
