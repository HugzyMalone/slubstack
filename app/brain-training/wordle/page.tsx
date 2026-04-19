"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDailyWord, getTodayStr, getDayIndex, isValidGuess } from "@/lib/wordle-words";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { brainTrainingStore } from "@/lib/store";

type TileState = "correct" | "present" | "absent" | "empty" | "active";
type GamePhase = "playing" | "won" | "lost";
type LBEntry = { username: string; avatar: string | null; attempts: number; solved: boolean };

const MAX_GUESSES = 6;
const WORD_LEN = 5;
const TILE = 52;
const GAP = 4;
const KEY_H = 48;
const KEY_W = 32;
const KEY_W_WIDE = 52;
const STORAGE_KEY = "slubstack_wordle";

const WIN_MSGS = ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"];

const KEY_COLORS: Record<TileState, string> = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent:  "#3a3a3c",
  empty:   "color-mix(in srgb, var(--fg) 12%, var(--surface))",
  active:  "color-mix(in srgb, var(--fg) 12%, var(--surface))",
};
const TILE_COLORS: Record<"correct" | "present" | "absent", string> = {
  correct: "#6aaa64",
  present: "#c9b458",
  absent:  "#3a3a3c",
};

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

function getKeyStates(guesses: string[], solution: string): Record<string, TileState> {
  const states: Record<string, TileState> = {};
  const priority: Record<TileState, number> = { correct: 3, present: 2, absent: 1, empty: 0, active: 0 };
  for (const g of guesses) {
    const ev = evaluate(g, solution);
    for (let i = 0; i < g.length; i++) {
      const l = g[i];
      if ((priority[ev[i]] ?? 0) > (priority[states[l]] ?? 0)) states[l] = ev[i];
    }
  }
  return states;
}

