"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ActorData } from "@/app/trivia/actors/page";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type GameState = "lobby" | "countdown" | "playing" | "results";
type Feedback = "correct" | "wrong" | null;

interface HistoryEntry {
  name: string;
  image: string;
  correct: boolean;
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
  const timeMode = 10;
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
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

  useEffect(() => {
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
    setStreak(0);
    setBestStreak(0);
    setTotal(0);
    setTimeLeft(10);
    setSelected(null);
    setFeedback(null);
    setHistory([]);
    setAdvancing(false);
    setCountdown(3);
    setGameState("countdown");
  }, [actors, timeMode]);

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
    if (timeLeft <= 0) { setGameState("results"); return; }
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

  const handleAnswer = useCallback(
    (option: string) => {
      if (selected !== null || !currentActor || advancing) return;
      const isCorrect = option === currentActor.name;
      setSelected(option);
      setFeedback(isCorrect ? "correct" : "wrong");
      setTotal((t) => t + 1);
      setHistory((h) => [...h, { name: currentActor.name, image: currentActor.image, correct: isCorrect }]);
      if (isCorrect) {
        setScore((s) => s + 1);
        setStreak((s) => { const ns = s + 1; setBestStreak((bs) => Math.max(bs, ns)); return ns; });
        setTimeout(advance, 300);
      } else {
        setStreak(0);
        setTimeout(advance, 700);
      }
    },
    [selected, currentActor, advancing, advance]
  );

  const shareResult = useCallback(() => {
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    const streakEmoji = bestStreak >= 5 ? "🔥" : bestStreak >= 3 ? "⚡" : "✨";
    const text = `🎬 Actor Blitz — ${score} correct in 10s!\nAccuracy: ${accuracy}% | Best streak: ${bestStreak} ${streakEmoji}\nCan you beat me? slubstack.com/trivia/actors`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [score, total, bestStreak]);

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (gameState === "lobby") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 pb-24 pt-10 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h1 className="text-3xl font-bold tracking-tight">Actor Blitz</h1>
        <p className="mt-2 text-muted text-sm leading-relaxed">
          How many movie stars can you identify? Guess as many as you can before time runs out!
        </p>

        <div className="mt-8 w-full rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-black" style={{ color: "var(--game)" }}>10s</span>
            <span className="text-sm text-muted font-medium">time limit</span>
          </div>
          <div className="space-y-2 text-left text-sm text-muted">
            <div className="flex items-center gap-2"><span className="text-base">📸</span><span>Real photos — some might look a little different!</span></div>
            <div className="flex items-center gap-2"><span className="text-base">⚡</span><span>Pick fast — time keeps ticking</span></div>
            <div className="flex items-center gap-2"><span className="text-base">🏆</span><span>Share your score and challenge friends</span></div>
          </div>
        </div>

        <button
          onClick={startGame}
          disabled={actors.length === 0}
          className="mt-6 w-full rounded-2xl py-4 text-base font-bold text-white transition-colors duration-150 active:scale-[0.97] disabled:opacity-50"
          style={{ background: "var(--game)" }}
        >
          {actors.length === 0 ? "Loading actors…" : "Let's Go! →"}
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
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    const grade =
      accuracy >= 90 ? "🏆 Incredible!" : accuracy >= 75 ? "⭐ Great job!" : accuracy >= 55 ? "💪 Not bad!" : "🎬 Keep practising!";

    return (
      <div className="mx-auto max-w-md px-4 pb-24 pt-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🎬</div>
          <div className="text-4xl font-black" style={{ color: "var(--game)" }}>
            {score}<span className="text-xl font-semibold text-muted"> / {total}</span>
          </div>
          <div className="text-lg font-semibold mt-1">{grade}</div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Correct", value: String(score) },
            { label: "Accuracy", value: `${accuracy}%` },
            { label: "Best streak", value: `🔥 ${bestStreak}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-border bg-surface p-3 text-center">
              <div className="text-lg font-bold">{value}</div>
              <div className="text-xs text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <button onClick={shareResult} className="flex-1 rounded-2xl border border-border bg-surface py-3 text-sm font-semibold transition-colors duration-100 active:scale-[0.97]">
            {copied ? "✅ Copied!" : "📋 Copy score"}
          </button>
          <button onClick={startGame} className="flex-1 rounded-2xl py-3 text-sm font-bold text-white transition-colors duration-100 active:scale-[0.97]" style={{ background: "var(--game)" }}>
            Play again
          </button>
        </div>

        {history.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">How you did</div>
            <div className="flex flex-col gap-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.image} alt={h.name} className="h-10 w-10 shrink-0 rounded-lg object-cover object-top" />
                  <div className="min-w-0 flex-1 text-sm font-medium truncate">{h.name}</div>
                  <div className="text-base shrink-0">{h.correct ? "✅" : "❌"}</div>
                </div>
              ))}
            </div>
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

  const timerPct = (timeLeft / timeMode) * 100;
  const timerColor = timeLeft <= 3 ? "#e11d48" : timeLeft <= 6 ? "#f97316" : "var(--game)";

  return (
    <div className="flex flex-col h-[calc(100dvh-56px-60px)] lg:h-[calc(100dvh-56px)] max-w-md mx-auto px-4 pt-3 pb-3 select-none">
      {/* Timer bar + stats */}
      <div className="shrink-0 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-black" style={{ color: timerColor }}>{timeLeft}s</span>
          <div className="flex items-center gap-3">
            {streak >= 2 && <span className="text-xs font-bold" style={{ color: "#f97316" }}>🔥 {streak}</span>}
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
        {/* Skeleton shown while loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-border" />
        )}
        {/* Fallback on error */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted">
            🎬
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentActor.image}
          alt="Who is this?"
          className="absolute inset-0 h-full w-full object-cover object-top"
          fetchPriority="high"
          decoding="async"
          ref={(el) => { if (el?.complete && !el.naturalWidth) setImageError(true); else if (el?.complete) setImageLoaded(true); }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{ opacity: imageLoaded ? 1 : 0, transition: "opacity 0.15s ease" }}
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
