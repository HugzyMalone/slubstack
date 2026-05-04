"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { getDailyWord, getTodayStr, getDayIndex, isValidGuess } from "@/lib/wordle-words";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { brainTrainingStore } from "@/lib/store";
import { awardQuestProgress } from "@/lib/questsStore";
import { pushLeagueXp } from "@/lib/leagues";
import { globalStore } from "@/lib/globalStore";
import { PBCelebration } from "@/components/PBCelebration";
import { wordleShareCard, type WordleRow } from "@/lib/share";
import { FriendsCompare } from "@/components/FriendsCompare";
import { playWordleTap, playWordleSubmit, playWordleInvalid, playCorrect, playWrong } from "@/lib/sound";
import { WordleGame, type GamePhase, type TileState } from "./WordleGame";

const MAX_GUESSES = 6;
const WORD_LEN = 5;
const STORAGE_KEY = "slubstack_wordle";
const HARD_KEY = "slubstack_wordle_hard";

const WIN_MSGS = ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"];

interface SavedGame {
  date: string;
  guesses: string[];
  phase: GamePhase;
}

function loadSaved(todayStr: string): SavedGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGame;
    return parsed.date === todayStr ? parsed : null;
  } catch { return null; }
}

function saveGame(game: SavedGame) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); } catch {}
}

function evaluate(guess: string, solution: string): TileState[] {
  const result: TileState[] = Array(WORD_LEN).fill("absent");
  const sol = solution.split("");
  const gss = guess.split("");
  for (let i = 0; i < WORD_LEN; i++) {
    if (gss[i] === sol[i]) { result[i] = "correct"; sol[i] = "#"; gss[i] = "#"; }
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (gss[i] !== "#") {
      const idx = sol.indexOf(gss[i]);
      if (idx !== -1) { result[i] = "present"; sol[idx] = "#"; }
    }
  }
  return result;
}

function hardModeViolation(guess: string, guesses: string[], solution: string): string | null {
  if (guesses.length === 0) return null;
  const required: { letter: string; slot: number | null }[] = [];
  for (const prev of guesses) {
    const ev = evaluate(prev, solution);
    for (let i = 0; i < WORD_LEN; i++) {
      if (ev[i] === "correct") required.push({ letter: prev[i], slot: i });
      else if (ev[i] === "present") required.push({ letter: prev[i], slot: null });
    }
  }
  for (const { letter, slot } of required) {
    if (slot !== null) {
      if (guess[slot] !== letter) return `Letter ${slot + 1} must be ${letter}`;
    } else {
      if (!guess.includes(letter)) return `Guess must include ${letter}`;
    }
  }
  return null;
}

type LBEntry = { username: string; avatar: string | null; attempts: number; solved: boolean };

