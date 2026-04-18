"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Panda } from "@/components/Panda";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const LANGUAGES = [
  {
    href: "/spanish",
    code: "ES",
    title: "Spanish",
    subtitle: "Match, quiz & type",
    accent: "#c2410c",
    badge: "New",
  },
  {
    href: "/mandarin",
    code: "中",
    title: "Mandarin",
    subtitle: "Characters & phrases",
    accent: "#e11d48",
    badge: null,
  },
  {
    href: "/german",
    code: "DE",
    title: "German",
    subtitle: "Start with Hallo",
    accent: "#f97316",
    badge: null,
  },
];

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function JoinCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setShow(!data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setShow(!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!show) return null;

  return (
    <Link href="/stats" className="block mt-2 active:scale-[0.985] transition-transform duration-150">
      <div
        className="flex items-center gap-4 rounded-2xl px-5 py-4"
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), color-mix(in srgb, var(--accent) 4%, var(--surface)))",
          border: "1px solid color-mix(in srgb, var(--accent) 25%, var(--border))",
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-black text-white"
          style={{ background: "linear-gradient(135deg, var(--accent) 0%, #ea580c 100%)" }}
        >
          S
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">Track your progress</div>
          <div className="mt-0.5 text-xs text-muted">Save XP, streak &amp; compete on the leaderboard — free</div>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          Join free
        </span>
      </div>
    </Link>
  );
}

export default function HubPage() {
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div className="mx-auto max-w-xl px-4 pb-24">
      <div className="flex flex-col items-center pt-0 pb-0">
        <div className="relative w-full" style={{ height: "32vh", maxHeight: 280 }}>
          <Panda mood="happy" fill />
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">What are you learning?</h1>
        <p className="mt-0.5 text-sm text-muted">Pick a section to get started.</p>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {/* Languages accordion */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
            background: "var(--surface)",
          }}
        >
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex w-full items-center gap-4 px-5 py-4 transition-colors duration-150 active:bg-[color-mix(in_srgb,var(--fg)_4%,transparent)]"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
            >
              <GlobeIcon />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[15px] font-semibold">Languages</div>
              <div className="mt-0.5 text-xs text-muted">Spanish · Mandarin · German</div>
            </div>
            <motion.div
              animate={{ rotate: langOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="shrink-0 text-muted"
            >
              <ChevronDown size={16} />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {langOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ borderTop: "1px solid color-mix(in srgb, var(--fg) 6%, transparent)" }}>
                  {LANGUAGES.map(({ href, code, title, subtitle, accent, badge }, i) => (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-4 px-5 py-3.5 active:bg-[color-mix(in_srgb,var(--fg)_4%,transparent)] transition-colors duration-100",
                      )}
                      style={
                        i > 0
                          ? { borderTop: "1px solid color-mix(in srgb, var(--fg) 6%, transparent)" }
                          : undefined
                      }
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white tracking-wide"
                        style={{ background: accent }}
                      >
                        {code}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{title}</span>
                          {badge && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                              style={{ background: accent }}
                            >
                              {badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted mt-0.5">{subtitle}</div>
                      </div>
                      <span className="text-muted shrink-0">
                        <ChevronRight />
                      </span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brain Training */}
        <Link href="/brain-training" className="block active:scale-[0.985] transition-transform duration-150">
          <div
            className="flex items-center gap-4 rounded-2xl px-5 py-4"
            style={{
              background: "var(--surface)",
              border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)" }}
            >
              <BrainIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">Brain Training</div>
              <div className="mt-0.5 text-xs text-muted">Memory, logic &amp; focus games</div>
            </div>
            <span className="text-muted shrink-0">
              <ChevronRight />
            </span>
          </div>
        </Link>

        {/* Trivia */}
        <Link href="/trivia" className="block active:scale-[0.985] transition-transform duration-150">
          <div
            className="flex items-center gap-4 rounded-2xl px-5 py-4"
            style={{
              background: "var(--surface)",
              border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)" }}
            >
              <FilmIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">Trivia</div>
              <div className="mt-0.5 text-xs text-muted">Guess the actor — race the clock</div>
            </div>
            <span className="text-muted shrink-0">
              <ChevronRight />
            </span>
          </div>
        </Link>

        <JoinCTA />
      </div>
    </div>
  );
}
