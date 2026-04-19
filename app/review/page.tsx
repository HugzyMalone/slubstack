"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { isDue } from "@/lib/srs";
import { loadMathOpStats, type MathOpStats } from "@/app/brain-training/math-blitz/page";
import { loadActorStats, type ActorStatMap } from "@/components/trivia/ActorBlitz";
import { getTodayStr } from "@/lib/wordle-words";

// ── helpers ────────────────────────────────────────────────────────────────────

type LangStats = { due: number; seen: number };

function readLangStats(storeKey: string): LangStats {
  try {
    const raw = localStorage.getItem(storeKey);
    if (!raw) return { due: 0, seen: 0 };
    const parsed = JSON.parse(raw);
    const state = parsed.state ?? parsed;
    const srs: Record<string, unknown> = state.srs ?? {};
    const seenCardIds: string[] = state.seenCardIds ?? [];
    const now = Date.now();
    const due = Object.values(srs).filter((s) => isDue(s as Parameters<typeof isDue>[0], now)).length;
    return { due, seen: seenCardIds.length };
  } catch { return { due: 0, seen: 0 }; }
}

type WordlePhase = "won" | "lost" | "playing" | "none";

function readWordleState(): { phase: WordlePhase; attempts: number } {
  try {
    const raw = localStorage.getItem("slubstack_wordle");
    if (!raw) return { phase: "none", attempts: 0 };
    const parsed = JSON.parse(raw) as { date: string; guesses: string[]; phase: string };
    if (parsed.date !== getTodayStr()) return { phase: "none", attempts: 0 };
    return { phase: parsed.phase as WordlePhase, attempts: parsed.guesses.length };
  } catch { return { phase: "none", attempts: 0 }; }
}

function mathTotals(stats: MathOpStats): { c: number; w: number } {
  return Object.values(stats).reduce((acc, s) => ({ c: acc.c + s.c, w: acc.w + s.w }), { c: 0, w: 0 });
}

function actorTotals(stats: ActorStatMap): { total: number; c: number; w: number } {
  const entries = Object.values(stats);
  return {
    total: entries.filter((s) => s.c + s.w > 0).length,
    c: entries.reduce((a, s) => a + s.c, 0),
    w: entries.reduce((a, s) => a + s.w, 0),
  };
}

function accPct(c: number, w: number): number | null {
  const t = c + w;
  return t === 0 ? null : Math.round((c / t) * 100);
}

// ── config ─────────────────────────────────────────────────────────────────────

const LANG_CONFIGS = [
  { key: "slubstack-v1",         label: "Mandarin", flag: "🇨🇳", href: "/mandarin/review", color: "#e11d48", itemLabel: "words" },
  { key: "slubstack-german-v1",  label: "German",   flag: "🇩🇪", href: "/german/review",   color: "#f97316", itemLabel: "words" },
  { key: "slubstack-spanish-v1", label: "Spanish",  flag: "🇪🇸", href: "/spanish/review",  color: "#10b981", itemLabel: "words" },
] as const;

const SKILL_CONFIGS = [
  { key: "slubstack-vibe-v1", label: "Vibe Coding", flag: "🪄", href: "/vibe-coding/review", color: "#f59e0b", itemLabel: "cards" },
] as const;

// ── icons ──────────────────────────────────────────────────────────────────────

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ── accordion ──────────────────────────────────────────────────────────────────

const EASE = [0.04, 0.62, 0.23, 0.98] as const;

interface AccordionSectionProps {
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function AccordionSection({ open, onToggle, icon, iconBg, title, subtitle, children }: AccordionSectionProps) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-surface"
      style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--fg) 4%, transparent)" }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-150 active:bg-[color-mix(in_srgb,var(--fg)_5%,transparent)]"
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">{title}</div>
          <div className="mt-0.5 text-sm text-muted">{subtitle}</div>
        </div>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="shrink-0 text-muted"
        >
          <ChevronRight />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-border divide-y divide-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── row components ─────────────────────────────────────────────────────────────

function LangRow({ cfg, stats }: { cfg: { href: string; color: string; flag: string; label: string; itemLabel: string }; stats: LangStats }) {
  const { due, seen } = stats;
  const lbl = cfg.itemLabel;
  return (
    <Link
      href={cfg.href}
      className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 active:bg-[color-mix(in_srgb,var(--fg)_5%,transparent)]"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ background: `color-mix(in srgb, ${cfg.color} 12%, var(--bg))` }}
      >
        {cfg.flag}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{cfg.label}</div>
        <div className="text-xs text-muted mt-0.5">
          {seen === 0 ? `No ${lbl} learned yet` : `${seen} ${lbl}${seen === 1 ? "" : "s"} learned`}
        </div>
      </div>
      {due > 0 ? (
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white shrink-0" style={{ background: cfg.color }}>
          {due} due
        </span>
      ) : (
        <span className="text-xs text-muted shrink-0">{seen === 0 ? "Start →" : "All caught up ✓"}</span>
      )}
    </Link>
  );
}

