"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDailyPuzzle, getTodayStr, getPuzzleNumber, type ConnectionsCategory, type DifficultyColor } from "@/lib/connections-puzzles";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { brainTrainingStore } from "@/lib/store";

const MAX_MISTAKES = 4;
const STORAGE_KEY = "slubstack_connections";
const XP_WIN = 60;
const XP_LOSE = 15;

const COLOR_STYLES: Record<DifficultyColor, { bg: string; text: string; label: string }> = {
  yellow: { bg: "#f9e04b", text: "#1a1a1a", label: "Straightforward" },
  green:  { bg: "#6aaa64", text: "#fff",    label: "Getting trickier" },
  blue:   { bg: "#4a90d9", text: "#fff",    label: "Tricky" },
  purple: { bg: "#9b59d0", text: "#fff",    label: "Very tricky" },
};

const COLOR_ORDER: DifficultyColor[] = ["yellow", "green", "blue", "purple"];

type GamePhase = "playing" | "won" | "lost";

interface LBEntry { username: string; avatar: string | null; solved: boolean; mistakes: number; }

interface SavedGame {
  date: string;
  solved: DifficultyColor[];
  mistakes: number;
  phase: GamePhase;
  shuffled: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
      style={{ background: "color-mix(in srgb, var(--accent) 20%, var(--surface))" }}>
      {avatar || username[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function ConnectionsPage() {
  const puzzle = getDailyPuzzle();
  const todayStr = getTodayStr();
  const puzzleNumber = getPuzzleNumber();

  const allWords = puzzle.categories.flatMap(c => c.words);
  const categoryByWord = Object.fromEntries(
    puzzle.categories.flatMap(c => c.words.map(w => [w, c]))
  );

  const [shuffled, setShuffled] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState<DifficultyColor[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [oneAway, setOneAway] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LBEntry[] | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  // Init or restore
  useEffect(() => {
    const saved = loadSaved(todayStr);
    if (saved) {
      setSolved(saved.solved);
      setMistakes(saved.mistakes);
      setPhase(saved.phase);
      setShuffled(saved.shuffled);
    } else {
      const remaining = allWords.filter(w => !solved.includes(categoryByWord[w].color));
      setShuffled(shuffle(remaining));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on state change
  useEffect(() => {
    if (shuffled.length === 0) return;
    saveGame({ date: todayStr, solved, mistakes, phase, shuffled });
  }, [solved, mistakes, phase, shuffled, todayStr]);

  // Submit score + XP when game ends
  useEffect(() => {
    if ((phase === "won" || phase === "lost") && !xpAwarded) {
      setXpAwarded(true);
      const xp = phase === "won" ? XP_WIN : XP_LOSE;
      brainTrainingStore.getState().addXp(xp);

      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          fetch("/api/scores/connections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: todayStr, solved: phase === "won", mistakes }),
          }).catch(() => {});
        });
      }

      setTimeout(() => {
        fetch(`/api/scores/connections?date=${todayStr}`)
          .then(r => r.json())
          .then(d => setLeaderboard(d.leaderboard ?? []))
          .catch(() => {});
      }, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const showToast = useCallback((msg: string, duration = 1800) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  }, []);

  function toggleWord(word: string) {
    if (phase !== "playing") return;
    setSelected(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : prev.length < 4 ? [...prev, word] : prev
    );
  }

  function submitGuess() {
    if (selected.length !== 4 || phase !== "playing") return;

    const colors = selected.map(w => categoryByWord[w].color);
    const allSame = colors.every(c => c === colors[0]);

    if (allSame) {
      const color = colors[0];
      const category = puzzle.categories.find(c => c.color === color)!;
      const newSolved = [...solved, color];
      setSolved(newSolved);
      setShuffled(prev => prev.filter(w => !selected.includes(w)));
      setSelected([]);
      showToast(category.name, 2500);

      if (newSolved.length === 4) {
        setTimeout(() => setPhase("won"), 400);
      }
    } else {
      // Check if one away
      const uniqueColors = [...new Set(colors)];
      if (uniqueColors.length === 2) {
        const counts = uniqueColors.map(c => colors.filter(x => x === c).length);
        if (counts.includes(3)) {
          setOneAway(true);
          setTimeout(() => setOneAway(false), 1500);
        }
      }

      setShake(true);
      setTimeout(() => setShake(false), 600);
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= MAX_MISTAKES) {
        setTimeout(() => setPhase("lost"), 600);
      }
    }
  }

  function shuffleRemaining() {
    setShuffled(prev => shuffle(prev));
  }

  function deselectAll() {
    setSelected([]);
  }

  const remainingWords = shuffled.filter(w => !solved.includes(categoryByWord[w].color));
  const solvedCategories = COLOR_ORDER
    .filter(c => solved.includes(c))
    .map(c => puzzle.categories.find(cat => cat.color === c)!);

  const mistakeDots = Array.from({ length: MAX_MISTAKES }, (_, i) => i < (MAX_MISTAKES - mistakes));

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6 flex flex-col min-h-[calc(100dvh-52px)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Connections</h1>
          <p className="text-xs text-muted">#{puzzleNumber} · {todayStr}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted">Mistakes:</span>
          {mistakeDots.map((remaining, i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-full transition-all duration-300"
              style={{ background: remaining ? "var(--fg)" : "color-mix(in srgb, var(--fg) 15%, transparent)" }}
            />
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm text-muted text-center">Find four groups of four!</p>

      {/* Solved categories */}
      <div className="flex flex-col gap-2 mb-2">
        {solvedCategories.map(cat => (
          <motion.div
            key={cat.color}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl px-4 py-3 text-center"
            style={{ background: COLOR_STYLES[cat.color].bg, color: COLOR_STYLES[cat.color].text }}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">{COLOR_STYLES[cat.color].label}</div>
            <div className="font-bold text-sm mt-0.5">{cat.name}</div>
            <div className="text-xs mt-1 opacity-90">{cat.words.join(", ")}</div>
          </motion.div>
        ))}
      </div>

      {/* Word grid */}
      {phase === "playing" && (
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-4 gap-2 mb-4"
        >
          {remainingWords.map(word => {
            const isSelected = selected.includes(word);
            return (
              <button
                key={word}
                onClick={() => toggleWord(word)}
                className="rounded-xl py-3 px-1 text-center text-xs font-bold uppercase tracking-wide transition-all active:scale-95 select-none"
                style={{
                  background: isSelected
                    ? "var(--fg)"
                    : "color-mix(in srgb, var(--fg) 8%, var(--surface))",
                  color: isSelected ? "var(--bg)" : "var(--fg)",
                  border: "1px solid color-mix(in srgb, var(--fg) 10%, transparent)",
                }}
              >
                {word}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Controls */}
      {phase === "playing" && (
        <div className="flex gap-2 justify-center mb-4">
          <button
            onClick={shuffleRemaining}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted transition-all active:scale-95"
          >
            Shuffle
          </button>
          <button
            onClick={deselectAll}
            disabled={selected.length === 0}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted transition-all active:scale-95 disabled:opacity-40"
          >
            Deselect all
          </button>
          <button
            onClick={submitGuess}
            disabled={selected.length !== 4}
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: selected.length === 4 ? "var(--fg)" : undefined }}
          >
            Submit
          </button>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {(phase === "won" || phase === "lost") && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 rounded-2xl p-5 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="text-3xl mb-2">{phase === "won" ? "🎉" : "😔"}</div>
            <div className="font-bold text-lg mb-1">
              {phase === "won" ? "Solved it!" : "Better luck tomorrow"}
            </div>
            <div className="text-sm text-muted mb-3">
              {phase === "won"
                ? `${mistakes === 0 ? "Perfect! " : ""}${mistakes} mistake${mistakes !== 1 ? "s" : ""} · +${XP_WIN} XP`
                : `${mistakes} mistake${mistakes !== 1 ? "s" : ""} · +${XP_LOSE} XP`}
            </div>

            {/* Share grid */}
            <div className="flex justify-center gap-1 mb-4">
              {solved.map(c => (
                <div key={c} className="h-5 w-5 rounded" style={{ background: COLOR_STYLES[c].bg }} />
              ))}
            </div>

            {/* Leaderboard */}
            {leaderboard === null ? (
              <div className="text-sm text-muted">Loading scores…</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-sm text-muted">No scores yet today</div>
            ) : (
              <div className="flex flex-col gap-2 mt-2 text-left">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted mb-1">Today&apos;s leaderboard</div>
                {leaderboard.slice(0, 10).map((entry, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 text-center text-sm font-bold text-muted">{i + 1}</span>
                    <MiniAvatar avatar={entry.avatar} username={entry.username} />
                    <span className="flex-1 text-sm font-medium truncate">{entry.username}</span>
                    <span className="text-xs text-muted">
                      {entry.solved ? `✓ ${entry.mistakes}` : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg"
            style={{ background: "var(--fg)", color: "var(--bg)" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* One away toast */}
      <AnimatePresence>
        {oneAway && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed left-1/2 top-32 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg"
            style={{ background: "#f9e04b", color: "#1a1a1a" }}
          >
            One away…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
