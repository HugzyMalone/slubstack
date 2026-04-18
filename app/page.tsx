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

type AccordionItem = {
  href?: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: string | null;
  soon?: boolean;
};

function AccordionSection({
  icon, iconBg, title, subtitle, items, open, onToggle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  items: AccordionItem[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
        background: "var(--surface)",
      }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 transition-colors duration-150 active:bg-[color-mix(in_srgb,var(--fg)_4%,transparent)]"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-[15px] font-semibold">{title}</div>
          <div className="mt-0.5 text-xs text-muted">{subtitle}</div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="shrink-0 text-muted"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: "1px solid color-mix(in srgb, var(--fg) 6%, transparent)" }}>
              {items.map(({ href, icon: itemIcon, iconBg: itemBg, title: itemTitle, subtitle: itemSubtitle, badge, soon }, i) => {
                const inner = (
                  <div
                    className={cn(
                      "flex items-center gap-4 px-5 py-3.5 transition-colors duration-100",
                      !soon && "active:bg-[color-mix(in_srgb,var(--fg)_4%,transparent)]",
                      soon && "opacity-50",
                    )}
                    style={i > 0 ? { borderTop: "1px solid color-mix(in srgb, var(--fg) 6%, transparent)" } : undefined}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: itemBg }}
                    >
                      {itemIcon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{itemTitle}</span>
                        {badge && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                            style={{ background: itemBg }}
                          >
                            {badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted mt-0.5">{itemSubtitle}</div>
                    </div>
                    {soon ? (
                      <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted">Soon</span>
                    ) : (
                      <span className="text-muted shrink-0"><ChevronRight /></span>
                    )}
                  </div>
                );
                return href && !soon
                  ? <Link key={itemTitle} href={href}>{inner}</Link>
                  : <div key={itemTitle}>{inner}</div>;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function PuzzleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.47 1.232 0 1.702l-1.879 1.879a.5.5 0 01-.86-.349V11.5a2 2 0 00-2-2h-1.13a.5.5 0 01-.349-.86l1.879-1.879a1.2 1.2 0 000-1.702L15.39 3.49a1.2 1.2 0 00-1.702 0L11.81 5.368a.5.5 0 01-.86-.35V3.5a2 2 0 00-2-2H4.5a2 2 0 00-2 2v4.45a2 2 0 002 2h1.518a.5.5 0 01.35.86L4.49 12.688a1.2 1.2 0 000 1.702l1.567 1.568c.23.23.556.338.878.289" />
    </svg>
  );
}

function SpeedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const TRIVIA_ITEMS: AccordionItem[] = [
  {
    href: "/trivia/actors",
    icon: <FilmIcon />,
    iconBg: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)",
    title: "Actor Blitz",
    subtitle: "Guess the movie star from their photo",
    badge: null,
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H3.5a2.5 2.5 0 010-5H6" /><path d="M18 9h2.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0012 0V2z" />
      </svg>
    ),
    iconBg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
    title: "Sports Stars",
    subtitle: "Identify legendary athletes",
    soon: true,
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
    ),
    iconBg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
    title: "Music Icons",
    subtitle: "Name that musician",
    soon: true,
  },
];

const BRAIN_ITEMS: AccordionItem[] = [
  {
    icon: <MemoryIcon />,
    iconBg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
    title: "Memory Match",
    subtitle: "Flip cards and find the pairs",
    soon: true,
  },
  {
    icon: <PuzzleIcon />,
    iconBg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    title: "Word Puzzles",
    subtitle: "Unscramble, fill-in-the-blank & more",
    soon: true,
  },
  {
    icon: <SpeedIcon />,
    iconBg: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
    title: "Speed Recall",
    subtitle: "How fast can you remember?",
    soon: true,
  },
];

export default function HubPage() {
  const [langOpen, setLangOpen] = useState(false);
  const [brainOpen, setBrainOpen] = useState(false);
  const [triviaOpen, setTriviaOpen] = useState(false);

  const langItems: AccordionItem[] = LANGUAGES.map(({ href, code, title, subtitle, accent, badge }) => ({
    href,
    icon: <span className="text-[11px] font-bold tracking-wide">{code}</span>,
    iconBg: accent,
    title,
    subtitle,
    badge,
  }));

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
        <AccordionSection
          icon={<GlobeIcon />}
          iconBg="linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
          title="Languages"
          subtitle="Spanish · Mandarin · German"
          items={langItems}
          open={langOpen}
          onToggle={() => setLangOpen((o) => !o)}
        />

        <AccordionSection
          icon={<BrainIcon />}
          iconBg="linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)"
          title="Brain Training"
          subtitle="Memory, logic & focus games"
          items={BRAIN_ITEMS}
          open={brainOpen}
          onToggle={() => setBrainOpen((o) => !o)}
        />

        <AccordionSection
          icon={<FilmIcon />}
          iconBg="linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)"
          title="Trivia"
          subtitle="Guess the actor — race the clock"
          items={TRIVIA_ITEMS}
          open={triviaOpen}
          onToggle={() => setTriviaOpen((o) => !o)}
        />

        <JoinCTA />
      </div>
    </div>
  );
}
