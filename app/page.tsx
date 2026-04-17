import Link from "next/link";
import { Panda } from "@/components/Panda";

const SECTIONS = [
  {
    href: "/spanish",
    flag: "🇪🇸",
    title: "Spanish",
    subtitle: "Games only — match, quiz & type",
    accent: "#c2410c",
    badge: "New",
  },
  {
    href: "/mandarin",
    flag: "🇨🇳",
    title: "Mandarin",
    subtitle: "Chinese characters & phrases",
    accent: "#e11d48",
    badge: null,
  },
  {
    href: "/german",
    flag: "🇩🇪",
    title: "German",
    subtitle: "Everyday German, starting with Hallo",
    accent: "#f97316",
    badge: null,
  },
  {
    href: "/trivia",
    flag: "🎬",
    title: "Trivia",
    subtitle: "Guess the actor — race the clock",
    accent: "#8b5cf6",
    badge: null,
  },
];

export default function HubPage() {
  return (
    <div className="mx-auto max-w-xl px-4 pb-24">
      <div className="flex flex-col items-center pt-0 pb-0">
        <div className="relative w-full" style={{ height: "32vh", maxHeight: 280 }}>
          <Panda mood="happy" fill />
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">What are you learning?</h1>
        <p className="mt-0.5 text-sm text-muted">Pick a section to get started.</p>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {SECTIONS.map(({ href, flag, title, subtitle, accent, badge }) => (
          <Link key={href} href={href} className="block active:scale-[0.985] transition-transform duration-150">
            <div
              className="flex items-center gap-4 rounded-2xl px-5 py-4"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 6%, var(--surface)) 0%, var(--surface) 60%)`,
                border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
                boxShadow: "0 2px 12px color-mix(in srgb, black 4%, transparent)",
                borderLeft: `3px solid ${accent}`,
              }}
            >
              <span className="text-[2.4rem] leading-none">{flag}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">{title}</span>
                  {badge && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                      style={{ background: accent }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-muted">{subtitle}</div>
              </div>
              <span
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold text-white"
                style={{ background: accent, boxShadow: `0 3px 10px color-mix(in srgb, ${accent} 40%, transparent)` }}
              >
                Go →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
