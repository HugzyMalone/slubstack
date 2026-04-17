import Link from "next/link";
import { Panda } from "@/components/Panda";

const SECTIONS = [
  {
    href: "/mandarin",
    flag: "🇨🇳",
    title: "Mandarin",
    subtitle: "Chinese characters & phrases",
    accent: "#e11d48",
  },
  {
    href: "/german",
    flag: "🇩🇪",
    title: "German",
    subtitle: "Everyday German, starting with Hallo",
    accent: "#f97316",
  },
  {
    href: "/trivia",
    flag: "🎯",
    title: "Trivia",
    subtitle: "Challenge a friend — coming soon",
    accent: "#8b5cf6",
    disabled: true,
  },
];

export default function HubPage() {
  return (
    <div className="mx-auto max-w-xl px-4 pb-24">
      <div className="flex flex-col items-center pt-2 pb-2">
        <div className="relative w-full" style={{ height: "45vh", maxHeight: 420 }}>
          <Panda mood="happy" fill />
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">What are you learning?</h1>
        <p className="mt-1 text-sm text-muted">Pick a section to get started.</p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {SECTIONS.map(({ href, flag, title, subtitle, accent, disabled }) => {
          const inner = (
            <div
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 transition-all duration-150"
              style={disabled ? { opacity: 0.5 } : undefined}
            >
              <span className="text-4xl">{flag}</span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{title}</div>
                <div className="text-sm text-muted">{subtitle}</div>
              </div>
              {!disabled && (
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ background: accent }}
                >
                  Go
                </span>
              )}
              {disabled && (
                <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
                  Soon
                </span>
              )}
            </div>
          );

          return disabled ? (
            <div key={href}>{inner}</div>
          ) : (
            <Link key={href} href={href} className="block active:scale-[0.99]">
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
