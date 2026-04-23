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

export default function LanguagesPage() {
  const hydrated = useHydrated();
  const spanishXp = useStore(spanishStore, (s) => s.xp);
  const mandarinXp = useStore(mandarinStore, (s) => s.xp);
  const germanXp = useStore(germanStore, (s) => s.xp);
  const [mandarinOpen, setMandarinOpen] = useState(false);

  const cardStyle = {
    background: "var(--surface)",
    border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
    boxShadow: "0 2px 8px color-mix(in srgb, var(--fg) 4%, transparent)",
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Languages</h1>
        <p className="mt-1 text-sm text-muted">Pick a language and start learning.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/spanish"
          className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-150 active:scale-[0.98]"
          style={cardStyle}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)" }}
          >
            ES
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold">Spanish</span>
              {hydrated && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-muted/70 bg-border/60">
                  Lv. {levelFromXp(spanishXp)}
                </span>
              )}
            </div>
            <div className="text-sm text-muted">Match, quiz & type</div>
            <div className="mt-0.5 text-xs text-muted/60">5 units · 75 words</div>
          </div>
          <span className="shrink-0 text-muted"><ChevronRight /></span>
        </Link>

        <div className="rounded-2xl" style={cardStyle}>
          <button
            type="button"
            onClick={() => setMandarinOpen((o) => !o)}
            className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-150 active:scale-[0.98]"
            aria-expanded={mandarinOpen}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #be123c 0%, #e11d48 100%)" }}
            >
              中
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold">Mandarin</span>
                {hydrated && (
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-muted/70 bg-border/60">
                    Lv. {levelFromXp(mandarinXp)}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted">Characters, pinyin & phrases</div>
              <div className="mt-0.5 text-xs text-muted/60">12 units · 249 cards</div>
            </div>
            <motion.span
              className="shrink-0 text-muted"
              animate={{ rotate: mandarinOpen ? 0 : -90 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ChevronDown />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {mandarinOpen && (
              <motion.div
                key="mandarin-options"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 px-3 pb-3">
                  <Link
                    href="/mandarin"
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-[14px] font-medium transition-transform duration-150 active:scale-[0.98]"
                    style={{ background: "color-mix(in srgb, var(--accent) 10%, var(--surface))", border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)" }}
                  >
                    <span>📚 Curriculum</span>
                    <span className="text-muted"><ChevronRight /></span>
                  </Link>
                  <Link
                    href="/mandarin/vocab"
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-[14px] font-medium transition-transform duration-150 active:scale-[0.98]"
                    style={{ background: "color-mix(in srgb, var(--accent) 10%, var(--surface))", border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)" }}
                  >
                    <span>📖 Vocab reference</span>
                    <span className="text-muted"><ChevronRight /></span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link
          href="/german"
          className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-150 active:scale-[0.98]"
          style={cardStyle}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #c2410c 0%, #f97316 100%)" }}
          >
            DE
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold">German</span>
              {hydrated && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-muted/70 bg-border/60">
                  Lv. {levelFromXp(germanXp)}
                </span>
              )}
            </div>
            <div className="text-sm text-muted">Start with Hallo</div>
            <div className="mt-0.5 text-xs text-muted/60">2 units · 35 words</div>
          </div>
          <span className="shrink-0 text-muted"><ChevronRight /></span>
        </Link>
      </div>
    </div>
  );
}
