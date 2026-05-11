"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ArrowLeft } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { brainTrainingStore, triviaStore } from "@/lib/store";
import { awardQuestProgress } from "@/lib/questsStore";
import { pushLeagueXp } from "@/lib/leagues";
import { simulateBotTimeline, type BotTickEvent } from "@/lib/multiplayer/bot";
import { updateRatings, type EloPlayer } from "@/lib/multiplayer/elo";
import type { SprintAdapter, ScoreResult } from "@/lib/multiplayer/types";
import { QueueRoom, type QueueSlot } from "./QueueRoom";
import { LiveScoreTicker, type TickerPlayer } from "./LiveScoreTicker";
import { Podium, type PodiumPlayer } from "./Podium";

type Phase = "auth" | "select" | "queue" | "countdown" | "playing" | "submitting" | "result";

const GAME_MS = 30_000;
const QUEUE_GRACE_MS = 5_000;
const DEFAULT_RATING = 1200;

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
  level: number;
  players: MatchPlayerResp[];
};

type QueueAlloc = { matchId: string; seed: string; level: number; slotIndex: number };

type PresenceMeta = {
  slotIndex: number;
  displayName: string;
  avatarUrl: string | null;
  userId: string;
};

type TickPayload = { slot: number; score: number };

function denseRanks(scores: number[]): number[] {
  const sorted = [...new Set(scores)].sort((a, b) => b - a);
  const rankFor = new Map<number, number>();
  sorted.forEach((s, i) => rankFor.set(s, i + 1));
  return scores.map((s) => rankFor.get(s)!);
}

