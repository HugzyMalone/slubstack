"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Clipboard, ClipboardCheck, ChevronDown } from "lucide-react";
import type { ActorData } from "@/app/trivia/actors/page";
import { globalStore } from "@/lib/globalStore";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function FlameIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" />
    </svg>
  );
}

function FilmIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function TrophyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H3.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h2.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  );
}

type GameState = "lobby" | "countdown" | "playing" | "results";
type Feedback = "correct" | "wrong" | null;

interface HistoryEntry {
  name: string;
  image: string;
  correct: boolean;
}

export interface ActorBest {
  score: number;
  correct?: number;
  total: number;
  bestStreak: number;
  accuracy: number;
}

const TIME_LIMIT = 15;
const PB_KEY = "slubstack_actorblitz_best";
const ACTOR_STATS_KEY = "slubstack_actorblitz_stats";

export type ActorStatMap = Record<string, { c: number; w: number; img: string }>;

export function loadActorStats(): ActorStatMap {
  try { return JSON.parse(localStorage.getItem(ACTOR_STATS_KEY) ?? "{}").actors ?? {}; }
  catch { return {}; }
}
function saveActorStats(actors: ActorStatMap) {
  localStorage.setItem(ACTOR_STATS_KEY, JSON.stringify({ actors }));
}

interface Props {
  actors: ActorData[];
}

function preload(src: string) {
  const img = new window.Image();
  img.src = src;
}

