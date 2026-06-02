"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Radar, Flame, Snowflake, Trophy, ArrowLeft } from "lucide-react";
import { getTodayStr, getDayIndex } from "@/lib/wordle-words";
import { getSecretForDate } from "@/lib/games/semantle/data";
import { buildShareCard, shareOrCopy } from "@/lib/share";

interface Guess {
  word: string;
  similarity: number;
  rank: number | null;
}

interface Saved {
  date: string;
  guesses: Guess[];
  won: boolean;
  gaveUp: boolean;
}

const STORAGE_KEY = "slubstack_semantle";

function loadSaved(today: string): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    return parsed.date === today ? parsed : null;
  } catch {
    return null;
  }
}

function save(state: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function proximity(g: Guess): { label: string; colour: string } {
  if (g.rank !== null) {
    return { label: `#${g.rank} / 300 nearest`, colour: "#f97316" };
  }
  if (g.similarity >= 40) return { label: "warm", colour: "#fb923c" };
  if (g.similarity >= 25) return { label: "tepid", colour: "#facc15" };
  return { label: "cold", colour: "#60a5fa" };
}

function barWidth(g: Guess): number {
  if (g.rank !== null) {
    return Math.max(20, 100 - (g.rank / 300) * 80);
  }
  return Math.max(4, Math.min(18, g.similarity));
}

export function Semantle() {
  const today = useMemo(() => getTodayStr(), []);
  const dayIdx = useMemo(() => getDayIndex(today), [today]);
  const secret = useMemo(() => getSecretForDate(today), [today]);

  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [input, setInput] = useState("");
  const [won, setWon] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadSaved(today);
    if (saved) {
      setGuesses(saved.guesses);
      setWon(saved.won);
      setGaveUp(saved.gaveUp);
    }
    setHydrated(true);
  }, [today]);

  useEffect(() => {
    if (!hydrated) return;
    save({ date: today, guesses, won, gaveUp });
  }, [hydrated, today, guesses, won, gaveUp]);

  const finished = won || gaveUp;

  const sorted = useMemo(
    () => [...guesses].sort((a, b) => b.similarity - a.similarity),
    [guesses],
  );
  const best = sorted[0]?.word ?? null;

  const submit = useCallback(async () => {
    const word = input.trim().toLowerCase();
    if (!word || busy || finished) return;
    if (!/^[a-z]+$/.test(word)) {
      toast.error("Letters only");
      return;
    }
    if (guesses.some((g) => g.word === word)) {
      toast("Already guessed", { icon: "🔁" });
      setInput("");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/semantle/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, guess: word }),
      });
      const data = (await res.json()) as {
        similarity: number;
        rank: number | null;
        valid: boolean;
        win: boolean;
      };
      if (!data.valid) {
        toast.error("Not in word list");
        return;
      }
      setGuesses((prev) => [...prev, { word, similarity: data.similarity, rank: data.rank }]);
      setLatest(word);
      setInput("");
      if (data.win) {
        setWon(true);
        toast.success("You got it!");
      }
    } catch {
      toast.error("Couldn't reach the oracle");
    } finally {
      setBusy(false);
    }
  }, [input, busy, finished, guesses, today]);

  const giveUp = useCallback(() => {
    setGaveUp(true);
  }, []);

  const shareText = useMemo(
    () =>
      buildShareCard({
        title: `Slubstack Semantle #${dayIdx + 1}`,
        correct: won ? guesses.length : undefined,
        footerTag: won
          ? `Solved in ${guesses.length} guesses · slubstack.com`
          : "slubstack.com",
      }),
    [dayIdx, won, guesses.length],
  );

  const onShare = useCallback(async () => {
    const result = await shareOrCopy(shareText);
    if (result === "copied") toast.success("Copied to clipboard");
    else if (result === "failed") toast.error("Couldn't share");
  }, [shareText]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-3 select-none">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/brain-training"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-fg"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Radar size={20} style={{ color: "var(--game)" }} />
          <h1 className="font-display text-2xl font-black tracking-wider" style={{ color: "var(--game)" }}>
            SEMANTLE
          </h1>
        </div>
        <span className="font-display text-[13px] font-extrabold text-muted">#{dayIdx + 1}</span>
      </div>

      <p className="mb-3 text-center text-xs text-muted">
        Guess the secret word. Each guess scores how semantically close you are.
      </p>

      {!finished && (
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Type a word…"
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-[var(--game)]"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "var(--game)" }}
          >
            Guess
          </button>
        </form>
      )}

      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
            style={{ boxShadow: "var(--shadow-panel)" }}
          >
            <Trophy size={22} className="text-amber-500" />
            <div className="text-sm">
              <div className="font-bold">Solved in {guesses.length} guesses!</div>
              <div className="text-muted">The word was <span className="font-bold uppercase">{secret}</span>.</div>
            </div>
          </motion.div>
        )}
        {gaveUp && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl border border-border bg-surface p-4 text-sm"
          >
            The word was <span className="font-bold uppercase">{secret}</span>.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-1.5">
        {sorted.map((g) => {
          const prox = proximity(g);
          const isBest = g.word === best && !finished;
          const isLatest = g.word === latest;
          return (
            <motion.div
              key={g.word}
              layout
              initial={isLatest ? { opacity: 0, scale: 0.97 } : false}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-xl border px-3 py-2.5"
              style={{
                borderColor: isBest ? "var(--game)" : "var(--border)",
                background: "var(--surface)",
              }}
            >
              <div
                className="absolute inset-y-0 left-0 opacity-15"
                style={{ width: `${barWidth(g)}%`, background: prox.colour }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 font-semibold">
                  {g.rank !== null ? (
                    <Flame size={13} style={{ color: prox.colour }} />
                  ) : (
                    <Snowflake size={13} style={{ color: prox.colour }} />
                  )}
                  {g.word}
                </span>
                <span className="flex items-center gap-2 text-xs">
                  <span className="font-bold tabular-nums">{g.similarity.toFixed(1)}</span>
                  <span className="text-muted">{prox.label}</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {guesses.length === 0 && !finished && (
        <p className="mt-8 text-center text-sm text-muted">No guesses yet. Warmer = closer in meaning.</p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {finished ? (
          <button
            onClick={onShare}
            className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: "var(--game)" }}
          >
            Share result
          </button>
        ) : (
          guesses.length > 0 && (
            <button
              onClick={giveUp}
              className="w-full rounded-2xl border border-border bg-surface py-3 text-sm font-semibold text-muted transition-colors hover:text-fg"
            >
              Give up
            </button>
          )
        )}
      </div>
    </div>
  );
}