function buildShareText(guesses: string[], solution: string, phase: GamePhase, dayIdx: number): string {
  const score = phase === "won" ? guesses.length : "X";
  const rows = guesses.map((g) =>
    evaluate(g, solution).map((s) =>
      s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛"
    ).join("")
  ).join("\n");
  return `Slubstack Wordle #${dayIdx + 1}\n${score}/${MAX_GUESSES}\n\n${rows}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────

function WordleStyles() {
  return (
    <style>{`
      @keyframes wShake {
        0%,100%{transform:translateX(0)}
        15%{transform:translateX(-7px)}
        35%{transform:translateX(7px)}
        55%{transform:translateX(-5px)}
        75%{transform:translateX(5px)}
      }
      @keyframes wBounce {
        0%,100%{transform:translateY(0)}
        40%{transform:translateY(-20px)}
        70%{transform:translateY(-8px)}
      }
    `}</style>
  );
}

// ── Tile ──────────────────────────────────────────────────────────────────────

function WordleTile({
  letter, evaluation, colIdx, isRevealing, isRevealed, popKey,
}: {
  letter: string; evaluation: TileState; colIdx: number;
  isRevealing: boolean; isRevealed: boolean; popKey?: number;
}) {
  const color = isRevealed && evaluation !== "empty" && evaluation !== "active"
    ? TILE_COLORS[evaluation as keyof typeof TILE_COLORS]
    : undefined;

  const borderColor = color
    ? "transparent"
    : letter
    ? "color-mix(in srgb, var(--fg) 50%, transparent)"
    : "color-mix(in srgb, var(--fg) 20%, transparent)";

  return (
    <div style={{ perspective: 250, width: TILE, height: TILE }}>
      <motion.div
        key={popKey}
        initial={popKey !== undefined ? { scale: 0.85 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 20 }}
        style={{ width: TILE, height: TILE, position: "relative", transformStyle: "preserve-3d" }}
      >
        <motion.div
          animate={isRevealing ? { rotateX: [0, -90] } : {}}
          transition={{ delay: colIdx * 0.18, duration: 0.22, ease: "easeIn" }}
          style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `2px solid ${borderColor}`, borderRadius: 5,
            fontSize: 20, fontWeight: 700, color: "var(--fg)", background: "var(--surface)",
          }}
        >
          {letter}
        </motion.div>
        <motion.div
          animate={isRevealing ? { rotateX: [90, 0] } : isRevealed ? { rotateX: 0 } : { rotateX: 90 }}
          transition={{ delay: colIdx * 0.18 + 0.22, duration: 0.22, ease: "easeOut" }}
          style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 5, fontSize: 20, fontWeight: 700, color: "#fff",
            background: color ?? "var(--surface)",
          }}
        >
          {letter}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Keyboard ──────────────────────────────────────────────────────────────────

const KB_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

function WordleKeyboard({ onKey, keyStates }: {
  onKey: (k: string) => void;
  keyStates: Record<string, TileState>;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-1">
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.map((key) => {
            const state = keyStates[key] ?? "empty";
            const isWide = key === "ENTER" || key === "⌫";
            return (
              <button
                key={key}
                onPointerDown={(e) => { e.preventDefault(); onKey(key); }}
                style={{
                  background: KEY_COLORS[state],
                  color: state === "empty" ? "var(--fg)" : "#fff",
                  width: isWide ? KEY_W_WIDE : KEY_W,
                  height: KEY_H,
                  borderRadius: 5,
                  fontSize: isWide ? 10 : 14,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.3s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

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

// ── Shared grid render ────────────────────────────────────────────────────────

function WordleGrid({
  rows, guesses, solution, revealingRow, revealedRows, shakingRow, phase, current,
}: {
  rows: string[][];
  guesses: string[];
  solution: string;
  revealingRow: number | null;
  revealedRows: Set<number>;
  shakingRow: number | null;
  phase: GamePhase;
  current: string;
}) {
  const gridWidth = WORD_LEN * TILE + (WORD_LEN - 1) * GAP;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: `repeat(${MAX_GUESSES}, ${TILE}px)`,
        gap: GAP,
        width: gridWidth,
      }}
    >
      {rows.map((letters, ri) => {
        const isRevealing = revealingRow === ri;
        const isRevealed  = revealedRows.has(ri);
        const isShaking   = shakingRow === ri;
        const hasWon      = phase === "won" && ri === guesses.length - 1 && isRevealed;
        return (
          <div
            key={ri}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${WORD_LEN}, ${TILE}px)`,
              gap: GAP,
              animation: isShaking
                ? "wShake 0.5s ease-in-out"
                : hasWon
                ? "wBounce 0.5s ease-in-out 0.6s"
                : undefined,
            }}
          >
            {letters.map((letter, ci) => {
              const trimmed = letter.trim();
              const ev = isRevealed && guesses[ri]
                ? evaluate(guesses[ri], solution)[ci]
                : trimmed ? "active" : "empty";
              return (
                <WordleTile
                  key={ci}
                  letter={trimmed}
                  evaluation={ev}
                  colIdx={ci}
                  isRevealing={isRevealing}
                  isRevealed={isRevealed}
                  popKey={ri === guesses.length && phase === "playing" ? current.length : undefined}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WordlePage() {
  const todayStr = useRef(getTodayStr()).current;
  const solution  = useRef(getDailyWord(todayStr)).current;
  const dayIdx    = useRef(getDayIndex(todayStr)).current;

  const [guesses, setGuesses]           = useState<string[]>([]);
  const [current, setCurrent]           = useState("");
  const [phase, setPhase]               = useState<GamePhase>("playing");
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [revealedRows, setRevealedRows] = useState<Set<number>>(new Set());
  const [shakingRow, setShakingRow]     = useState<number | null>(null);
  const [toast, setToast]               = useState<string | null>(null);
  const [shared, setShared]             = useState(false);
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
    setHydrated(true);
  }, [todayStr]);

  const showToast = useCallback((msg: string, ms = 1800) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
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
      showToast("Not in word list");
      setShakingRow(guesses.length);
      setTimeout(() => setShakingRow(null), 600);
      return;
    }

    const rowIdx = guesses.length;
    const newGuesses = [...guesses, word];
    setGuesses(newGuesses);
    setCurrent("");
    setRevealingRow(rowIdx);

    const revealDone = WORD_LEN * 180 + 220 + 100;
    setTimeout(() => {
      setRevealedRows((prev) => new Set([...prev, rowIdx]));
      setRevealingRow(null);

      const won = word === solution;
      const lost = !won && newGuesses.length >= MAX_GUESSES;
      const newPhase: GamePhase = won ? "won" : lost ? "lost" : "playing";

      if (newPhase !== "playing") {
        setPhase(newPhase);
        saveGame({ date: todayStr, guesses: newGuesses, phase: newPhase });
        if (won) showToast(WIN_MSGS[Math.min(rowIdx, WIN_MSGS.length - 1)], 2500);
        else showToast(`The word was ${solution}`, 3000);
        submitScore(newGuesses.length, won);
        brainTrainingStore.getState().addXp(won ? 75 : 15);
      } else {
        saveGame({ date: todayStr, guesses: newGuesses, phase: "playing" });
      }
    }, revealDone);
  }, [current, guesses, revealingRow, solution, todayStr, showToast, submitScore]);

  const handleKey = useCallback((key: string) => {
    if (phase !== "playing" || revealingRow !== null) return;
    if (key === "ENTER") { submitGuess(); return; }
    if (key === "⌫" || key === "Backspace") {
      setCurrent((c) => c.slice(0, -1));
      return;
    }
    if (/^[a-zA-Z]$/.test(key) && current.length < WORD_LEN) {
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

  const keyStates = getKeyStates(guesses, solution);

  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => {
    if (i < guesses.length) return guesses[i].padEnd(WORD_LEN, " ").split("");
    if (i === guesses.length && phase === "playing") return current.padEnd(WORD_LEN, " ").split("");
    return Array(WORD_LEN).fill(" ");
  });

  if (!hydrated) return null;

  // ── Toast node (reused in both layouts) ──────────────────────────────────────
  const toastNode = (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute inset-x-0 flex justify-center pointer-events-none"
        >
          <div className="rounded-xl px-4 py-2 text-sm font-bold text-white"
            style={{ background: "color-mix(in srgb, var(--fg) 85%, transparent)" }}>
            {toast}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Playing phase: full-height, no-scroll layout ──────────────────────────────
  if (phase === "playing") {
    return (
      <>
        <WordleStyles />
        <div
          className="flex flex-col select-none overflow-hidden"
          style={{ height: "calc(100dvh - 52px - env(safe-area-inset-top, 0px))" }}
        >
          {/* Compact header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2">
            <h1 className="text-xl font-black tracking-widest" style={{ color: "var(--game)" }}>WORDLE</h1>
            <span className="text-xs font-semibold text-muted">#{dayIdx + 1}</span>
          </div>

          {/* Toast slot */}
          <div className="relative shrink-0" style={{ height: 32 }}>
            {toastNode}
          </div>

          {/* Grid — fills remaining space */}
          <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
            <WordleGrid
              rows={rows} guesses={guesses} solution={solution}
              revealingRow={revealingRow} revealedRows={revealedRows}
              shakingRow={shakingRow} phase={phase} current={current}
            />
          </div>

          {/* Keyboard */}
          <div
            className="shrink-0 pb-2"
            style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
          >
            <WordleKeyboard onKey={handleKey} keyStates={keyStates} />
          </div>
        </div>
      </>
    );
  }

  // ── Result phase (won / lost): scrollable layout ──────────────────────────────
  return (
    <>
      <WordleStyles />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pb-8 pt-3 select-none">
        {/* Header */}
        <div className="mb-2 w-full flex items-baseline justify-between">
          <h1 className="text-2xl font-black tracking-widest" style={{ color: "var(--game)" }}>WORDLE</h1>
          <span className="text-xs text-muted">#{dayIdx + 1}</span>
        </div>

        {/* Toast */}
        <div className="relative w-full mb-2" style={{ height: 36 }}>
          {toastNode}
        </div>

        {/* Grid */}
        <WordleGrid
          rows={rows} guesses={guesses} solution={solution}
          revealingRow={revealingRow} revealedRows={revealedRows}
          shakingRow={shakingRow} phase={phase} current={current}
        />

        {/* Keyboard */}
        <div className="mt-4">
          <WordleKeyboard onKey={handleKey} keyStates={keyStates} />
        </div>

        {/* Share + leaderboard */}
        <div className="mt-6 w-full space-y-4">
          <button
            onClick={() => {
              const text = buildShareText(guesses, solution, phase, dayIdx);
              navigator.clipboard.writeText(text).then(() => {
                setShared(true);
                setTimeout(() => setShared(false), 2000);
              });
            }}
            className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: shared ? "#6aaa64" : "var(--game)" }}
          >
            {shared ? "Copied!" : "Share result"}
          </button>

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
