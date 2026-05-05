"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { getDailyPuzzle, getTodayStr, getPuzzleNumber, type DifficultyColor } from "@/lib/connections-puzzles";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { brainTrainingStore } from "@/lib/store";
import { awardQuestProgress } from "@/lib/questsStore";
import { pushLeagueXp } from "@/lib/leagues";
import { globalStore } from "@/lib/globalStore";
import { PBCelebration } from "@/components/PBCelebration";
import { connectionsShareCard } from "@/lib/share";
import { FriendsCompare } from "@/components/FriendsCompare";
import { playConnectionsSolve, playConnectionsMistake, playConnectionsPerfect } from "@/lib/sound";

const MAX_MISTAKES = 4;
const STORAGE_KEY = "slubstack_connections";
const XP_WIN = 60;
const XP_LOSE = 15;

const COLOR_STYLES: Record<DifficultyColor, { bg: string; text: string; label: string }> = {
  yellow: { bg: "#facc15", text: "#1a1a1a", label: "Straightforward" },
  green:  { bg: "#10b981", text: "#fff",    label: "Getting trickier" },
  blue:   { bg: "#0ea5e9", text: "#fff",    label: "Tricky" },
  purple: { bg: "#a855f7", text: "#fff",    label: "Very tricky" },
};

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
  const [solveOrder, setSolveOrder] = useState<DifficultyColor[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [shake, setShake] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [oneAway, setOneAway] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LBEntry[] | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [pbOpen, setPbOpen] = useState(false);
  const [solvingWords, setSolvingWords] = useState<string[]>([]);
  const [solvingColor, setSolvingColor] = useState<DifficultyColor | null>(null);
  const [drainedDot, setDrainedDot] = useState<number | null>(null);
  const perfectPlayedRef = useRef(false);

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

  // Sync solveOrder with solved (handles restored games — track-only adds appended).
  useEffect(() => {
    setSolveOrder(prev => {
      const stillValid = prev.filter(c => solved.includes(c));
      const missing = solved.filter(c => !stillValid.includes(c));
      return [...stillValid, ...missing];
    });
  }, [solved]);

  // Submit score + XP when game ends
  useEffect(() => {
    if ((phase === "won" || phase === "lost") && !xpAwarded) {
      setXpAwarded(true);
      const xp = phase === "won" ? XP_WIN : XP_LOSE;
      brainTrainingStore.getState().addXp(xp);
      awardQuestProgress("xp", xp);
      if (phase === "won") awardQuestProgress("correct", 1);
      pushLeagueXp(xp);
      if (phase === "won") {
        globalStore.getState().recordBeat();
        setTimeout(() => setPbOpen(true), 700);
      }

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
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), duration);
  }, []);

  function toggleWord(word: string) {
    if (phase !== "playing" || solvingColor) return;
    setSelected(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : prev.length < 4 ? [...prev, word] : prev
    );
  }

  const submitGuess = useCallback(() => {
    if (selected.length !== 4 || phase !== "playing" || solvingColor) return;

    const colors = selected.map(w => categoryByWord[w].color);
    const allSame = colors.every(c => c === colors[0]);

    if (allSame) {
      const color = colors[0];
      const category = puzzle.categories.find(c => c.color === color)!;
      const solving = [...selected];

      setSolvingWords(solving);
      setSolvingColor(color);
      playConnectionsSolve();

      setTimeout(() => {
        const newSolved = [...solved, color];
        setSolved(newSolved);
        setSolveOrder(prev => [...prev, color]);
        setShuffled(prev => prev.filter(w => !solving.includes(w)));
        setSelected([]);
        setSolvingWords([]);
        setSolvingColor(null);
        showToast(category.name, 2500);

        if (newSolved.length === 4) {
          if (mistakes === 0 && !perfectPlayedRef.current) {
            perfectPlayedRef.current = true;
            setTimeout(() => playConnectionsPerfect(), 200);
          }
          setTimeout(() => setPhase("won"), 400);
        }
      }, 650);
    } else {
      const uniqueColors = [...new Set(colors)];
      if (uniqueColors.length === 2) {
        const counts = uniqueColors.map(c => colors.filter(x => x === c).length);
        if (counts.includes(3)) {
          setOneAway(true);
          setTimeout(() => setOneAway(false), 1500);
        }
      }

      playConnectionsMistake();
      setShake(true);
      setTimeout(() => setShake(false), 600);
      const newMistakes = mistakes + 1;
      const dotIdx = MAX_MISTAKES - newMistakes;
      setDrainedDot(dotIdx);
      setTimeout(() => setDrainedDot(null), 320);
      setMistakes(newMistakes);
      if (newMistakes >= MAX_MISTAKES) {
        setTimeout(() => setPhase("lost"), 600);
      }
    }
  }, [selected, phase, solvingColor, categoryByWord, puzzle.categories, solved, mistakes, showToast]);

  function shuffleRemaining() {
    setShuffled(prev => shuffle(prev));
  }

  const deselectAll = useCallback(() => {
    setSelected([]);
  }, []);

  const remainingWordsKb = shuffled.filter(w => !solved.includes(categoryByWord[w].color));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      if (e.key === "Enter") {
        if (selected.length === 4) {
          e.preventDefault();
          submitGuess();
        }
        return;
      }
      if (e.key === "Escape") {
        if (selected.length > 0) {
          e.preventDefault();
          deselectAll();
        }
        return;
      }
      if (["1", "2", "3", "4"].includes(e.key)) {
        const rowIdx = parseInt(e.key, 10) - 1;
        const start = rowIdx * 4;
        const row = remainingWordsKb.slice(start, start + 4);
        if (row.length === 0) return;
        e.preventDefault();
        const allSelected = row.every(w => selected.includes(w));
        if (allSelected) {
          setSelected(prev => prev.filter(w => !row.includes(w)));
        } else {
          setSelected(prev => {
            const next = [...prev];
            for (const w of row) {
              if (next.length >= 4) break;
              if (!next.includes(w)) next.push(w);
            }
            return next;
          });
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, selected, remainingWordsKb, submitGuess, deselectAll]);

  const remainingWords = shuffled.filter(w => !solved.includes(categoryByWord[w].color));
  const solvedCategories = solveOrder
    .filter(c => solved.includes(c))
    .map(c => puzzle.categories.find(cat => cat.color === c)!);

  const colourGrid: DifficultyColor[][] = solveOrder.map(c => [c, c, c, c]);
  const shareText = connectionsShareCard({
    dayNumber: puzzleNumber,
    mistakes,
    solved: phase === "won",
    groupColours: colourGrid.length ? colourGrid : [[]],
  });

  const handleShare = () => {
    navigator.clipboard.writeText(shareText)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Couldn't copy"));
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6 flex flex-col min-h-[calc(100dvh-52px)]">
      <PBCelebration
        open={pbOpen}
        onClose={() => setPbOpen(false)}
        value={`${4 - mistakes}/4`}
        label="Solved!"
        gameLabel="Connections"
        shareText={shareText}
      />
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
          <p className="text-xs text-muted">#{puzzleNumber} · {todayStr}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted">Mistakes:</span>
          {Array.from({ length: MAX_MISTAKES }, (_, i) => {
            const lost = i >= MAX_MISTAKES - mistakes;
            const draining = i === drainedDot;
            return (
              <Heart
                key={i}
                size={16}
                strokeWidth={2.4}
                className="transition-all duration-300 ease-out"
                fill={lost ? "transparent" : "#ef4444"}
                style={{
                  color: lost ? "color-mix(in srgb, var(--fg) 25%, transparent)" : "#ef4444",
                  transform: draining ? "scale(0.4)" : "scale(1)",
                  opacity: draining ? 0 : 1,
                }}
              />
            );
          })}
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
            const isSolving = solvingWords.includes(word);
            const targetColor = isSolving && solvingColor ? solvingColor : null;
            return (
              <button
                key={word}
                onClick={() => toggleWord(word)}
                disabled={!!solvingColor}
                className={`rounded-xl py-3.5 px-1 text-center font-bold uppercase tracking-wide transition-all duration-300 ease-out active:scale-95 select-none ${word.length >= 9 ? "text-[11px]" : "text-xs"}`}
                style={{
                  background: targetColor
                    ? COLOR_STYLES[targetColor].bg
                    : isSelected
                      ? "var(--fg)"
                      : "color-mix(in srgb, var(--fg) 8%, var(--surface))",
                  color: targetColor
                    ? COLOR_STYLES[targetColor].text
                    : isSelected
                      ? "var(--bg)"
                      : "var(--fg)",
                  border: "1px solid color-mix(in srgb, var(--fg) 10%, transparent)",
                  transform: isSolving ? "translateY(-4px) scale(1.04)" : isSelected ? "translateY(-2px)" : "none",
                  boxShadow: isSolving ? "0 6px 18px rgba(0,0,0,0.18)" : undefined,
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
            <div className="flex flex-col items-center gap-1 mb-4">
              {colourGrid.map((row, ri) => (
                <div key={ri} className="flex gap-1">
                  {row.map((c, ci) => (
                    <div key={ci} className="h-5 w-5 rounded" style={{ background: COLOR_STYLES[c].bg }} />
                  ))}
                </div>
              ))}
            </div>

            <button
              onClick={handleShare}
              className="w-full rounded-2xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] mb-4"
              style={{ background: "var(--fg)" }}
            >
              Share result
            </button>

            {/* Friends today */}
            <div className="my-4 text-left">
              <FriendsCompare game="connections" date={todayStr} />
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
        {toastMsg && (
          <motion.div
            key={toastMsg}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg"
            style={{ background: "var(--fg)", color: "var(--bg)" }}
          >
            {toastMsg}
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