function MiniAvatar({ avatar, username }: { avatar: string | null; username: string }) {
  if (avatar?.startsWith("http") || avatar?.startsWith("/")) {
    return (
      <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden bg-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={username} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs"
      style={{ background: "color-mix(in srgb, var(--game) 25%, var(--surface))" }}>
      {avatar || username[0]?.toUpperCase() || "?"}
    </div>
  );
}

function WordleLeaderboard({ date }: { date: string }) {
  const [leaderboard, setLeaderboard] = useState<LBEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/scores/wordle?date=${date}`)
        .then((r) => r.json())
        .then(({ leaderboard }) => setLeaderboard(leaderboard ?? []))
        .catch(() => setLeaderboard([]))
        .finally(() => setLoading(false));
    }, 600);
    return () => clearTimeout(t);
  }, [date]);

  if (loading) return (
    <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">Loading…</div>
  );
  if (!leaderboard?.length) return (
    <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
      No scores yet today — be the first!
    </div>
  );

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
          <span className="w-5 text-center text-xs font-bold tabular-nums"
            style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--muted)" }}>
            {i + 1}
          </span>
          <MiniAvatar avatar={entry.avatar} username={entry.username} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{entry.username}</div>
          </div>
          <div className="text-sm font-bold tabular-nums" style={{ color: entry.solved ? "#6aaa64" : "#787c7e" }}>
            {entry.solved ? `${entry.attempts}/6` : "X/6"}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WordlePage() {
  const todayStr = useRef(getTodayStr()).current;
  const solution  = useRef(getDailyWord(todayStr)).current;
  const dayIdx    = useRef(getDayIndex(todayStr)).current;

  const [guesses, setGuesses]           = useState<string[]>([]);
  const [current, setCurrent]           = useState("");
  const [phase, setPhase]               = useState<GamePhase>("playing");
  const [pbOpen, setPbOpen]             = useState(false);
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [revealedRows, setRevealedRows] = useState<Set<number>>(new Set());
  const [shakingRow, setShakingRow]     = useState<number | null>(null);
  const [toastMsg, setToastMsg]         = useState<string | null>(null);
  const [hardMode, setHardMode]         = useState(false);
  const [hydrated, setHydrated]         = useState(false);

  useEffect(() => {
    const saved = loadSaved(todayStr);
    if (saved) {
      setGuesses(saved.guesses);
      setPhase(saved.phase);
      const revealed = new Set<number>();
      saved.guesses.forEach((_, i) => revealed.add(i));
      setRevealedRows(revealed);
    }
    try { setHardMode(localStorage.getItem(HARD_KEY) === "1"); } catch {}
    setHydrated(true);
  }, [todayStr]);

  const showToast = useCallback((msg: string, ms = 1800) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), ms);
  }, []);

  const submitScore = useCallback((attempts: number, solved: boolean) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      fetch("/api/scores/wordle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayStr, attempts, solved }),
      }).catch((err) => console.error("[Wordle] score submit failed:", err));
    });
  }, [todayStr]);

  const submitGuess = useCallback(() => {
    if (current.length !== WORD_LEN || revealingRow !== null) return;
    const word = current.toUpperCase();

    if (!isValidGuess(word.toLowerCase())) {
      playWordleInvalid();
      showToast("Not in word list");
      setShakingRow(guesses.length);
      setTimeout(() => setShakingRow(null), 320);
      return;
    }

    if (hardMode) {
      const violation = hardModeViolation(word, guesses, solution);
      if (violation) {
        playWordleInvalid();
        showToast(violation, 2200);
        setShakingRow(guesses.length);
        setTimeout(() => setShakingRow(null), 320);
        return;
      }
    }

    const rowIdx = guesses.length;
    const newGuesses = [...guesses, word];
    setGuesses(newGuesses);
    setCurrent("");
    setRevealingRow(rowIdx);
    playWordleSubmit();

    const revealDone = 600 + 80;
    setTimeout(() => {
      setRevealedRows((prev) => new Set([...prev, rowIdx]));
      setRevealingRow(null);

      const won = word === solution;
      const lost = !won && newGuesses.length >= MAX_GUESSES;
      const newPhase: GamePhase = won ? "won" : lost ? "lost" : "playing";

      if (newPhase !== "playing") {
        setPhase(newPhase);
        saveGame({ date: todayStr, guesses: newGuesses, phase: newPhase });
        if (won) {
          playCorrect();
          showToast(WIN_MSGS[Math.min(rowIdx, WIN_MSGS.length - 1)], 2500);
        } else {
          playWrong();
          showToast(`The word was ${solution}`, 3000);
        }
        submitScore(newGuesses.length, won);
        {
          const wordleXp = won ? 75 : 15;
          brainTrainingStore.getState().addXp(wordleXp);
          awardQuestProgress("xp", wordleXp);
          if (won) awardQuestProgress("correct", 1);
          pushLeagueXp(wordleXp);
        }
        if (won) {
          globalStore.getState().recordBeat();
          setTimeout(() => setPbOpen(true), 400);
        }
      } else {
        saveGame({ date: todayStr, guesses: newGuesses, phase: "playing" });
      }
    }, revealDone);
  }, [current, guesses, revealingRow, solution, todayStr, showToast, submitScore, hardMode]);

  const handleKey = useCallback((key: string) => {
    if (phase !== "playing" || revealingRow !== null) return;
    if (key === "ENTER") { submitGuess(); return; }
    if (key === "⌫" || key === "Backspace") {
      setCurrent((c) => c.slice(0, -1));
      return;
    }
    if (/^[a-zA-Z]$/.test(key) && current.length < WORD_LEN) {
      playWordleTap();
      setCurrent((c) => c + key.toUpperCase());
    }
  }, [phase, revealingRow, current, submitGuess]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      handleKey(e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "ENTER" : e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  if (!hydrated) return null;

  const toastNode = (
    <AnimatePresence>
      {toastMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute inset-x-0 flex justify-center pointer-events-none"
        >
          <div className="rounded-xl px-4 py-2 text-sm font-bold text-white"
            style={{ background: "color-mix(in srgb, var(--fg) 85%, transparent)" }}>
            {toastMsg}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (phase === "playing") {
    return (
      <div
        className="flex flex-col select-none overflow-hidden"
        style={{ height: "calc(100dvh - 52px - env(safe-area-inset-top, 0px))" }}
      >
        <div className="shrink-0 flex items-center justify-between px-4 py-2">
          <h1 className="text-xl font-black tracking-widest" style={{ color: "var(--game)" }}>WORDLE</h1>
          <div className="flex items-center gap-2">
            {hardMode && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ background: "#c9b458" }}>Hard</span>
            )}
            <Link
              href="/brain-training/wordle/practice"
              className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-fg transition-colors"
            >
              <Sparkles size={12} />
              Practice
            </Link>
            <span className="text-xs font-semibold text-muted">#{dayIdx + 1}</span>
          </div>
        </div>

        <div className="relative shrink-0" style={{ height: 32 }}>
          {toastNode}
        </div>

        <WordleGame
          guesses={guesses}
          current={current}
          phase={phase}
          revealingRow={revealingRow}
          revealedRows={revealedRows}
          shakingRow={shakingRow}
          solution={solution}
          onKey={handleKey}
        />
      </div>
    );
  }

  const resultRows: WordleRow[] = guesses.map((g) =>
    evaluate(g, solution).map((s) =>
      s === "correct" ? "correct" : s === "present" ? "present" : "absent"
    ) as WordleRow
  );
  const wordleShareText = wordleShareCard({
    dayNumber: dayIdx + 1,
    attempts: guesses.length,
    rows: resultRows,
    solved: phase === "won",
  });

  return (
    <>
      <PBCelebration
        open={pbOpen}
        onClose={() => setPbOpen(false)}
        value={`${guesses.length}/6`}
        label={phase === "won" ? "Solved!" : "Nice try"}
        gameLabel="Daily Wordle"
        shareText={wordleShareText}
      />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pb-8 pt-3 select-none">
        <div className="mb-2 w-full flex items-baseline justify-between">
          <h1 className="font-display text-3xl font-black tracking-widest" style={{ color: "var(--game)" }}>WORDLE</h1>
          <div className="flex items-center gap-2">
            {hardMode && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ background: "#c9b458" }}>Hard</span>
            )}
            <span className="font-display text-[13px] font-extrabold text-muted">#{dayIdx + 1}</span>
          </div>
        </div>

        <div className="relative w-full mb-2" style={{ height: 36 }}>
          {toastNode}
        </div>

        <WordleGame
          guesses={guesses}
          current={current}
          phase={phase}
          revealingRow={revealingRow}
          revealedRows={revealedRows}
          shakingRow={shakingRow}
          solution={solution}
          onKey={handleKey}
          layout="stacked"
        />

        <div className="mt-5 w-full">
          <FriendsCompare game="wordle" date={todayStr} />
        </div>

        <div className="mt-6 w-full space-y-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText(wordleShareText).then(() => {
                toast.success("Copied to clipboard");
              }).catch(() => {
                toast.error("Couldn't copy");
              });
            }}
            className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: "var(--game)" }}
          >
            Share result
          </button>

          <Link
            href="/brain-training/wordle/practice"
            className="block w-full rounded-2xl border border-border bg-surface py-3 text-center text-sm font-semibold transition-colors hover:bg-border/30"
          >
            Practice with random words
          </Link>

          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              Today&apos;s scores
            </div>
            <WordleLeaderboard date={todayStr} />
          </div>
        </div>
      </div>
    </>
  );
}
