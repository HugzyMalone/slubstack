"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Panda } from "@/components/Panda";
import { Bear } from "@/components/Bear";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

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

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const SECTIONS = [
  {
    href: "/languages",
    icon: <GlobeIcon />,
    iconBg: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    title: "Languages",
    subtitle: "Spanish · Mandarin · German",
    detail: "3 languages",
    badge: null as string | null,
  },
  {
    href: "/brain-training",
    icon: <BrainIcon />,
    iconBg: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    title: "Brain Training",
    subtitle: "Math Blitz & memory games",
    detail: "Math · Memory · Speed",
    badge: "New" as string | null,
  },
  {
    href: "/trivia",
    icon: <FilmIcon />,
    iconBg: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)",
    title: "Trivia",
    subtitle: "Actor Blitz & more",
    detail: "Race the clock",
    badge: null as string | null,
  },
];

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
    <Link href="/stats" className="block active:scale-[0.985] transition-transform duration-150">
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

type HeroOption = { char: "panda" | "bear"; mood: "idle" | "happy" | "celebrating" | "sad" | "wrong" };
const HERO_OPTIONS: HeroOption[] = [
  { char: "panda", mood: "happy" },
  { char: "panda", mood: "celebrating" },
  { char: "panda", mood: "idle" },
  { char: "bear",  mood: "happy" },
  { char: "bear",  mood: "celebrating" },
  { char: "bear",  mood: "wrong" },
  { char: "bear",  mood: "sad" },
  { char: "bear",  mood: "idle" },
];

const HERO_SESSION_KEY = "slubstack_home_hero";

export default function HubPage() {
  const [hero, setHero] = useState<HeroOption>(HERO_OPTIONS[0]);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(HERO_SESSION_KEY);
      if (saved) { setHero(JSON.parse(saved)); return; }
    } catch {}
    const picked = HERO_OPTIONS[Math.floor(Math.random() * HERO_OPTIONS.length)];
    try { sessionStorage.setItem(HERO_SESSION_KEY, JSON.stringify(picked)); } catch {}
    setHero(picked);
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 pb-24">
      <div className="flex flex-col items-center pt-0 pb-0">
        <div className="relative w-full" style={{ height: "32vh", maxHeight: 280 }}>
          {hero.char === "bear"
            ? <Bear mood={hero.mood} fill />
            : <Panda mood={hero.mood} fill />}
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">What are you learning?</h1>
        <p className="mt-0.5 text-sm text-muted">Pick a section to get started.</p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {SECTIONS.map(({ href, icon, iconBg, title, subtitle, badge }) => (
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: iconBg }}
            >
              {icon}
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
              <div className="mt-0.5 text-sm text-muted">{subtitle}</div>
            </div>
            <span className="shrink-0 text-muted"><ChevronRight /></span>
          </Link>
        ))}

        <JoinCTA />
      </div>
    </div>
  );
}
