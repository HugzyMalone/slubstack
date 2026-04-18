"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isDue } from "@/lib/srs";
import { loadMathOpStats, type MathOpStats } from "@/app/brain-training/math-blitz/page";
import { loadActorStats, type ActorStatMap } from "@/components/trivia/ActorBlitz";

// ── helpers ────────────────────────────────────────────────────────────────

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

function accuracy(c: number, w: number): number | null {
  const total = c + w;
  return total === 0 ? null : Math.round((c / total) * 100);
}

// ── config ─────────────────────────────────────────────────────────────────

type Filter = "worst" | "best";

const LANG_CONFIGS = [
  { key: "slubstack-v1",         label: "Mandarin", flag: "🇨🇳", href: "/mandarin/review", color: "#e11d48" },
  { key: "slubstack-german-v1",  label: "German",   flag: "🇩🇪", href: "/german/review",   color: "#f97316" },
  { key: "slubstack-spanish-v1", label: "Spanish",  flag: "🇪🇸", href: "/spanish/review",  color: "#10b981" },
] as const;

const OP_LABELS: Record<string, string> = {
  "+": "Addition",
  "−": "Subtraction",
  "×": "Multiplication",
  "÷": "Division",
};

// ── shared components ──────────────────────────────────────────────────────

function AccuracyBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function FilterPills({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  return (
    <div className="flex gap-1">
      {(["worst", "best"] as Filter[]).map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150"
          style={value === f
            ? { background: "var(--accent)", color: "var(--accent-fg)" }
            : { background: "color-mix(in srgb, var(--fg) 8%, transparent)", color: "var(--muted)" }}
        >
          {f === "worst" ? "Worst first" : "Best first"}
        </button>
      ))}
    </div>
  );
}

// ── Math Blitz section ─────────────────────────────────────────────────────

function MathBlitzSection({ stats }: { stats: MathOpStats }) {
  const [filter, setFilter] = useState<Filter>("worst");

  const ops = Object.entries(OP_LABELS)
    .map(([op, label]) => {
      const s = stats[op] ?? { c: 0, w: 0 };
      return { op, label, c: s.c, w: s.w, acc: accuracy(s.c, s.w) };
    })
    .filter((o) => o.c + o.w > 0);

  const sorted = [...ops].sort((a, b) => {
    const aa = a.acc ?? 50;
    const ba = b.acc ?? 50;
    return filter === "worst" ? aa - ba : ba - aa;
  });

  if (ops.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-5 py-6 text-center">
        <p className="text-sm text-muted">Play Math Blitz to see your operation breakdown.</p>
        <Link href="/brain-training/math-blitz"
          className="mt-3 inline-block rounded-xl px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--accent)" }}>
          Play now →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">Operations</span>
        <FilterPills value={filter} onChange={setFilter} />
      </div>
      <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
        {sorted.map(({ op, label, c, w, acc }) => {
          const color = acc === null ? "var(--muted)" : acc >= 70 ? "#10b981" : acc >= 40 ? "#f59e0b" : "#e11d48";
          return (
            <div key={op} className="px-4 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 text-center text-lg font-black" style={{ color }}>{op}</span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs tabular-nums">
                  <span className="text-emerald-500 font-semibold">{c}✓</span>
                  <span className="text-rose-500 font-semibold">{w}✗</span>
                  <span className="font-bold w-8 text-right" style={{ color }}>{acc ?? "—"}%</span>
                </div>
              </div>
              {acc !== null && <AccuracyBar pct={acc} color={color} />}
            </div>
          );
        })}
      </div>
      <Link href="/brain-training/math-blitz"
        className="flex items-center justify-center rounded-2xl border border-border py-3 text-sm font-medium transition-colors hover:bg-border/30">
        Play Math Blitz →
      </Link>
    </div>
  );
}

// ── Actor Blitz section ────────────────────────────────────────────────────

function ActorBlitzSection({ stats }: { stats: ActorStatMap }) {
  const [filter, setFilter] = useState<Filter>("worst");

  const actors = Object.entries(stats)
    .map(([name, s]) => ({ name, c: s.c, w: s.w, img: s.img, acc: accuracy(s.c, s.w) }))
    .filter((a) => a.c + a.w > 0);

  const sorted = [...actors].sort((a, b) => {
    const aa = a.acc ?? 50;
    const ba = b.acc ?? 50;
    return filter === "worst" ? aa - ba : ba - aa;
  });

  if (actors.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-5 py-6 text-center">
        <p className="text-sm text-muted">Play Actor Blitz to build your actor recognition stats.</p>
        <Link href="/trivia/actors"
          className="mt-3 inline-block rounded-xl px-4 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--game)" }}>
          Play now →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">Actors</span>
        <FilterPills value={filter} onChange={setFilter} />
      </div>
      <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
        {sorted.map(({ name, c, w, img, acc }) => {
          const color = acc === null ? "var(--muted)" : acc >= 70 ? "#10b981" : acc >= 40 ? "#f59e0b" : "#e11d48";
          return (
            <div key={name} className="flex items-center gap-3 px-4 py-3">
              <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={name} className="h-full w-full object-cover object-top"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{name}</div>
                <div className="mt-1.5">
                  <AccuracyBar pct={acc ?? 0} color={color} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-xs tabular-nums shrink-0">
                <span className="font-bold" style={{ color }}>{acc ?? "—"}%</span>
                <span className="text-muted">{c + w} seen</span>
              </div>
            </div>
          );
        })}
      </div>
      <Link href="/trivia/actors"
        className="flex items-center justify-center rounded-2xl border border-border py-3 text-sm font-medium transition-colors hover:bg-border/30">
        Play Actor Blitz →
      </Link>
    </div>
  );
}

// ── Hub page ───────────────────────────────────────────────────────────────

export default function ReviewHubPage() {
  const [langStats, setLangStats] = useState<LangStats[]>([
    { due: 0, seen: 0 }, { due: 0, seen: 0 }, { due: 0, seen: 0 },
  ]);
  const [mathStats, setMathStats] = useState<MathOpStats>({});
  const [actorStats, setActorStats] = useState<ActorStatMap>({});

  useEffect(() => {
    setLangStats(LANG_CONFIGS.map((cfg) => readLangStats(cfg.key)));
    setMathStats(loadMathOpStats());
    setActorStats(loadActorStats());
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review</h1>
        <p className="mt-1 text-sm text-muted">Practice what you know and focus on your weak spots.</p>
      </div>

      {/* Languages */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Languages</h2>
        <div className="space-y-2">
          {LANG_CONFIGS.map((cfg, i) => {
            const { due, seen } = langStats[i];
            return (
              <Link
                key={cfg.label}
                href={cfg.href}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-all hover:border-[var(--accent)]/30 hover:shadow-sm active:scale-[0.99]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: `color-mix(in srgb, ${cfg.color} 12%, var(--bg))` }}
                >
                  {cfg.flag}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{cfg.label}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {seen === 0 ? "No words learned yet" : `${seen} word${seen === 1 ? "" : "s"} learned`}
                  </div>
                </div>
                {due > 0 ? (
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: cfg.color }}>
                    {due} due
                  </span>
                ) : (
                  <span className="text-xs text-muted">{seen === 0 ? "Start learning" : "All caught up ✓"}</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Math Blitz */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Math Blitz</h2>
        <MathBlitzSection stats={mathStats} />
      </section>

      {/* Actor Blitz */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Actor Blitz</h2>
        <ActorBlitzSection stats={actorStats} />
      </section>
    </div>
  );
}