export function ActorBlitz({ actors }: Props) {
  const [gameState, setGameState] = useState<GameState>("lobby");
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [queue, setQueue] = useState<ActorData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [countdown, setCountdown] = useState(3);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [advancing, setAdvancing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [personalBest, setPersonalBest] = useState<ActorBest | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Refs for stable values when saving PB on game end
  const scoreRef = useRef(score);
  const correctRef = useRef(correct);
  const totalRef = useRef(total);
  const bestStreakRef = useRef(bestStreak);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { correctRef.current = correct; }, [correct]);
  useEffect(() => { totalRef.current = total; }, [total]);
  useEffect(() => { bestStreakRef.current = bestStreak; }, [bestStreak]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(PB_KEY);
      if (s) setPersonalBest(JSON.parse(s));
    } catch {}
    actors.forEach((a) => preload(a.image));
  }, [actors]);

  const currentActor = queue[currentIdx] ?? null;

  const makeOptions = useCallback((actor: ActorData): string[] => {
    return shuffle([actor.name, ...actor.decoys.slice(0, 3)]);
  }, []);

  const startGame = useCallback(() => {
    const shuffled = shuffle(actors);
    setQueue(shuffled);
    setCurrentIdx(0);
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setTotal(0);
    setTimeLeft(TIME_LIMIT);
    setSelected(null);
    setFeedback(null);
    setHistory([]);
    setAdvancing(false);
    setShowHistory(false);
    setCountdown(3);
    setGameState("countdown");
  }, [actors]);

  useEffect(() => {
    if (gameState !== "countdown") return;
    if (countdown <= 0) { setGameState("playing"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  useEffect(() => {
    if (gameState !== "playing" || !currentActor) return;
    setOptions(makeOptions(currentActor));
    setSelected(null);
    setFeedback(null);
    setAdvancing(false);
    setImageLoaded(false);
    setImageError(false);
    for (let i = 1; i <= 3; i++) {
      const next = queue[(currentIdx + i) % queue.length];
      if (next) preload(next.image);
    }
  }, [gameState, currentIdx, currentActor, makeOptions, queue]);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft <= 0) {
      setGameState("results");
      // Save personal best on game end
      const s = scoreRef.current;
      const c = correctRef.current;
      const t = totalRef.current;
      const bs = bestStreakRef.current;
      const accuracy = t > 0 ? Math.round((c / t) * 100) : 0;
      const pb: ActorBest = { score: s, correct: c, total: t, bestStreak: bs, accuracy };
      try {
        const saved = localStorage.getItem(PB_KEY);
        const prev: ActorBest | null = saved ? JSON.parse(saved) : null;
        if (!prev || s > prev.score || (s === prev.score && bs > prev.bestStreak)) {
          localStorage.setItem(PB_KEY, JSON.stringify(pb));
          setPersonalBest(pb);
        }
      } catch {}
      // Update global streak and award medal
      globalStore.getState().touchStreak();
      const acc = t > 0 ? c / t : 0;
      globalStore.getState().awardMedal(acc >= 0.9 ? "gold" : acc >= 0.7 ? "silver" : "bronze");
      return;
    }
    const t = setInterval(() => setTimeLeft((tl) => tl - 1), 1000);
    return () => clearInterval(t);
  }, [gameState, timeLeft]);

  const advance = useCallback(() => {
    setAdvancing(true);
    setCurrentIdx((i) => {
      const next = i + 1;
      if (next >= queue.length) {
        setQueue((q) => shuffle(q));
        return 0;
      }
      return next;
    });
  }, [queue.length]);

  const multiplier = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;

  const handleAnswer = useCallback(
    (option: string) => {
      if (selected !== null || !currentActor || advancing) return;
      const isCorrect = option === currentActor.name;
      const currentMultiplier = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;
      setSelected(option);
      setFeedback(isCorrect ? "correct" : "wrong");
      setTotal((t) => t + 1);
      setHistory((h) => [...h, { name: currentActor.name, image: currentActor.image, correct: isCorrect }]);

      // Track per-actor stats
      try {
        const stats = loadActorStats();
        const curr = stats[currentActor.name] ?? { c: 0, w: 0, img: currentActor.image };
        stats[currentActor.name] = { c: curr.c + (isCorrect ? 1 : 0), w: curr.w + (isCorrect ? 0 : 1), img: currentActor.image };
        saveActorStats(stats);
      } catch {}
      if (isCorrect) {
        setCorrect((c) => c + 1);
        setScore((s) => s + currentMultiplier);
        setStreak((s) => { const ns = s + 1; setBestStreak((bs) => Math.max(bs, ns)); return ns; });
        setTimeout(advance, 300);
      } else {
        setStreak(0);
        setTimeout(advance, 700);
      }
    },
    [selected, currentActor, advancing, advance, streak]
  );

  const shareResult = useCallback(() => {
    const c = correctRef.current;
    const t = totalRef.current;
    const bs = bestStreakRef.current;
    const accuracy = t > 0 ? Math.round((c / t) * 100) : 0;
    const text = `Actor Blitz — ${c}/${t} correct in ${TIME_LIMIT}s!\nAccuracy: ${accuracy}% | Best streak: ${bs}\nCan you beat me? slubstack.com/trivia/actors`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (gameState === "lobby") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 pb-24 pt-10 text-center">
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)" }}
        >
          <FilmIcon size={28} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Actor Blitz</h1>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          How many movie stars can you identify? Guess as many as you can before time runs out!
        </p>

        {personalBest && (
          <div
            className="mt-5 w-full rounded-2xl px-4 py-3 text-left"
            style={{ background: "color-mix(in srgb, var(--game) 8%, var(--surface))", border: "1px solid color-mix(in srgb, var(--game) 20%, transparent)" }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <TrophyIcon size={12} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Personal best</span>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="font-bold" style={{ color: "var(--game)" }}>
                {personalBest.correct ?? personalBest.score}
                <span className="text-xs font-normal text-muted">/{personalBest.total}</span>
              </span>
              <span className="text-muted">{personalBest.accuracy}% acc</span>
              <span className="text-muted">{personalBest.bestStreak} streak</span>
            </div>
          </div>
        )}

        <div className="mt-5 w-full rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-black" style={{ color: "var(--game)" }}>{TIME_LIMIT}s</span>
            <span className="text-sm text-muted font-medium">time limit</span>
          </div>
          <div className="space-y-2 text-left text-sm text-muted">
            <div className="flex items-center gap-2.5">
              <span className="text-muted"><CameraIcon /></span>
              <span>Real photos — some might look a little different</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-muted"><ZapIcon /></span>
              <span>Pick fast — time keeps ticking</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-muted"><TrophyIcon /></span>
              <span>Share your score and challenge friends</span>
            </div>
          </div>
        </div>

        <button
          onClick={startGame}
          disabled={actors.length === 0}
          className="mt-5 w-full rounded-2xl py-4 text-base font-bold text-white transition-colors duration-150 active:scale-[0.97] disabled:opacity-50"
          style={{ background: "var(--game)" }}
        >
          {actors.length === 0 ? "Loading actors…" : "Let's Go →"}
        </button>
        <Link href="/trivia" className="mt-4 text-sm text-muted hover:text-fg">← Back to Trivia</Link>
      </div>
    );
  }

  // ── COUNTDOWN ──────────────────────────────────────────────────────────────
  if (gameState === "countdown") {
    const label = countdown > 0 ? String(countdown) : "GO!";
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg">
        <div className="text-8xl font-black transition-all duration-300" style={{ color: countdown > 0 ? "var(--fg)" : "var(--game)" }}>
          {label}
        </div>
        <div className="mt-4 text-muted text-sm">Get ready…</div>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (gameState === "results") {
    const c = correctRef.current;
    const t = totalRef.current;
    const bs = bestStreakRef.current;
    const accuracy = t > 0 ? Math.round((c / t) * 100) : 0;
    const grade =
      accuracy >= 90 ? "Incredible!" : accuracy >= 75 ? "Great job!" : accuracy >= 55 ? "Not bad!" : "Keep practising!";

    return (
      <div className="mx-auto max-w-md px-4 pb-24 pt-8">
        <div className="text-center mb-6">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)" }}
          >
            <FilmIcon size={24} />
          </div>
          <div className="text-4xl font-black" style={{ color: "var(--game)" }}>
            {c}<span className="text-xl font-semibold text-muted"> / {t}</span>
          </div>
          <div className="text-base font-semibold mt-1 text-muted">{grade}</div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Correct", value: `${c}/${t}` },
            { label: "Accuracy", value: `${accuracy}%` },
            { label: "Best streak", value: String(bs) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface p-3 text-center">
              <div className="text-lg font-bold" style={label === "Correct" ? { color: "var(--game)" } : undefined}>{value}</div>
              <div className="text-xs text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-5">
          <button
            onClick={shareResult}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-sm font-semibold transition-colors duration-100 active:scale-[0.97]"
          >
            {copied ? <ClipboardCheck size={14} className="text-emerald-500" /> : <Clipboard size={14} className="text-muted" />}
            {copied ? "Copied!" : "Copy score"}
          </button>
          <button
            onClick={startGame}
            className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition-colors duration-100 active:scale-[0.97]"
            style={{ background: "var(--game)" }}
          >
            Play again
          </button>
        </div>

        {history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory((h) => !h)}
              className="flex w-full items-center justify-between py-2 text-xs font-semibold uppercase tracking-widest text-muted mb-2"
            >
              <span>How you did ({history.length} questions)</span>
              <ChevronDown size={14} className={showHistory ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {showHistory && (
              <div className="flex flex-col gap-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.image} alt={h.name} className="h-10 w-10 shrink-0 rounded-lg object-cover object-center" />
                    <div className="min-w-0 flex-1 text-sm font-medium truncate">{h.name}</div>
                    {h.correct
                      ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                      : <XCircle size={16} className="text-rose-500 shrink-0" />
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/trivia" className="text-sm text-muted hover:text-fg">← Back to Trivia</Link>
        </div>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (!currentActor) return null;

  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  const timerColor = timeLeft <= 4 ? "#e11d48" : timeLeft <= 8 ? "#f97316" : "var(--game)";

  return (
    <div className="flex flex-col h-[calc(100dvh-56px-60px)] lg:h-[calc(100dvh-56px)] max-w-md mx-auto px-4 pt-3 pb-3 select-none">
      {/* Timer bar + stats */}
      <div className="shrink-0 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-black tabular-nums" style={{ color: timerColor }}>{timeLeft}s</span>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#f97316" }}>
                <FlameIcon size={12} />{streak}
              </span>
            )}
            {multiplier > 1 && (
              <span
                className="rounded-md px-1.5 py-0.5 text-xs font-black tabular-nums text-white"
                style={{ background: multiplier >= 3 ? "#dc2626" : "#f97316" }}
              >
                {multiplier}×
              </span>
            )}
            <span className="text-sm font-black">{score}</span>
          </div>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden bg-border">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timerPct}%`, background: timerColor }} />
        </div>
      </div>

      {/* Actor image */}
      <div
        key={currentActor.image}
        className="shrink-0 relative w-full rounded-2xl overflow-hidden bg-surface border border-border fade-in"
        style={{ height: "min(42vh, 300px)" }}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-border" />
        )}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            <FilmIcon size={40} />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentActor.image}
          alt="Who is this?"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "50% 25%", opacity: imageLoaded ? 1 : 0, transition: "opacity 0.15s ease" }}
          fetchPriority="high"
          decoding="async"
          ref={(el) => { if (el?.complete && !el.naturalWidth) setImageError(true); else if (el?.complete) setImageLoaded(true); }}
          onLoad={() => setImageLoaded(true)}
          onError={() => { setImageError(true); if (!advancing) advance(); }}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 left-3 text-white text-xs font-semibold opacity-70">Who is this actor?</div>
      </div>

      {/* Options */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 flex-1 content-start">
        {options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === currentActor.name;
          let bg = "var(--surface)", borderColor = "var(--border)", textColor = "var(--fg)";
          if (feedback !== null) {
            if (isSelected && feedback === "correct") { bg = "#059669"; borderColor = "#059669"; textColor = "#fff"; }
            else if (isSelected && feedback === "wrong") { bg = "#e11d48"; borderColor = "#e11d48"; textColor = "#fff"; }
            else if (!isSelected && isCorrect && feedback === "wrong") { borderColor = "#059669"; textColor = "#059669"; }
          }
          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={selected !== null}
              className="rounded-xl border px-3 py-3.5 text-sm font-semibold transition-colors duration-100 active:scale-[0.97] disabled:cursor-default leading-tight"
              style={{ background: bg, borderColor, color: textColor }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
