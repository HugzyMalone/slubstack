"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trophy, RotateCcw } from "lucide-react";
import { globalStore } from "@/lib/globalStore";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { brainTrainingStore } from "@/lib/store";
import { playCorrect, playWrong } from "@/lib/sound";

type Difficulty = "easy" | "medium" | "hard";
type Phase = "select" | "countdown" | "playing" | "result";

interface Question { display: string; answer: number; }
interface GameResult {
  score: number; correct: number; wrong: number;
  bestStreak: number; isNewBest: boolean; reason: "time" | "lives";
  difficulty: Difficulty;
}
interface LBEntry { username: string; avatar: string | null; score: number; correct: number; }

function MiniAvatar({ avatar, username }: { avatar: string | null; username: string }) {
  if (avatar && (avatar.startsWith("http") || avatar.startsWith("/"))) {
    return (
      <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden bg-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={username} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs"
      style={{ background: "color-mix(in srgb, var(--game) 20%, var(--surface))" }}>
      {avatar || username[0]?.toUpperCase() || "?"}
    </div>
  );
}

const GAME_SECS = 30;
const MAX_LIVES = 3;
const BEST_KEY = "slubstack_mathblitz_best";
const STATS_KEY = "slubstack_mathblitz_stats";

export type MathOpStats = Record<string, { c: number; w: number }>;

export function loadMathOpStats(): MathOpStats {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}").ops ?? {}; }
  catch { return {}; }
}
function saveMathOpStats(ops: MathOpStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify({ ops }));
}

const DIFF_CONFIG = {
  easy:   { label: "Easy",   color: "#10b981", ops: ["+", "−"],           maxA: 10, maxB: 10, desc: "Add & subtract · numbers to 10" },
  medium: { label: "Medium", color: "#f59e0b", ops: ["+", "−", "×", "÷"], maxA: 20, maxB: 10, desc: "All operations · numbers to 20" },
  hard:   { label: "Hard",   color: "#e11d48", ops: ["+", "−", "×", "÷"], maxA: 50, maxB: 12, desc: "All operations · numbers to 50" },
} satisfies Record<Difficulty, { label: string; color: string; ops: string[]; maxA: number; maxB: number; desc: string }>;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion(d: Difficulty): Question {
  const { ops, maxA, maxB } = DIFF_CONFIG[d];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, ans: number;

  switch (op) {
    case "+":
      a = randInt(1, maxA); b = randInt(1, maxB); ans = a + b; break;
    case "−":
      a = randInt(1, maxA); b = randInt(1, a); ans = a - b; break;
    case "×":
      a = randInt(2, Math.min(maxA, 12)); b = randInt(2, maxB); ans = a * b; break;
    default: { // ÷
      b = randInt(2, maxB);
      ans = randInt(1, Math.min(maxB, 12));
      a = b * ans;
      break;
    }
  }
  return { display: `${a} ${op} ${b}`, answer: ans };
}

function getMultiplier(streak: number): string | null {
  if (streak >= 10) return "×3";
  if (streak >= 5)  return "×2";
  if (streak >= 3)  return "×1.5";
  return null;
}

function calcPoints(elapsedMs: number, streak: number): number {
  const speed = elapsedMs < 3000 ? 5 : elapsedMs < 5000 ? 3 : 0;
  const mult = streak >= 10 ? 3 : streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
  return Math.round((10 + speed) * mult);
}

