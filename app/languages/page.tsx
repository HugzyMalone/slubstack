"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "zustand";
import { mandarinStore, germanStore, spanishStore } from "@/lib/store";
import { levelFromXp } from "@/lib/xp";
import { useHydrated } from "@/lib/hooks";

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

type Lang = {
  code: "es" | "zh" | "de";
  href: string;
  badge: string;
  title: string;
  description: string;
  meta: string;
  gradient: string;
  xpKey: "spanish" | "mandarin" | "german";
  subOptions?: { label: string; href: string; icon: string }[];
};

const LANGUAGES: Lang[] = [
  {
    code: "de",
    href: "/german",
    badge: "DE",
    title: "German",
    description: "Gender, cases, verbs — grammar-first drills.",
    meta: "18 units · 287 cards",
    gradient: "linear-gradient(135deg, #c2410c 0%, #f97316 100%)",
    xpKey: "german",
  },
  {
    code: "zh",
    href: "/mandarin",
    badge: "中",
    title: "Mandarin",
    description: "Characters, pinyin, tones, grammar drills & phrases.",
    meta: "12 units · 249 cards",
    gradient: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)",
    xpKey: "mandarin",
    subOptions: [
      { label: "Curriculum", href: "/mandarin", icon: "📚" },
      { label: "Vocab reference", href: "/mandarin/vocab", icon: "📖" },
    ],
  },
  {
    code: "es",
    href: "/spanish",
    badge: "ES",
    title: "Spanish",
    description: "Match, quiz & type through the core vocab tree.",
    meta: "8 units · 116 cards",
    gradient: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)",
    xpKey: "spanish",
  },
];

export default function LanguagesPage() {
  const hydrated = useHydrated();
  const spanishXp = useStore(spanishStore, (s) => s.xp);
  const mandarinXp = useStore(mandarinStore, (s) => s.xp);
  const germanXp = useStore(germanStore, (s) => s.xp);
  const [mandarinOpen, setMandarinOpen] = useState(false);

  const xpMap = { spanish: spanishXp, mandarin: mandarinXp, german: germanXp };

  return (
    <div className="w-full px-4 pb-24 pt-6 lg:max-w-[1200px] lg:mx-auto lg:px-8 lg:py-10 lg:pb-16">
      <div className="mb-6 lg:mb-10 lg:max-w-2xl">
        <p className="text-[11px] font-semibold tracking-widest text-muted uppercase mb-1">Languages</p>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Pick a language and start learning.</h1>
        <p className="mt-2 text-sm lg:text-base text-muted">
          Each language has its own skill tree, SRS review and flashcard deck. Your progress is tracked per language.
        </p>
      </div>

      {/* Mobile — vertical list (original behaviour, Mandarin accordion) */}
      <div className="flex flex-col gap-3 lg:hidden">
        {LANGUAGES.map((lang) => {
          const level = hydrated ? levelFromXp(xpMap[lang.xpKey]) : 0;
          if (lang.subOptions) {
            return (
              <div
                key={lang.code}
                className="rounded-2xl"
                style={{
                  background: "var(--surface)",
                  border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
                  boxShadow: "0 2px 8px color-mix(in srgb, var(--fg) 4%, transparent)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setMandarinOpen((o) => !o)}
                  className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-150 active:scale-[0.98]"
                  aria-expanded={mandarinOpen}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
                    style={{ background: lang.gradient }}
                  >
                    {lang.badge}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold">{lang.title}</span>
                      {hydrated && (
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-muted/70 bg-border/60">
                          Lv. {level}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted">{lang.description}</div>
                    <div className="mt-0.5 text-xs text-muted/60">{lang.meta}</div>
                  </div>
                  <motion.span className="shrink-0 text-muted" animate={{ rotate: mandarinOpen ? 0 : -90 }} transition={{ duration: 0.2 }}>
                    <ChevronDown />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {mandarinOpen && (
                    <motion.div
                      key="opts"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-2 px-3 pb-3">
                        {lang.subOptions.map((o) => (
                          <Link
                            key={o.href}
                            href={o.href}
                            className="flex items-center justify-between rounded-xl px-4 py-3 text-[14px] font-medium transition-transform duration-150 active:scale-[0.98]"
                            style={{
                              background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                              border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
                            }}
                          >
                            <span>{o.icon} {o.label}</span>
                            <span className="text-muted"><ChevronRight /></span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }
          return (
            <Link
              key={lang.code}
              href={lang.href}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-150 active:scale-[0.98]"
              style={{
                background: "var(--surface)",
                border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
                boxShadow: "0 2px 8px color-mix(in srgb, var(--fg) 4%, transparent)",
              }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
                style={{ background: lang.gradient }}
              >
                {lang.badge}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold">{lang.title}</span>
                  {hydrated && (
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-muted/70 bg-border/60">
                      Lv. {level}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted">{lang.description}</div>
                <div className="mt-0.5 text-xs text-muted/60">{lang.meta}</div>
              </div>
              <span className="shrink-0 text-muted"><ChevronRight /></span>
            </Link>
          );
        })}
      </div>

      {/* Desktop — 3-col card grid */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5">
        {LANGUAGES.map((lang, i) => {
          const level = hydrated ? levelFromXp(xpMap[lang.xpKey]) : 0;
          return (
            <motion.div
              key={lang.code}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col rounded-2xl overflow-hidden transition-all duration-150 hover:-translate-y-0.5"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-panel)",
              }}
            >
              {/* Header with badge + level */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-white text-xl font-bold"
                  style={{ background: lang.gradient }}
                >
                  {lang.badge}
                </div>
                {hydrated && level > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold leading-none"
                    style={{
                      background: "color-mix(in srgb, var(--accent) 14%, var(--surface))",
                      color: "var(--accent)",
                      border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)",
                    }}
                  >
                    Lv. {level}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="px-6 pb-4">
                <h2 className="text-xl font-bold tracking-tight">{lang.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{lang.description}</p>
                <p className="mt-3 text-xs text-muted/70">{lang.meta}</p>
              </div>

              {/* Actions */}
              <div className="mt-auto flex flex-col gap-2 p-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                {lang.subOptions ? (
                  lang.subOptions.map((o) => (
                    <Link
                      key={o.href}
                      href={o.href}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-[color:var(--elevated)]"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      <span>{o.icon} {o.label}</span>
                      <span className="text-muted"><ChevronRight /></span>
                    </Link>
                  ))
                ) : (
                  <Link
                    href={lang.href}
                    className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150"
                    style={{
                      background: "var(--accent)",
                      color: "var(--accent-fg)",
                    }}
                  >
                    <span>Open {lang.title}</span>
                    <span><ChevronRight /></span>
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
