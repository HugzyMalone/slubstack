"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Flame, Trophy } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { brainTrainingStore, triviaStore } from "@/lib/store";
import { awardQuestProgress } from "@/lib/questsStore";
import { pushLeagueXp } from "@/lib/leagues";
import { buildShareCard } from "@/lib/share";
import { track } from "@/lib/analytics";
import { ShareButton } from "@/components/games/ShareButton";
import type { ScoreResult } from "@/lib/multiplayer/types";
import { getDailyAdapter } from "@/lib/games/daily";

type Phase = "ready" | "countdown" | "playing" | "submitting" | "done";

const GAME_MS = 30_000;

type Props = {
  gameKind: string;
  level: number;
  seed: string;
  date: string;
  alreadyPlayed: boolean;
  initialStreak: number;
};

export function DailyRunner({ gameKind, level, seed, date, alreadyPlayed, initialStreak }: Props) {
  const router = useRouter();
  const adapter = getDailyAdapter(gameKind)!;

  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [played, setPlayed] = useState(alreadyPlayed);
  const [streak, setStreak] = useState(initialStreak);

  const [countNum, setCountNum] = useState(3);

  const [questions, setQuestions] = useState<unknown[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<ScoreResult | null>(null);
  const [remainingMs, setRemainingMs] = useState(GAME_MS);
  const [dispScore, setDispScore] = useState(0);

  const [rank, setRank] = useState<number | null>(null);
  const [shareText, setShareText] = useState("");

  const liveRef = useRef({ score: 0, correct: 0 });
  const historyRef = useRef<("correct" | "wrong")[]>([]);
  const inFeedbackRef = useRef(false);
  const gameActiveRef = useRef(false);
  const submittedRef = useRef(false);
  const playStartRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const store = adapter.storeKey === "trivia" ? triviaStore : brainTrainingStore;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthChecked(true);
      setSignedIn(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session?.user);
      setAuthChecked(true);
    });
  }, []);

  const submitResult = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const { score, correct } = liveRef.current;

    const xpAward = adapter.xpFor(correct, score);
    if (xpAward > 0) {
      store.getState().addXp(xpAward);
      awardQuestProgress("xp", xpAward);
      if (correct > 0) awardQuestProgress("correct", correct);
      pushLeagueXp(xpAward);
    }

    setPhase("submitting");

    const text = buildShareCard({
      title: `Slubstack Daily · ${adapter.displayName} · ${date}`,
      score,
      correct,
      total: historyRef.current.length,
      history: historyRef.current,
    });
    setShareText(text);

    try {
      const res = await fetch("/api/daily/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, correct }),
      });
      if (res.ok) {
        const data = (await res.json()) as { rank: number; streak: number };
        setRank(data.rank);
        setStreak(data.streak);
      }
    } catch {
      // network failure — still show the local result + share card
    }
    setPlayed(true);
    setPhase("done");
    track("first_game_complete", { game: gameKind });
  }, [adapter, store, date, gameKind]);

  const endGame = useCallback(() => {
    if (!gameActiveRef.current) return;
    gameActiveRef.current = false;
    adapter.onGameEnd?.();
    void submitResult();
  }, [adapter, submitResult]);

  const startCountdown = useCallback(() => {
    liveRef.current = { score: 0, correct: 0 };
    historyRef.current = [];
    submittedRef.current = false;
    setDispScore(0);
    setPhase("countdown");
  }, []);

  useEffect(() => {
    if (phase !== "countdown") return;
    setCountNum(3);
    let n = 3;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const step = () => {
      n--;
      setCountNum(n);
      if (n > 0) {
        timeouts.push(setTimeout(step, 600));
      } else {
        timeouts.push(setTimeout(() => {
          const qs = adapter.generateQuestions(level, seed);
          setQuestions(qs);
          setQuestionIndex(0);
          setRemainingMs(GAME_MS);
          gameActiveRef.current = true;
          playStartRef.current = Date.now();
          setPhase("playing");
        }, 600));
      }
    };
    timeouts.push(setTimeout(step, 600));
    return () => timeouts.forEach(clearTimeout);
  }, [phase, adapter, level, seed]);

  useEffect(() => {
    if (phase !== "playing") return;
    const iv = setInterval(() => {
      const elapsed = Date.now() - playStartRef.current;
      const remaining = Math.max(0, GAME_MS - elapsed);
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearInterval(iv);
        if (gameActiveRef.current) endGame();
      }
    }, 250);
    return () => clearInterval(iv);
  }, [phase, endGame]);

  useEffect(() => {
    if (phase === "playing" && questions.length > 0 && questionIndex >= questions.length) {
      endGame();
    }
  }, [phase, questionIndex, questions.length, endGame]);

  const handleAnswer = useCallback((answer: unknown) => {
    if (inFeedbackRef.current || phaseRef.current !== "playing") return;
    const q = questions[questionIndex];
    if (q === undefined) return;

    inFeedbackRef.current = true;
    const result = adapter.scoring(answer, q);
    adapter.onFeedback?.(result);
    const live = liveRef.current;
    live.score += result.points;
    if (result.correct) live.correct++;
    historyRef.current.push(result.correct ? "correct" : "wrong");
    setDispScore(live.score);
    setFeedback(result);

    setTimeout(() => {
      setFeedback(null);
      inFeedbackRef.current = false;
      setQuestionIndex((i) => i + 1);
    }, result.correct ? 300 : 700);
  }, [adapter, questions, questionIndex]);

  if (!authChecked) {
    return <div className="mx-auto max-w-md px-4 pt-12 text-center text-sm text-muted">Loading…</div>;
  }

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-md px-4 pt-10 pb-8">
        <h1 className="text-2xl font-bold tracking-tight">Daily Challenge</h1>
        <p className="mt-2 text-sm text-muted">One game a day, the same for everyone. Sign in to play and build your streak.</p>
        <button
          onClick={() => router.push("/stats")}
          className="mt-6 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: "var(--accent)" }}
        >
          Sign in to play
        </button>
        <button
          onClick={() => router.push("/")}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium"
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg">
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
              <span className="text-[120px] font-black leading-none" style={{ color: "var(--accent)" }}>{countNum}</span>
            ) : (
              <span className="text-6xl font-black" style={{ color: "var(--accent)" }}>Go!</span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg">
        <div className="text-sm text-muted">Finalising…</div>
      </div>
    );
  }

  if (phase === "playing") {
    const currentQuestion = questions[questionIndex];
    if (currentQuestion === undefined) {
      return <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg text-sm text-muted">Loading…</div>;
    }
    const PlayBoard = adapter.PlayBoard;
    const secs = Math.ceil(remainingMs / 1000);
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-bg">
        <div className="flex items-center justify-between px-4 py-2 text-sm font-bold">
          <span className="tabular-nums" style={{ color: "var(--accent)" }}>{dispScore}</span>
          <span className="tabular-nums text-muted">{secs}s</span>
        </div>
        <div className="flex-1 min-h-0">
          <PlayBoard
            question={currentQuestion}
            remainingMs={remainingMs}
            feedback={feedback}
            onAnswerAction={handleAnswer}
          />
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const { score, correct } = liveRef.current;
    return (
      <div className="mx-auto max-w-md px-4 pt-8 pb-10">
        <div className="rounded-3xl border border-border bg-surface p-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-sm font-bold text-orange-500">
            <Flame size={16} /> {streak}-day streak
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight">{adapter.displayName}</h1>
          <p className="text-sm text-muted">Daily Challenge · {date}</p>
          <div className="mt-6 flex items-center justify-center gap-8">
            <div>
              <div className="text-3xl font-black" style={{ color: "var(--accent)" }}>{score}</div>
              <div className="text-xs uppercase tracking-wide text-muted">Score</div>
            </div>
            <div>
              <div className="text-3xl font-black">{correct}</div>
              <div className="text-xs uppercase tracking-wide text-muted">Correct</div>
            </div>
            {rank !== null && (
              <div>
                <div className="flex items-center justify-center gap-1 text-3xl font-black">
                  <Trophy size={22} /> {rank}
                </div>
                <div className="text-xs uppercase tracking-wide text-muted">Rank</div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4">
          <ShareButton text={shareText} label="Share your result" />
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium"
        >
          <ArrowLeft size={15} /> Back to home
        </button>
      </div>
    );
  }

  // phase === "ready"
  return (
    <div className="mx-auto max-w-md px-4 pt-8 pb-10">
      <button
        onClick={() => router.push("/")}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </button>
      <div className="rounded-3xl border border-border bg-surface p-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-sm font-bold text-orange-500">
          <Flame size={16} /> {streak}-day streak
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight">Daily Challenge</h1>
        <p className="mt-1 text-sm text-muted">{date}</p>
        <p className="mt-4 text-base font-bold">{adapter.displayName}</p>
        <p className="text-sm text-muted">Same game, same questions for everyone. One attempt — 30 seconds against the clock.</p>
        {played ? (
          <div className="mt-6 rounded-2xl border border-border py-4 text-sm font-bold text-muted">
            Played today ✓ — come back tomorrow
          </div>
        ) : (
          <button
            onClick={startCountdown}
            className="mt-6 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: "var(--accent)" }}
          >
            Play today&apos;s challenge
          </button>
        )}
      </div>
    </div>
  );
}