function loadBests(): Record<Difficulty, number> {
  try { return { easy: 0, medium: 0, hard: 0, ...JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}") }; }
  catch { return { easy: 0, medium: 0, hard: 0 }; }
}

function saveBest(d: Difficulty, score: number): boolean {
  const bests = loadBests();
  if (score > bests[d]) {
    localStorage.setItem(BEST_KEY, JSON.stringify({ ...bests, [d]: score }));
    return true;
  }
  return false;
}

// ── Timer ring ────────────────────────────────────────────────────────────────

function TimerRing({ secs, total }: { secs: number; total: number }) {
  const R = 44;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - secs / total);
  const color = secs <= 5 ? "#e11d48" : secs <= 10 ? "#f59e0b" : "var(--accent)";
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="select-none">
      <circle cx="55" cy="55" r={R} fill="none" stroke="var(--border)" strokeWidth="7" />
      <circle
        cx="55" cy="55" r={R} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={C} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transform: "rotate(-90deg)", transformOrigin: "55px 55px",
          transition: "stroke-dashoffset 0.95s linear, stroke 0.4s",
        }}
      />
      <text x="55" y="60" textAnchor="middle"
        style={{ fontSize: 24, fontWeight: 700, fill: color, fontVariantNumeric: "tabular-nums", transition: "fill 0.4s" }}>
        {secs}
      </text>
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MathBlitzPage() {
  const [phase, setPhase]       = useState<Phase>("select");
  const [difficulty, setDiff]   = useState<Difficulty>("medium");
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer]     = useState("");
  const [secsLeft, setSecsLeft] = useState(GAME_SECS);
  const [countNum, setCountNum] = useState(3);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [result, setResult]     = useState<GameResult | null>(null);
  const [bests, setBests]       = useState<Record<Difficulty, number>>({ easy: 0, medium: 0, hard: 0 });
  const [leaderboard, setLeaderboard] = useState<LBEntry[] | null>(null);
  const [lbLoading, setLbLoading]     = useState(false);

  // Live game state in refs to avoid stale closures in intervals
  const liveRef = useRef({ score: 0, lives: MAX_LIVES, streak: 0, bestStreak: 0, correct: 0, wrong: 0 });
  // Display state derived from live ref
  const [disp, setDisp] = useState({ score: 0, lives: MAX_LIVES, streak: 0 });

  const qStartRef     = useRef(0);
  const inFeedbackRef = useRef(false);
  const diffRef       = useRef<Difficulty>("medium");
  const gameActiveRef = useRef(false);

  useEffect(() => { setBests(loadBests()); }, []);

  function syncDisp() {
    const { score, lives, streak } = liveRef.current;
    setDisp({ score, lives, streak });
  }

  function spawnQuestion() {
    const q = makeQuestion(diffRef.current);
    setQuestion(q);
    setAnswer("");
    inFeedbackRef.current = false;
    qStartRef.current = Date.now();
  }

  function endGame(reason: "time" | "lives") {
    gameActiveRef.current = false;
    const { score, correct, wrong, bestStreak } = liveRef.current;
    const isNewBest = saveBest(diffRef.current, score);
    setBests(loadBests());
    setResult({ score, correct, wrong, bestStreak, isNewBest, reason, difficulty: diffRef.current });
    setPhase("result");
    globalStore.getState().touchStreak();
    const thresholds: Record<string, [number, number]> = { easy: [80, 40], medium: [150, 80], hard: [200, 100] };
    const [goldT, silverT] = thresholds[diffRef.current];
    globalStore.getState().awardMedal(score >= goldT ? "gold" : score >= silverT ? "silver" : "bronze");
    if (correct > 0) brainTrainingStore.getState().addXp(correct * 5);
    // Submit score to leaderboard if signed in
    const supabase = getSupabaseBrowserClient();
    if (supabase && score > 0) {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) return;
        fetch("/api/scores/math-blitz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty: diffRef.current, score, correct }),
        }).catch((err) => console.error("[MathBlitz] score submit failed:", err));
      });
    }
  }

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    setCountNum(3);
    let n = 3;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const step = () => {
      n--;
      setCountNum(n);
      if (n > 0) {
        timeouts.push(setTimeout(step, 1000));
      } else {
        // "Go!" for 500ms then start
        timeouts.push(setTimeout(() => {
          liveRef.current = { score: 0, lives: MAX_LIVES, streak: 0, bestStreak: 0, correct: 0, wrong: 0 };
          setDisp({ score: 0, lives: MAX_LIVES, streak: 0 });
          setSecsLeft(GAME_SECS);
          gameActiveRef.current = true;
          setPhase("playing");
        }, 600));
      }
    };
    timeouts.push(setTimeout(step, 1000));
    return () => timeouts.forEach(clearTimeout);
  }, [phase]);

  // Game timer
  useEffect(() => {
    if (phase !== "playing") return;
    spawnQuestion();
    const iv = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) {
          clearInterval(iv);
          if (gameActiveRef.current) endGame("time");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function submitAnswer() {
    if (!question || inFeedbackRef.current || phase !== "playing") return;
    const parsed = parseInt(answer.trim(), 10);
    if (isNaN(parsed)) return;

    inFeedbackRef.current = true;
    const elapsed = Date.now() - qStartRef.current;
    const g = liveRef.current;
    const isCorrect = parsed === question.answer;

    // Track per-operation stats
    const op = question.display.split(" ")[1];
    const opStats = loadMathOpStats();
    const prev = opStats[op] ?? { c: 0, w: 0 };
    opStats[op] = { c: prev.c + (isCorrect ? 1 : 0), w: prev.w + (isCorrect ? 0 : 1) };
    saveMathOpStats(opStats);

    if (isCorrect) {
      // Correct
      const pts = calcPoints(elapsed, g.streak);
      g.score += pts;
      g.streak++;
      g.correct++;
      if (g.streak > g.bestStreak) g.bestStreak = g.streak;
      syncDisp();
      setFeedback("correct");
      playCorrect();
      setTimeout(() => {
        setFeedback(null);
        if (gameActiveRef.current) spawnQuestion();
      }, 300);
    } else {
      // Wrong
      g.lives--;
      g.streak = 0;
      g.wrong++;
      syncDisp();
      setFeedback("wrong");
      playWrong();
      setTimeout(() => {
        setFeedback(null);
        if (g.lives <= 0) {
          if (gameActiveRef.current) endGame("lives");
        } else if (gameActiveRef.current) {
          spawnQuestion();
        }
      }, 700);
    }
  }

  function startGame(d: Difficulty) {
    diffRef.current = d;
    setDiff(d);
    setPhase("countdown");
  }

  // Fetch leaderboard after game ends (delayed so DB write completes first)
  useEffect(() => {
    if (phase !== "result" || !result) return;
    setLeaderboard(null);
    setLbLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/scores/math-blitz?difficulty=${result.difficulty}`)
        .then((r) => r.json())
        .then(({ leaderboard }) => setLeaderboard(leaderboard ?? []))
        .catch(() => setLeaderboard([]))
        .finally(() => setLbLoading(false));
    }, 800);
    return () => clearTimeout(t);
  }, [phase, result]);

  function resetToSelect() {
    gameActiveRef.current = false;
    setPhase("select");
    setResult(null);
    setQuestion(null);
    setAnswer("");
    setFeedback(null);
    setLeaderboard(null);
  }

  // ── Select screen ───────────────────────────────────────────────────────────

  if (phase === "select") {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Math Blitz</h1>
          <p className="mt-1 text-sm text-muted">Answer as many as you can in 30 seconds. 3 wrong = game over.</p>
        </div>

        <div className="space-y-3 mb-8">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
            const cfg = DIFF_CONFIG[d];
            const pb = bests[d];
            return (
              <button
                key={d}
                onClick={() => startGame(d)}
                className="w-full rounded-2xl border border-border bg-surface px-5 py-4 text-left transition-all duration-150 hover:border-[var(--accent)]/40 hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold"
                      style={{ background: cfg.color }}
                    >
                      {cfg.label.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold">{cfg.label}</div>
                      <div className="text-xs text-muted mt-0.5">{cfg.desc}</div>
                    </div>
                  </div>
                  {pb > 0 && (
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-xs text-muted">Best</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: cfg.color }}>{pb}</div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-surface px-5 py-4 space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">How scoring works</div>
          <div className="space-y-1.5 text-sm text-muted">
            <div className="flex justify-between"><span>Correct answer</span><span className="font-semibold text-fg">+10 pts</span></div>
            <div className="flex justify-between"><span>Answer in under 3s</span><span className="font-semibold text-fg">+5 bonus</span></div>
            <div className="flex justify-between"><span>Answer in under 5s</span><span className="font-semibold text-fg">+3 bonus</span></div>
            <div className="flex justify-between"><span>3 in a row</span><span className="font-semibold" style={{ color: "#f59e0b" }}>×1.5</span></div>
            <div className="flex justify-between"><span>5 in a row</span><span className="font-semibold" style={{ color: "#f97316" }}>×2</span></div>
            <div className="flex justify-between"><span>10 in a row</span><span className="font-semibold" style={{ color: "#e11d48" }}>×3</span></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Countdown ───────────────────────────────────────────────────────────────

  if (phase === "countdown") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={countNum}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center select-none"
          >
            {countNum > 0 ? (
              <span className="text-[120px] font-black leading-none" style={{ color: "var(--accent)" }}>
                {countNum}
              </span>
            ) : (
              <span className="text-6xl font-black" style={{ color: "var(--accent)" }}>Go!</span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── Result ──────────────────────────────────────────────────────────────────

  if (phase === "result" && result) {
    const accuracy = result.correct + result.wrong > 0
      ? Math.round((result.correct / (result.correct + result.wrong)) * 100)
      : 0;
    const cfg = DIFF_CONFIG[result.difficulty];

    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <div className="text-center mb-6">
          <div
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: result.isNewBest ? "linear-gradient(135deg, #f59e0b, #f97316)" : "var(--surface)", border: "1px solid var(--border)" }}
          >
            <Trophy size={28} style={{ color: result.isNewBest ? "white" : "var(--muted)" }} />
          </div>
          <h2 className="text-2xl font-bold">
            {result.reason === "lives" ? "Game over!" : "Time's up!"}
          </h2>
          {result.isNewBest && (
            <p className="mt-1 text-sm font-semibold" style={{ color: "#f59e0b" }}>New personal best!</p>
          )}
          <div className="mt-3 text-5xl font-black tabular-nums" style={{ color: cfg.color }}>
            {result.score}
          </div>
          <div className="text-sm text-muted mt-0.5">{cfg.label} · {result.correct} correct</div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {[
            { label: "Correct", value: result.correct, color: "#10b981" },
            { label: "Wrong",   value: result.wrong,   color: "#e11d48" },
            { label: "Accuracy", value: `${accuracy}%`, color: "var(--accent)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface p-3 text-center">
              <div className="text-xl font-bold tabular-nums" style={{ color }}>{value}</div>
              <div className="text-xs text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {result.bestStreak > 0 && (
          <div className="rounded-2xl border border-border bg-surface px-5 py-3.5 flex items-center justify-between mb-6">
            <span className="text-sm text-muted">Best streak</span>
            <span className="text-sm font-bold tabular-nums">{result.bestStreak} in a row</span>
          </div>
        )}

        <div className="space-y-2.5">
          <button
            onClick={() => startGame(result.difficulty)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: cfg.color }}
          >
            <RotateCcw size={15} />
            Play again
          </button>
          <button
            onClick={resetToSelect}
            className="w-full rounded-2xl border border-border py-3.5 text-sm font-medium transition-colors hover:bg-border/30"
          >
            Change difficulty
          </button>
        </div>

        {/* Inline leaderboard */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              {cfg.label} leaderboard
            </div>
            <Link href="/stats/math-blitz" className="text-xs text-muted hover:text-fg transition-colors">
              Full rankings →
            </Link>
          </div>

          {lbLoading ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
              Loading…
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center">
              <div className="text-sm text-muted">No scores yet — you could be first!</div>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border bg-surface px-4 py-3 transition-colors"
                  style={{ borderColor: entry.score === result.score && entry.username ? "var(--game)" : "var(--border)" }}
                >
                  <span className="w-5 text-center text-xs font-bold tabular-nums"
                    style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--muted)" }}>
                    {i + 1}
                  </span>
                  <MiniAvatar avatar={entry.avatar} username={entry.username} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{entry.username}</div>
                    <div className="text-xs text-muted">{entry.correct} correct</div>
                  </div>
                  <div className="text-base font-black tabular-nums" style={{ color: cfg.color }}>
                    {entry.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Playing ─────────────────────────────────────────────────────────────────

  const multiplier = getMultiplier(disp.streak);
  const feedbackBg = feedback === "correct"
    ? "color-mix(in srgb, #10b981 12%, var(--surface))"
    : feedback === "wrong"
      ? "color-mix(in srgb, #e11d48 12%, var(--surface))"
      : "var(--surface)";

  function padPress(key: string) {
    if (inFeedbackRef.current || phase !== "playing") return;
    if (key === "⌫") {
      setAnswer((a) => a.slice(0, -1));
    } else if (key === "−" ) {
      // toggle negative (allow negative answers for hard subtraction edge cases)
      setAnswer((a) => a.startsWith("-") ? a.slice(1) : a.length ? "-" + a : "-");
    } else {
      setAnswer((a) => (a.length < 4 ? a + key : a));
    }
  }

  const PAD_ROWS = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["−", "0", "⌫"],
  ];

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        {/* Lives */}
        <div className="flex items-center gap-1">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart
              key={i}
              size={18}
              fill={i < disp.lives ? "#e11d48" : "transparent"}
              stroke={i < disp.lives ? "#e11d48" : "var(--border)"}
            />
          ))}
        </div>

        {/* Score */}
        <div className="text-center">
          <div className="text-xl font-black tabular-nums">{disp.score}</div>
          {multiplier && (
            <motion.div
              key={multiplier}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: "#f97316" }}
            >
              {multiplier}
            </motion.div>
          )}
        </div>

        {/* Streak */}
        <div className="text-right">
          <div className="text-xs text-muted">Streak</div>
          <div className="text-sm font-bold tabular-nums">{disp.streak}</div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center py-1 shrink-0">
        <TimerRing secs={secsLeft} total={GAME_SECS} />
      </div>

      {/* Question */}
      <div className="flex flex-1 items-center justify-center px-6">
        <motion.div
          key={question?.display}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="w-full rounded-3xl px-6 py-8 text-center transition-colors duration-150"
          style={{ background: feedbackBg, border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)" }}
        >
          <div className="text-4xl font-black tracking-tight select-none">
            {question?.display} =
          </div>
          {/* Answer display */}
          <div className="mt-4 text-3xl font-black tabular-nums min-h-[2.5rem]" style={{ color: "var(--accent)" }}>
            {answer || <span className="text-muted/30">?</span>}
          </div>
        </motion.div>
      </div>

      {/* Numpad */}
      <div className="shrink-0 px-4 pb-6 pt-2 space-y-2" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
        {PAD_ROWS.map((row, ri) => (
          <div key={ri} className="grid grid-cols-3 gap-2">
            {row.map((key) => {
              const isSpecial = key === "⌫" || key === "−";
              return (
                <motion.button
                  key={key}
                  onPointerDown={(e) => { e.preventDefault(); padPress(key); }}
                  variants={{
                    rest: {
                      y: 0,
                      scale: 1,
                      boxShadow: "0 4px 0 color-mix(in srgb, var(--fg) 14%, transparent)",
                    },
                    pressed: {
                      y: 4,
                      scale: 0.97,
                      boxShadow: "0 0px 0 color-mix(in srgb, var(--fg) 14%, transparent)",
                    },
                  }}
                  initial="rest"
                  whileTap="pressed"
                  transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
                  className="rounded-2xl py-4 text-xl font-bold select-none"
                  style={{
                    background: isSpecial
                      ? "color-mix(in srgb, var(--fg) 9%, var(--surface))"
                      : "color-mix(in srgb, var(--fg) 4%, var(--surface))",
                    border: "1px solid color-mix(in srgb, var(--fg) 12%, transparent)",
                    color: key === "⌫" ? "var(--muted)" : "var(--fg)",
                  }}
                >
                  {key}
                </motion.button>
              );
            })}
          </div>
        ))}
        {/* Submit */}
        <motion.button
          onPointerDown={(e) => { e.preventDefault(); submitAnswer(); }}
          disabled={!answer.trim() || inFeedbackRef.current}
          variants={{
            rest: {
              y: 0,
              scale: 1,
              boxShadow: "0 4px 0 color-mix(in srgb, var(--accent) 45%, #0006)",
            },
            pressed: {
              y: 4,
              scale: 0.98,
              boxShadow: "0 0px 0 color-mix(in srgb, var(--accent) 45%, #0006)",
            },
          }}
          initial="rest"
          whileTap="pressed"
          transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
          className="w-full rounded-2xl py-4 text-base font-bold text-white disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          Check ✓
        </motion.button>
      </div>
    </div>
  );
}
