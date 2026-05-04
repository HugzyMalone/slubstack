"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { getRandomWord, isValidGuess } from "@/lib/wordle-words";
import { WordleGame, type GamePhase } from "../WordleGame";
import { playWordleTap, playWordleSubmit, playWordleInvalid, playCorrect, playWrong } from "@/lib/sound";

const MAX_GUESSES = 6;
const WORD_LEN = 5;
const HARD_KEY = "slubstack_wordle_hard";

const WIN_MSGS = ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"];

function evaluate(guess: string, solution: string): ("correct" | "present" | "absent")[] {
  const result: ("correct" | "present" | "absent")[] = Array(WORD_LEN).fill("absent");
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

export default function WordlePracticePage() {
  const [solution, setSolution]         = useState<string>("");
  const [guesses, setGuesses]           = useState<string[]>([]);
  const [current, setCurrent]           = useState("");
  const [phase, setPhase]               = useState<GamePhase>("playing");
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [revealedRows, setRevealedRows] = useState<Set<number>>(new Set());
  const [shakingRow, setShakingRow]     = useState<number | null>(null);
  const [toastMsg, setToastMsg]         = useState<string | null>(null);
  const [hardMode, setHardMode]         = useState(false);
  const [round, setRound]               = useState(1);

  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setSolution(getRandomWord());
    try { setHardMode(localStorage.getItem(HARD_KEY) === "1"); } catch {}
  }, []);

  const showToast = useCallback((msg: string, ms = 1800) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), ms);
  }, []);

  const newRound = useCallback(() => {
    setSolution(getRandomWord());
    setGuesses([]);
    setCurrent("");
    setPhase("playing");
    setRevealingRow(null);
    setRevealedRows(new Set());
    setShakingRow(null);
    setToastMsg(null);
    setRound((r) => r + 1);
  }, []);

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

    setTimeout(() => {
      setRevealedRows((prev) => new Set([...prev, rowIdx]));
      setRevealingRow(null);

      const won = word === solution;
      const lost = !won && newGuesses.length >= MAX_GUESSES;
      const newPhase: GamePhase = won ? "won" : lost ? "lost" : "playing";

      if (newPhase !== "playing") {
        setPhase(newPhase);
        if (won) {
          playCorrect();
          showToast(WIN_MSGS[Math.min(rowIdx, WIN_MSGS.length - 1)], 2500);
        } else {
          playWrong();
          showToast(`The word was ${solution}`, 3000);
        }
      }
    }, 600 + 80);
  }, [current, guesses, revealingRow, solution, showToast, hardMode]);

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

  if (!solution) return null;

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

  return (
    <div
      key={round}
      className="flex flex-col select-none overflow-hidden"
      style={{
        height: "calc(100dvh - 52px - env(safe-area-inset-top, 0px))",
        background:
          "radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--game) 14%, transparent) 0%, transparent 55%), radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 60%)",
      }}
    >
      <div className="shrink-0 flex items-center justify-between px-4 py-2">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-xl font-black tracking-widest" style={{ color: "var(--game)" }}>WORDLE</h1>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: "var(--game)" }}>Practice</span>
        </div>
        <div className="flex items-center gap-2">
          {hardMode && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ background: "#c9b458" }}>Hard</span>
          )}
          {phase !== "playing" ? (
            <button
              onClick={newRound}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-white"
              style={{ background: "var(--game)" }}
            >
              <RotateCcw size={12} />
              New word
            </button>
          ) : (
            <Link
              href="/brain-training/wordle"
              className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-fg transition-colors"
            >
              Daily
            </Link>
          )}
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