export function MultiplayerShell<Q, A>({ adapter }: { adapter: SprintAdapter<Q, A> }) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("auth");
  const [level, setLevel] = useState<number>(adapter.levels[0]?.id ?? 1);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ displayName: string; avatarUrl: string | null } | null>(null);

  const [alloc, setAlloc] = useState<QueueAlloc | null>(null);
  const [queueSecs, setQueueSecs] = useState(QUEUE_GRACE_MS / 1000);
  const [presenceSlots, setPresenceSlots] = useState<Record<number, PresenceMeta>>({});

  const [countNum, setCountNum] = useState(3);

  const [questions, setQuestions] = useState<Q[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<ScoreResult | null>(null);
  const [opponentScores, setOpponentScores] = useState<Record<number, number>>({});
  const [botScores, setBotScores] = useState<Record<number, number>>({});
  const [finalResult, setFinalResult] = useState<ResultResp | null>(null);
  const [remainingMs, setRemainingMs] = useState(GAME_MS);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const liveRef = useRef({ score: 0, correct: 0 });
  const [dispScore, setDispScore] = useState(0);
  const inFeedbackRef = useRef(false);
  const gameActiveRef = useRef(false);
  const submittedRef = useRef(false);
  const botTimelinesRef = useRef<Record<number, BotTickEvent[]>>({});
  const playStartRef = useRef(0);
  const allocRef = useRef<QueueAlloc | null>(null);
  const presenceRef = useRef<Record<number, PresenceMeta>>({});
  const phaseRef = useRef(phase);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { presenceRef.current = presenceSlots; }, [presenceSlots]);

  const store = adapter.storeKey === "trivia" ? triviaStore : brainTrainingStore;

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
        const userId = data.session.user.id;
        const meta = data.session.user.user_metadata as { username?: string; avatar_url?: string };
        const cachedName = typeof window !== "undefined" ? localStorage.getItem("slubstack_username") : null;
        const cachedAvatar = typeof window !== "undefined" ? localStorage.getItem("slubstack_avatar") : null;
        setProfile({
          displayName: cachedName ?? meta.username ?? `learner-${userId.slice(0, 8)}`,
          avatarUrl: cachedAvatar ?? meta.avatar_url ?? null,
        });
        setPhase("select");
        fetch("/api/profile", { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            const username = d?.profile?.username as string | undefined;
            const avatar = d?.profile?.avatar as string | null | undefined;
            if (username) {
              setProfile((prev) => ({
                displayName: username,
                avatarUrl: avatar ?? prev?.avatarUrl ?? null,
              }));
              localStorage.setItem("slubstack_username", username);
              if (avatar) localStorage.setItem("slubstack_avatar", avatar);
            }
          })
          .catch(() => {});
      } else {
        setSignedIn(false);
        setPhase("auth");
      }
      setAuthChecked(true);
    });
  }, []);

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

    const xpAward = adapter.xpFor(correct, score);
    if (xpAward > 0) {
      store.getState().addXp(xpAward);
      awardQuestProgress("xp", xpAward);
      if (correct > 0) awardQuestProgress("correct", correct);
      pushLeagueXp(xpAward);
    }

    setPhase("submitting");

    try {
      // Snapshot opponents' final tick-broadcast scores plus our own.
      const opponents = opponentScoresRef.current;
      const presence = presenceRef.current;
      const botTimelines = botTimelinesRef.current;

      const allSlots: Array<{
        slot: number;
        userId: string | null;
        displayName: string;
        avatarUrl: string | null;
        isBot: boolean;
        score: number;
        correct: number;
      }> = [];

      for (let s = 0; s < 4; s++) {
        const meta = presence[s];
        if (meta) {
          const isMe = s === a.slotIndex;
          const slotScore = isMe ? score : (opponents[s] ?? 0);
          const slotCorrect = isMe ? correct : Math.max(0, Math.round(slotScore / 12));
          allSlots.push({
            slot: s,
            userId: meta.userId,
            displayName: meta.displayName,
            avatarUrl: meta.avatarUrl,
            isBot: false,
            score: slotScore,
            correct: slotCorrect,
          });
        } else {
          const events = botTimelines[s] ?? [];
          const botScore = events.reduce((sum, e) => sum + e.scoreDelta, 0);
          const botCorrect = Math.max(0, Math.round(botScore / 12));
          allSlots.push({
            slot: s,
            userId: null,
            displayName: `Bot ${s + 1}`,
            avatarUrl: null,
            isBot: true,
            score: botScore,
            correct: botCorrect,
          });
        }
      }

      const ranks = denseRanks(allSlots.map((s) => s.score));
      const slotsRanked = allSlots.map((s, i) => ({ ...s, rank: ranks[i] }));

      const humansCount = slotsRanked.filter((s) => !s.isBot).length;

      // Fetch existing ratings (public read) so we can compute ELO deltas.
      const supabase = getSupabaseBrowserClient();
      const humanIds = slotsRanked.filter((s) => !s.isBot).map((s) => s.userId!);
      const ratingByUser = new Map<
        string,
        { rating: number; matches: number; wins: number; draws: number; losses: number }
      >();
      if (supabase && humanIds.length > 0) {
        const { data: rows } = await supabase
          .from("live_ratings")
          .select("user_id, rating, matches, wins, draws, losses")
          .eq("game_kind", adapter.gameKind)
          .eq("level", a.level)
          .in("user_id", humanIds);
        for (const r of rows ?? []) {
          ratingByUser.set(r.user_id, {
            rating: r.rating,
            matches: r.matches,
            wins: r.wins,
            draws: r.draws,
            losses: r.losses,
          });
        }
      }

      const eloInput: EloPlayer[] = slotsRanked.map((s) => {
        if (s.isBot) {
          return { userId: `bot-${s.slot}`, rating: 0, matches: 0, score: s.score, isBot: true };
        }
        const existing = ratingByUser.get(s.userId!);
        return {
          userId: s.userId!,
          rating: existing?.rating ?? DEFAULT_RATING,
          matches: existing?.matches ?? 0,
          score: s.score,
          isBot: false,
        };
      });

      const eloUpdates = updateRatings(eloInput);
      const eloByUser = new Map(eloUpdates.map((u) => [u.userId, u]));

      const humanSlots = slotsRanked.filter((s) => !s.isBot);
      const humanRanks = humanSlots.map((s) => s.rank);
      const minHumanRank = humanRanks.length ? Math.min(...humanRanks) : 0;
      const maxHumanRank = humanRanks.length ? Math.max(...humanRanks) : 0;

      const botInserts = slotsRanked
        .filter((s) => s.isBot)
        .map((s) => ({
          slot: s.slot,
          display_name: s.displayName,
          score: s.score,
          correct: s.correct,
          rank: s.rank,
        }));

      const playerUpdates = slotsRanked
        .filter((s) => !s.isBot)
        .map((s) => {
          const elo = eloByUser.get(s.userId!);
          return {
            slot: s.slot,
            score: s.score,
            correct: s.correct,
            rank: s.rank,
            elo_before: elo?.before ?? null,
            elo_after: elo?.after ?? null,
          };
        });

      const ratingUpserts: Array<{
        user_id: string;
        level: number;
        rating: number;
        matches: number;
        wins: number;
        draws: number;
        losses: number;
      }> = [];

      if (humansCount >= 2) {
        for (const s of humanSlots) {
          const elo = eloByUser.get(s.userId!);
          if (!elo) continue;
          const existing = ratingByUser.get(s.userId!);
          const baseMatches = existing?.matches ?? 0;
          const baseWins = existing?.wins ?? 0;
          const baseDraws = existing?.draws ?? 0;
          const baseLosses = existing?.losses ?? 0;

          const uniquelyHeld = humanRanks.filter((r) => r === s.rank).length === 1;
          const isWin = uniquelyHeld && s.rank === minHumanRank;
          const isLoss = uniquelyHeld && s.rank === maxHumanRank;
          const isDraw = !isWin && !isLoss;

          ratingUpserts.push({
            user_id: s.userId!,
            level: a.level,
            rating: elo.after,
            matches: baseMatches + 1,
            wins: baseWins + (isWin ? 1 : 0),
            draws: baseDraws + (isDraw ? 1 : 0),
            losses: baseLosses + (isLoss ? 1 : 0),
          });
        }
      }

      const res = await fetch(`/api/live/match/${a.matchId}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_kind: adapter.gameKind,
          humans_count: humansCount,
          bot_inserts: botInserts,
          player_updates: playerUpdates,
          rating_upserts: ratingUpserts,
        }),
      });
      const data = (await res.json()) as ResultResp | { error: string };
      if ("error" in data) {
        console.error("[MultiplayerShell] result POST failed:", data.error);
        setPhase("select");
        return;
      }
      setFinalResult(data);
      setPhase("result");
    } catch (err) {
      console.error("[MultiplayerShell] result POST error:", err);
      setPhase("select");
    }
  }, [adapter, store]);

  // mirror of opponentScores so submitResult can read latest without re-deps
  const opponentScoresRef = useRef<Record<number, number>>({});
  useEffect(() => { opponentScoresRef.current = opponentScores; }, [opponentScores]);

  // ── End game (time up) ────────────────────────────────────────────────────

  const endGame = useCallback(() => {
    if (!gameActiveRef.current) return;
    gameActiveRef.current = false;
    adapter.onGameEnd?.();
    const a = allocRef.current;
    if (!a) return;
    void submitResult(a);
  }, [adapter, submitResult]);

  // ── Countdown → playing ───────────────────────────────────────────────────

  const startCountdown = useCallback(() => { setPhase("countdown"); }, []);

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
          liveRef.current = { score: 0, correct: 0 };
          setDispScore(0);
          setOpponentScores({});
          submittedRef.current = false;

          const a = allocRef.current;
          if (!a) return;

          const qs = adapter.generateQuestions(a.level, a.seed);
          setQuestions(qs);
          setQuestionIndex(0);

          const tuning = adapter.levels.find((l) => l.id === a.level)?.botTuning;
          const occupied = new Set(Object.keys(presenceRef.current).map(Number));
          const botMap: Record<number, BotTickEvent[]> = {};
          const botInitial: Record<number, number> = {};
          for (let s = 0; s < 4; s++) {
            if (!occupied.has(s)) {
              botMap[s] = tuning ? simulateBotTimeline(a.seed, tuning, GAME_MS, s) : [];
              botInitial[s] = 0;
            }
          }
          botTimelinesRef.current = botMap;
          setBotScores(botInitial);

          setRemainingMs(GAME_MS);
          gameActiveRef.current = true;
          playStartRef.current = Date.now();
          setPhase("playing");
        }, 600));
      }
    };
    timeouts.push(setTimeout(step, 600));
    return () => timeouts.forEach(clearTimeout);
  }, [phase, adapter]);

  // ── Playing phase: timers ─────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "playing") return;

    const tickIv = setInterval(() => {
      const elapsed = Date.now() - playStartRef.current;
      const remaining = Math.max(0, GAME_MS - elapsed);
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearInterval(tickIv);
        if (gameActiveRef.current) endGame();
      }
    }, 250);

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
  }, [phase, endGame]);

  // ── Answer handler (delegated to adapter scoring) ─────────────────────────

  const handleAnswer = useCallback((answer: A) => {
    if (inFeedbackRef.current || phaseRef.current !== "playing") return;
    const q = questions[questionIndex];
    if (!q) return;

    inFeedbackRef.current = true;
    const result = adapter.scoring(answer, q);
    adapter.onFeedback?.(result);
    const live = liveRef.current;
    live.score += result.points;
    if (result.correct) live.correct++;
    setDispScore(live.score);
    setFeedback(result);

    setTimeout(() => {
      setFeedback(null);
      inFeedbackRef.current = false;
      setQuestionIndex((i) => i + 1);
    }, result.correct ? 300 : 700);
  }, [adapter, questions, questionIndex]);

  // ── Enter queue ───────────────────────────────────────────────────────────

  const enterQueue = useCallback(async (chosenLevel: number) => {
    if (!profile || !userId) return;
    setLevel(chosenLevel);
    setPhase("queue");
    setPresenceSlots({});
    setQueueSecs(QUEUE_GRACE_MS / 1000);

    let res: Response;
    try {
      res = await fetch("/api/live/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_kind: adapter.gameKind, level: chosenLevel }),
      });
    } catch (err) {
      console.error("[MultiplayerShell] match POST failed:", err);
      setPhase("select");
      return;
    }
    if (!res.ok) {
      console.error("[MultiplayerShell] match POST status:", res.status);
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

    const channel = supabase.channel(`live:${adapter.gameKind}:${data.matchId}`, {
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
      { event: "UPDATE", schema: "public", table: "live_matches", filter: `id=eq.${data.matchId}` },
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
  }, [profile, userId, adapter.gameKind, teardownChannel, startCountdown, submitResult]);

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
        if (alloc.slotIndex === 0) {
          const ch = channelRef.current;
          if (ch) ch.send({ type: "broadcast", event: "go", payload: {} });
        }
        if (phaseRef.current === "queue") startCountdown();
      }
    }, 200);
    return () => clearInterval(iv);
  }, [phase, alloc, startCountdown]);

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
    setQuestions([]);
    setQuestionIndex(0);
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
    setQuestions([]);
    setQuestionIndex(0);
    void enterQueue(level);
  }, [teardownChannel, enterQueue, level]);

  // ── Derived view models ───────────────────────────────────────────────────

  const queueSlots: QueueSlot[] = (() => {
    const out: QueueSlot[] = [null, null, null, null];
    for (const slotStr of Object.keys(presenceSlots)) {
      const slot = Number(slotStr);
      const meta = presenceSlots[slot];
      out[slot] = { slot, displayName: meta.displayName, avatarUrl: meta.avatarUrl, isBot: false };
    }
    return out;
  })();

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
          displayName: `Bot ${s + 1}`,
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
    return <div className="mx-auto max-w-md px-4 pt-12 text-center text-sm text-muted">Loading…</div>;
  }

  if (phase === "auth" || !signedIn) {
    return (
      <div className="mx-auto max-w-md px-4 pt-10 pb-8">
        <h1 className="text-2xl font-bold tracking-tight">{adapter.displayName}</h1>
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
          onClick={() => router.push(adapter.routePath)}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium"
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    );
  }

  if (phase === "select") {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <div className="mb-6">
          <button
            onClick={() => router.push(adapter.routePath)}
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight">{adapter.displayName}</h1>
          <p className="mt-1 text-sm text-muted">Pick a level to enter the queue.</p>
        </div>
        <div className="space-y-3">
          {adapter.levels.map((lv) => (
            <button
              key={lv.id}
              onClick={() => enterQueue(lv.id)}
              className="w-full rounded-2xl border border-border bg-surface px-5 py-4 text-left transition-all duration-150 hover:border-[var(--accent)]/40 hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {lv.id}
                </div>
                <div className="text-base font-bold">{lv.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "queue") {
    return <QueueRoom players={queueSlots} secondsRemaining={queueSecs} level={level} title={adapter.displayName} />;
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
        gameDisplayName={adapter.displayName}
        onPlayAgainAction={playAgain}
        onBackAction={resetToSelect}
      />
    );
  }

  const currentQuestion = questions[questionIndex];
  if (!currentQuestion) {
    return <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg text-sm text-muted">Loading…</div>;
  }

  const PlayBoard = adapter.PlayBoard;
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <LiveScoreTicker players={tickerPlayers} />
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