function GameRow({ href, emoji, title, meta, accentColor }: { href: string; emoji: string; title: string; meta: string; accentColor: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 active:bg-[color-mix(in_srgb,var(--fg)_5%,transparent)]"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ background: `color-mix(in srgb, ${accentColor} 15%, var(--bg))` }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted mt-0.5">{meta}</div>
      </div>
      <span className="shrink-0 text-muted"><ChevronRight /></span>
    </Link>
  );
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function ReviewHubPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [langStats, setLangStats] = useState<LangStats[]>([
    { due: 0, seen: 0 }, { due: 0, seen: 0 }, { due: 0, seen: 0 },
  ]);
  const [skillStats, setSkillStats] = useState<LangStats[]>([{ due: 0, seen: 0 }]);
  const [mathStats, setMathStats] = useState<MathOpStats>({});
  const [actorStats, setActorStats] = useState<ActorStatMap>({});
  const [wordleState, setWordleState] = useState<{ phase: WordlePhase; attempts: number }>({ phase: "none", attempts: 0 });

  useEffect(() => {
    setLangStats(LANG_CONFIGS.map((cfg) => readLangStats(cfg.key)));
    setSkillStats(SKILL_CONFIGS.map((cfg) => readLangStats(cfg.key)));
    setMathStats(loadMathOpStats());
    setActorStats(loadActorStats());
    setWordleState(readWordleState());
  }, []);

  function toggle(id: string) {
    setOpenSection((prev) => (prev === id ? null : id));
  }

  const skillDue = skillStats.reduce((a, s) => a + s.due, 0);
  const math = mathTotals(mathStats);
  const mathAcc = accPct(math.c, math.w);
  const actor = actorTotals(actorStats);
  const actorAcc = accPct(actor.c, actor.w);

  const wordleMeta =
    wordleState.phase === "won"
      ? `Solved in ${wordleState.attempts} ${wordleState.attempts === 1 ? "try" : "tries"} ✓`
      : wordleState.phase === "lost"
      ? "Today's word revealed"
      : wordleState.phase === "playing"
      ? `${wordleState.attempts}/6 guesses — keep going`
      : "Play today's word";

  const mathMeta = mathAcc === null ? "Play to track accuracy" : `${math.c + math.w} answered · ${mathAcc}% accuracy`;
  const actorMeta = actor.total === 0 ? "Play to track accuracy" : `${actor.total} actor${actor.total === 1 ? "" : "s"} · ${actorAcc ?? "—"}% accuracy`;
  const langDue = langStats.reduce((a, s) => a + s.due, 0);
  const langSubtitle = langDue > 0 ? `${langDue} card${langDue === 1 ? "" : "s"} due` : "Mandarin · German · Spanish";
  const skillSubtitle = skillDue > 0 ? `${skillDue} card${skillDue === 1 ? "" : "s"} due` : "Vibe Coding";

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4 space-y-3">
      <div className="pb-1">
        <h1 className="text-2xl font-bold tracking-tight">Review</h1>
        <p className="mt-1 text-sm text-muted">Practice what you know and focus on weak spots.</p>
      </div>

      <AccordionSection
        open={openSection === "languages"}
        onToggle={() => toggle("languages")}
        icon={<GlobeIcon />}
        iconBg="linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
        title="Languages"
        subtitle={langSubtitle}
      >
        {LANG_CONFIGS.map((cfg, i) => (
          <LangRow key={cfg.label} cfg={cfg} stats={langStats[i]} />
        ))}
      </AccordionSection>

      <AccordionSection
        open={openSection === "skills"}
        onToggle={() => toggle("skills")}
        icon={<CodeIcon />}
        iconBg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        title="Skills"
        subtitle={skillSubtitle}
      >
        {SKILL_CONFIGS.map((cfg, i) => (
          <LangRow key={cfg.label} cfg={cfg} stats={skillStats[i]} />
        ))}
      </AccordionSection>

      <AccordionSection
        open={openSection === "brain-training"}
        onToggle={() => toggle("brain-training")}
        icon={<BrainIcon />}
        iconBg="linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)"
        title="Brain Training"
        subtitle="Math Blitz · Wordle"
      >
        <GameRow href="/brain-training/math-blitz" emoji="🧮" title="Math Blitz" meta={mathMeta} accentColor="#6366f1" />
        <GameRow href="/brain-training/wordle" emoji="📝" title="Wordle" meta={wordleMeta} accentColor="#6aaa64" />
      </AccordionSection>

      <AccordionSection
        open={openSection === "trivia"}
        onToggle={() => toggle("trivia")}
        icon={<FilmIcon />}
        iconBg="linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)"
        title="Trivia"
        subtitle="Actor Blitz"
      >
        <GameRow href="/trivia/actors" emoji="🎬" title="Actor Blitz" meta={actorMeta} accentColor="#a21caf" />
      </AccordionSection>
    </div>
  );
}
