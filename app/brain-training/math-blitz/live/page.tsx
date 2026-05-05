"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ArrowLeft } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { brainTrainingStore } from "@/lib/store";
import { awardQuestProgress } from "@/lib/questsStore";
import { pushLeagueXp } from "@/lib/leagues";
import { playMathCorrect, playMathWrong, playMathFinish } from "@/lib/sound";
import {
  mulberry32,
  makeQuestion,
  type Level,
  type Question,
  type RNG,
} from "@/lib/math-blitz/engine";
import { simulateBotTimeline, type BotTickEvent } from "@/lib/math-blitz/bot";
import { QueueRoom, type QueueSlot } from "@/components/live-math/QueueRoom";
import { LiveScoreTicker, type TickerPlayer } from "@/components/live-math/LiveScoreTicker";
import { Podium, type PodiumPlayer } from "@/components/live-math/Podium";

type Phase = "auth" | "select" | "queue" | "countdown" | "playing" | "submitting" | "result";

const GAME_MS = 30_000;
const GAME_SECS = 30;
const QUEUE_GRACE_MS = 5_000;

const LEVEL_META: Record<Level, { label: string; desc: string; color: string }> = {
  1: { label: "Level 1", desc: "Add & subtract · numbers to 10", color: "#10b981" },
  2: { label: "Level 2", desc: "All operations · numbers to 20", color: "#f59e0b" },
  3: { label: "Level 3", desc: "All operations · numbers to 50", color: "#e11d48" },
};

function calcPoints(elapsedMs: number, streak: number): number {
  const speed = elapsedMs < 3000 ? 5 : elapsedMs < 5000 ? 3 : 0;
  const mult = streak >= 10 ? 3 : streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
  return Math.round((10 + speed) * mult);
}

function TimerRing({ secs, total }: { secs: number; total: number }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - secs / total);
  const color = secs <= 5 ? "#e11d48" : secs <= 10 ? "#f59e0b" : "var(--accent)";
  return (
    <svg width="78" height="78" viewBox="0 0 78 78" className="select-none">
      <circle cx="39" cy="39" r={R} fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle
        cx="39"
        cy="39"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={C}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "39px 39px",
          transition: "stroke-dashoffset 0.95s linear, stroke 0.4s",
        }}
      />
      <text
        x="39"
        y="44"
        textAnchor="middle"
        style={{ fontSize: 18, fontWeight: 700, fill: color, fontVariantNumeric: "tabular-nums", transition: "fill 0.4s" }}
      >
        {secs}
      </text>
    </svg>
  );
}

type MatchPlayerResp = {
  slot: number;
  userId: string | null;
  isBot: boolean;
  displayName: string;
  avatarUrl: string | null;
  score: number | null;
  correct: number | null;
  rank: number | null;
  eloBefore: number | null;
  eloAfter: number | null;
};

type ResultResp = {
  matchId: string;
  status: "waiting" | "playing" | "finished" | "abandoned";
  level: Level;
  players: MatchPlayerResp[];
};

type QueueAlloc = {
  matchId: string;
  seed: string;
  level: Level;
  slotIndex: number;
};

type PresenceMeta = {
  slotIndex: number;
  displayName: string;
  avatarUrl: string | null;
  userId: string;
};

type TickPayload = { slot: number; score: number };

const PAD_ROWS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["−", "0", "⌫"],
];

export default function LiveMathBlitzPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("auth");
  const [level, setLevel] = useState<Level>(1);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ displayName: string; avatarUrl: string | null } | null>(null);

  const [alloc, setAlloc] = useState<QueueAlloc | null>(null);
  const [queueSecs, setQueueSecs] = useState(QUEUE_GRACE_MS / 1000);
  const [presenceSlots, setPresenceSlots] = useState<Record<number, PresenceMeta>>({});

  const [countNum, setCountNum] = useState(3);

  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [secsLeft, setSecsLeft] = useState(GAME_SECS);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [opponentScores, setOpponentScores] = useState<Record<number, number>>({});
  const [botScores, setBotScores] = useState<Record<number, number>>({});
  const [finalResult, setFinalResult] = useState<ResultResp | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const rngRef = useRef<RNG | null>(null);
  const liveRef = useRef({ score: 0, streak: 0, correct: 0, wrong: 0 });
  const [dispScore, setDispScore] = useState(0);
  const qStartRef = useRef(0);
  const inFeedbackRef = useRef(false);
  const gameActiveRef = useRef(false);
  const submittedRef = useRef(false);
  const botTimelinesRef = useRef<Record<number, BotTickEvent[]>>({});
  const playStartRef = useRef(0);
  const allocRef = useRef<QueueAlloc | null>(null);

  // ── Auth gate ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthChecked(true);
      setSignedIn(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSignedIn(true);
        setUserId(data.session.user.id);
        const meta = data.session.user.user_metadata as { username?: string; avatar_url?: string };
        const cachedName = typeof window !== "undefined" ? localStorage.getItem("slubstack_username") : null;
        const cachedAvatar = typeof window !== "undefined" ? localStorage.getItem("slubstack_avatar") : null;
        setProfile({
          displayName: cachedName ?? meta.username ?? `learner-${data.session.user.id.slice(0, 8)}`,
          avatarUrl: cachedAvatar ?? meta.avatar_url ?? null,
        });
        setPhase("select");
      } else {
        setSignedIn(false);
        setPhase("auth");
      }
      setAuthChecked(true);
    });
  }, []);

  // ── Channel cleanup helper ────────────────────────────────────────────────

  const teardownChannel = useCallback(() => {
    const ch = channelRef.current;
    if (ch) {
      const supabase = getSupabaseBrowserClient();
      ch.unsubscribe();
      if (supabase) supabase.removeChannel(ch);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      teardownChannel();
      gameActiveRef.current = false;
    };
  }, [teardownChannel]);

  // ── Submit final score ────────────────────────────────────────────────────

  const submitResult = useCallback(async (a: QueueAlloc) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const { score, correct } = liveRef.current;

    if (correct > 0) {
      brainTrainingStore.getState().addXp(correct * 5);
      awardQuestProgress("xp", correct * 5);
      awardQuestProgress("correct", correct);
      pushLeagueXp(correct * 5);
    }
    playMathFinish();

    setPhase("submitting");

    try {
      const res = await fetch(`/api/live-math/match/${a.matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, correct }),
      });
      const data = (await res.json()) as ResultResp | { error: string };
      if ("error" in data) {
        console.error("[LiveMath] result POST failed:", data.error);
        setPhase("select");
        return;
      }
      if (data.status === "finished") {
        setFinalResult(data);
        setPhase("result");
      } else {
        // Other humans haven't reported. Poll once more after a short delay.
        setTimeout(async () => {
          const retry = await fetch(`/api/live-math/match/${a.matchId}/result`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score, correct }),
          });
          const retryData = (await retry.json()) as ResultResp | { error: string };
          if ("error" in retryData) {
            console.error("[LiveMath] result retry failed:", retryData.error);
            setPhase("select");
            return;
          }
          setFinalResult(retryData);
          setPhase("result");
        }, 3500);
      }
    } catch (err) {
      console.error("[LiveMath] result POST error:", err);
      setPhase("select");
    }
  }, []);

  // ── End game (time up) ────────────────────────────────────────────────────

  const endGame = useCallback(() => {
    if (!gameActiveRef.current) return;
    gameActiveRef.current = false;
    const a = allocRef.current;
    if (!a) return;
    void submitResult(a);
  }, [submitResult]);

  // ── Spawn next question ───────────────────────────────────────────────────

  const spawnQuestion = useCallback(() => {
    if (!rngRef.current || !allocRef.current) return;
    const q = makeQuestion(allocRef.current.level, rngRef.current);
    setQuestion(q);
    setAnswer("");
    inFeedbackRef.current = false;
    qStartRef.current = Date.now();
  }, []);

  // ── Start countdown → playing ─────────────────────────────────────────────

  const startCountdown = useCallback(() => {
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
          // Reset live state, RNG, bot timelines.
          liveRef.current = { score: 0, streak: 0, correct: 0, wrong: 0 };
          setDispScore(0);
          setOpponentScores({});
          submittedRef.current = false;

          const a = allocRef.current;
          if (!a) return;
          rngRef.current = mulberry32(a.seed);

          // Determine bot slots: any slot not in presenceSlots
          const occupied = new Set(Object.keys(presenceSlots).map(Number));
          const botMap: Record<number, BotTickEvent[]> = {};
          const botInitial: Record<number, number> = {};
          for (let s = 0; s < 4; s++) {
            if (!occupied.has(s)) {
              botMap[s] = simulateBotTimeline(a.seed, a.level, GAME_MS, s);
              botInitial[s] = 0;
            }
          }
          botTimelinesRef.current = botMap;
          setBotScores(botInitial);

          setSecsLeft(GAME_SECS);
          gameActiveRef.current = true;
          playStartRef.current = Date.now();
          setPhase("playing");
        }, 600));
      }
    };
    timeouts.push(setTimeout(step, 600));
    return () => timeouts.forEach(clearTimeout);
  }, [phase, presenceSlots]);

  // ── Playing phase: spawn first question, run timers ───────────────────────

  useEffect(() => {
    if (phase !== "playing") return;
    spawnQuestion();

    const tickIv = setInterval(() => {
      setSecsLeft((s) => {
        if (s <= 1) {
          clearInterval(tickIv);
          if (gameActiveRef.current) endGame();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    const broadcastIv = setInterval(() => {
      const ch = channelRef.current;
      const a = allocRef.current;
      if (!ch || !a) return;
      ch.send({
        type: "broadcast",
        event: "tick",
        payload: { slot: a.slotIndex, score: liveRef.current.score } satisfies TickPayload,
      });
    }, 750);

    const botIv = setInterval(() => {
      const elapsed = Date.now() - playStartRef.current;
      const timelines = botTimelinesRef.current;
      const next: Record<number, number> = {};
      for (const slotStr of Object.keys(timelines)) {
        const slot = Number(slotStr);
        const events = timelines[slot];
        let acc = 0;
        for (const e of events) {
          if (e.atMs <= elapsed) acc += e.scoreDelta;
          else break;
        }
        next[slot] = acc;
      }
      setBotScores(next);
    }, 200);

    return () => {
      clearInterval(tickIv);
      clearInterval(broadcastIv);
      clearInterval(botIv);
    };
  }, [phase, spawnQuestion, endGame]);

  // ── Answer submission ─────────────────────────────────────────────────────

  function submitAnswer() {
    if (!question || inFeedbackRef.current || phase !== "playing") return;
    const parsed = parseInt(answer.trim(), 10);
    if (isNaN(parsed)) return;

    inFeedbackRef.current = true;
    const elapsed = Date.now() - qStartRef.current;
    const g = liveRef.current;
    const isCorrect = parsed === question.answer;

    if (isCorrect) {
      const pts = calcPoints(elapsed, g.streak);
      g.score += pts;
      g.streak++;
      g.correct++;
      setDispScore(g.score);
      setFeedback("correct");
      playMathCorrect();
      setTimeout(() => {
        setFeedback(null);
        if (gameActiveRef.current) spawnQuestion();
      }, 300);
    } else {
      g.streak = 0;
      g.wrong++;
      setFeedback("wrong");
      playMathWrong();
      setTimeout(() => {
        setFeedback(null);
        if (gameActiveRef.current) spawnQuestion();
      }, 700);
    }
  }

  function padPress(key: string) {
    if (inFeedbackRef.current || phase !== "playing") return;
    if (key === "⌫") setAnswer((a) => a.slice(0, -1));
    else if (key === "−") setAnswer((a) => (a.startsWith("-") ? a.slice(1) : a.length ? "-" + a : "-"));
    else setAnswer((a) => (a.length < 4 ? a + key : a));
  }

  // ── Enter queue ───────────────────────────────────────────────────────────

  const enterQueue = useCallback(async (chosenLevel: Level) => {
    if (!profile || !userId) return;
    setLevel(chosenLevel);
    setPhase("queue");
    setPresenceSlots({});
    setQueueSecs(QUEUE_GRACE_MS / 1000);

    let res: Response;
    try {
      res = await fetch("/api/live-math/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: chosenLevel }),
      });
    } catch (err) {
      console.error("[LiveMath] match POST failed:", err);
      setPhase("select");
      return;
    }
    if (!res.ok) {
      console.error("[LiveMath] match POST status:", res.status);
      setPhase("select");
      return;
    }
    const data = (await res.json()) as QueueAlloc;
    setAlloc(data);
    allocRef.current = data;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setPhase("select");
      return;
    }

    teardownChannel();

    const channel = supabase.channel(`live-math:${data.matchId}`, {
      config: { presence: { key: String(data.slotIndex) } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceMeta>();
      const next: Record<number, PresenceMeta> = {};
      for (const key of Object.keys(state)) {
        const slot = Number(key);
        const metas = state[key];
        if (metas && metas.length > 0) next[slot] = metas[0];
      }
      setPresenceSlots(next);
    });

    channel.on("broadcast", { event: "tick" }, ({ payload }) => {
      const p = payload as TickPayload;
      if (typeof p?.slot !== "number" || typeof p?.score !== "number") return;
      if (p.slot === data.slotIndex) return;
      setOpponentScores((prev) => ({ ...prev, [p.slot]: p.score }));
    });

    channel.on("broadcast", { event: "go" }, () => {
      if (phaseRef.current === "queue") startCountdown();
    });

    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "live_math_matches", filter: `id=eq.${data.matchId}` },
      ({ new: row }) => {
        const r = row as { status?: string };
        if (r.status === "finished" && !submittedRef.current && allocRef.current) {
          gameActiveRef.current = false;
          void submitResult(allocRef.current);
        }
      },
    );

    channel.subscribe();
    await channel.track({
      slotIndex: data.slotIndex,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      userId,
    } satisfies PresenceMeta);

    channelRef.current = channel;
  }, [profile, userId, teardownChannel, startCountdown, submitResult]);

  // phase ref so broadcast handler reads fresh value
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Queue countdown ───────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "queue" || !alloc) return;
    setQueueSecs(QUEUE_GRACE_MS / 1000);
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, QUEUE_GRACE_MS - elapsed);
      setQueueSecs(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        clearInterval(iv);
        // Slot 0 broadcasts 'go' for sync across clients; every client also
        // transitions locally when their own timer expires, so we don't get
        // stuck if slot 0 disconnected.
        if (alloc.slotIndex === 0) {
          const ch = channelRef.current;
          if (ch) ch.send({ type: "broadcast", event: "go", payload: {} });
        }
        if (phaseRef.current === "queue") startCountdown();
      }
    }, 200);
    return () => clearInterval(iv);
  }, [phase, alloc, startCountdown]);

  // Auto-start when queue full
  useEffect(() => {
    if (phase !== "queue" || !alloc) return;
    if (Object.keys(presenceSlots).length >= 4 && alloc.slotIndex === 0) {
      const ch = channelRef.current;
      if (ch) ch.send({ type: "broadcast", event: "go", payload: {} });
      startCountdown();
    }
  }, [phase, alloc, presenceSlots, startCountdown]);

  // ── Reset / Play again ────────────────────────────────────────────────────

  const resetToSelect = useCallback(() => {
    teardownChannel();
    gameActiveRef.current = false;
    submittedRef.current = false;
    setAlloc(null);
    allocRef.current = null;
    setFinalResult(null);
    setPresenceSlots({});
    setOpponentScores({});
    setBotScores({});
    setQuestion(null);
    setAnswer("");
    setPhase("select");
  }, [teardownChannel]);

  const playAgain = useCallback(() => {
    teardownChannel();
    gameActiveRef.current = false;
    submittedRef.current = false;
    setAlloc(null);
    allocRef.current = null;
    setFinalResult(null);
    setPresenceSlots({});
    setOpponentScores({});
    setBotScores({});
    setQuestion(null);
    setAnswer("");
    void enterQueue(level);
  }, [teardownChannel, enterQueue, level]);

  // ── Build queue room slot list ────────────────────────────────────────────

  const queueSlots: QueueSlot[] = (() => {
    const out: QueueSlot[] = [null, null, null, null];
    for (const slotStr of Object.keys(presenceSlots)) {
      const slot = Number(slotStr);
      const meta = presenceSlots[slot];
      out[slot] = {
        slot,
        displayName: meta.displayName,
        avatarUrl: meta.avatarUrl,
        isBot: false,
      };
    }
    return out;
  })();

  // ── Build live ticker player list ─────────────────────────────────────────

  const tickerPlayers: TickerPlayer[] = (() => {
    if (!alloc) return [];
    const out: TickerPlayer[] = [];
    for (let s = 0; s < 4; s++) {
      const presence = presenceSlots[s];
      const isMe = s === alloc.slotIndex;
      if (presence) {
        out.push({
          slot: s,
          displayName: presence.displayName,
          avatarUrl: presence.avatarUrl,
          isBot: false,
          score: isMe ? dispScore : (opponentScores[s] ?? 0),
          isMe,
        });
      } else {
        out.push({
          slot: s,
          displayName: `MathBot ${s + 1}`,
          avatarUrl: null,
          isBot: true,
          score: botScores[s] ?? 0,
          isMe: false,
        });
      }
    }
    return out;
  })();

  // ── Render ────────────────────────────────────────────────────────────────

  if (!authChecked) {
    return (
      <div className="mx-auto max-w-md px-4 pt-12 text-center text-sm text-muted">Loading…</div>
    );
  }

  if (phase === "auth" || !signedIn) {
    return (
      <div className="mx-auto max-w-md px-4 pt-10 pb-8">
        <h1 className="text-2xl font-bold tracking-tight">Live Math Blitz</h1>
        <p className="mt-2 text-sm text-muted">
          Real-time head-to-head against three other players or bots. Sign in to play live.
        </p>
        <button
          onClick={() => router.push("/auth")}
          className="mt-6 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: "var(--accent)" }}
        >
          Sign in to play live
        </button>
        <button
          onClick={() => router.push("/brain-training/math-blitz")}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium"
        >
          <ArrowLeft size={15} /> Back to Math Blitz
        </button>
      </div>
    );
  }

  if (phase === "select") {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/brain-training/math-blitz")}
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight">MathStack</h1>
          <p className="mt-1 text-sm text-muted">Pick a level to enter the queue.</p>
        </div>
        <div className="space-y-3">
          {([1, 2, 3] as Level[]).map((lv) => {
            const m = LEVEL_META[lv];
            return (
              <button
                key={lv}
                onClick={() => enterQueue(lv)}
                className="w-full rounded-2xl border border-border bg-surface px-5 py-4 text-left transition-all duration-150 hover:border-[var(--accent)]/40 hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black text-white"
                    style={{ background: m.color }}
                  >
                    {lv}
                  </div>
                  <div>
                    <div className="text-base font-bold">{m.label}</div>
                    <div className="mt-0.5 text-xs text-muted">{m.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === "queue") {
    return <QueueRoom players={queueSlots} secondsRemaining={queueSecs} level={level} />;
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

  if (phase === "submitting") {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg">
        <div className="text-sm text-muted">Finalising results…</div>
      </div>
    );
  }

  if (phase === "result" && finalResult) {
    const podiumPlayers: PodiumPlayer[] = finalResult.players.map((p) => ({
      slot: p.slot,
      userId: p.userId,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      isBot: p.isBot,
      score: p.score ?? 0,
      correct: p.correct ?? 0,
      rank: p.rank ?? 0,
      eloBefore: p.eloBefore,
      eloAfter: p.eloAfter,
    }));
    return (
      <Podium
        players={podiumPlayers}
        currentUserId={userId}
        onPlayAgainAction={playAgain}
        onBackAction={resetToSelect}
      />
    );
  }

  // Playing
  const feedbackBg =
    feedback === "correct"
      ? "color-mix(in srgb, #10b981 12%, var(--surface))"
      : feedback === "wrong"
        ? "color-mix(in srgb, #e11d48 12%, var(--surface))"
        : "var(--surface)";

  return (
    <div
      className="fixed inset-x-0 top-0 z-40 flex flex-col bg-bg overflow-hidden"
      style={{ height: "100svh" }}
    >
      <LiveScoreTicker players={tickerPlayers} />

      <div className="flex justify-center py-1 shrink-0">
        <TimerRing secs={secsLeft} total={GAME_SECS} />
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <motion.div
          key={question?.display}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="w-full rounded-3xl px-6 py-5 text-center transition-colors duration-150"
          style={{ background: feedbackBg, border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)" }}
        >
          <div className="text-4xl font-black tracking-tight select-none">
            {question?.display} =
          </div>
          <div
            className="mt-4 text-3xl font-black tabular-nums min-h-[2.5rem]"
            style={{ color: "var(--accent)" }}
          >
            {answer || <span className="text-muted/30">?</span>}
          </div>
        </motion.div>
      </div>

      <div
        className="shrink-0 px-4 pt-2 space-y-1.5"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {PAD_ROWS.map((row, ri) => (
          <div key={ri} className="grid grid-cols-3 gap-1.5">
            {row.map((key) => {
              const isSpecial = key === "⌫" || key === "−";
              return (
                <motion.button
                  key={key}
                  onPointerDown={(e) => { e.preventDefault(); padPress(key); }}
                  variants={{
                    rest: { y: 0, scale: 1, boxShadow: "0 4px 0 color-mix(in srgb, var(--fg) 14%, transparent)" },
                    pressed: { y: 4, scale: 0.97, boxShadow: "0 0px 0 color-mix(in srgb, var(--fg) 14%, transparent)" },
                  }}
                  initial="rest"
                  whileTap="pressed"
                  transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
                  className="rounded-2xl py-3 text-lg font-bold select-none"
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
        <motion.button
          onPointerDown={(e) => { e.preventDefault(); submitAnswer(); }}
          disabled={!answer.trim() || inFeedbackRef.current}
          variants={{
            rest: { y: 0, scale: 1, boxShadow: "0 4px 0 color-mix(in srgb, var(--accent) 45%, #0006)" },
            pressed: { y: 4, scale: 0.98, boxShadow: "0 0px 0 color-mix(in srgb, var(--accent) 45%, #0006)" },
          }}
          initial="rest"
          whileTap="pressed"
          transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
          className="w-full rounded-2xl py-3 text-base font-bold text-white disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          Check ✓
        </motion.button>
      </div>
    </div>
  );
}
