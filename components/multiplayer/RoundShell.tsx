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
import { updateRatings, type EloPlayer } from "@/lib/multiplayer/elo";
import type { RoundAdapter } from "@/lib/multiplayer/types";
import { QueueRoom, type QueueSlot } from "./QueueRoom";
import { LiveScoreTicker, type TickerPlayer } from "./LiveScoreTicker";
import { Podium, type PodiumPlayer } from "./Podium";

type Phase =
  | "auth"
  | "alloc"
  | "queue"
  | "countdown"
  | "playing"
  | "reveal"
  | "submitting"
  | "result";

const QUEUE_GRACE_MS = 5_000;
const DEFAULT_RATING = 1200;
const MAX_PLAYERS = 8;

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

type GuessLockedPayload<A> = {
  roundIndex: number;
  slot: number;
  points: number;
  distanceMeters: number;
  guess: A;
};

export type RevealGuess<A> = {
  slot: number;
  displayName: string;
  guess: A | null;
  points: number;
  distanceMeters: number | null;
};

type RoundShellProps<Q, A> = {
  adapter: RoundAdapter<Q, A>;
  level: number;
  PlayBoard: React.ComponentType<{
    location: Q;
    roundIndex: number;
    timeLeftMs: number;
    locked: boolean;
    onLockGuess: (guess: A) => void;
  }>;
  RevealBoard: React.ComponentType<{
    actual: Q;
    guesses: Array<RevealGuess<A>>;
    roundIndex: number;
  }>;
};

function denseRanks(scores: number[]): number[] {
  const sorted = [...new Set(scores)].sort((a, b) => b - a);
  const rankFor = new Map<number, number>();
  sorted.forEach((s, i) => rankFor.set(s, i + 1));
  return scores.map((s) => rankFor.get(s)!);
}

export function RoundShell<Q, A>({ adapter, level, PlayBoard, RevealBoard }: RoundShellProps<Q, A>) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("auth");
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ displayName: string; avatarUrl: string | null } | null>(null);

  const [alloc, setAlloc] = useState<QueueAlloc | null>(null);
  const [queueSecs, setQueueSecs] = useState(QUEUE_GRACE_MS / 1000);
  const [presenceSlots, setPresenceSlots] = useState<Record<number, PresenceMeta>>({});

  const [countNum, setCountNum] = useState(3);

  const [locations, setLocations] = useState<Q[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(adapter.roundDurationMs);
  const [revealMs, setRevealMs] = useState(adapter.revealDurationMs);
  const [locked, setLocked] = useState(false);

  const [slotScores, setSlotScores] = useState<Record<number, number>>({});
  const [opponentScores, setOpponentScores] = useState<Record<number, number>>({});
  const [roundGuesses, setRoundGuesses] = useState<Record<number, GuessLockedPayload<A>>>({});

  const [finalResult, setFinalResult] = useState<ResultResp | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const myScoreRef = useRef(0);
  const phaseRef = useRef(phase);
  const allocRef = useRef<QueueAlloc | null>(null);
  const presenceRef = useRef<Record<number, PresenceMeta>>({});
  const lockedRef = useRef(false);
  const submittedRef = useRef(false);
  const roundIndexRef = useRef(0);
  const playStartRef = useRef(0);
  const roundGuessesRef = useRef<Record<number, GuessLockedPayload<A>>>({});

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { presenceRef.current = presenceSlots; }, [presenceSlots]);
  useEffect(() => { roundIndexRef.current = roundIndex; }, [roundIndex]);
  useEffect(() => { roundGuessesRef.current = roundGuesses; }, [roundGuesses]);

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
        const meta = data.session.user.user_metadata as { username?: string; avatar_url?: string };
        const cachedName = typeof window !== "undefined" ? localStorage.getItem("slubstack_username") : null;
        const cachedAvatar = typeof window !== "undefined" ? localStorage.getItem("slubstack_avatar") : null;
        setProfile({
          displayName: cachedName ?? meta.username ?? `learner-${data.session.user.id.slice(0, 8)}`,
          avatarUrl: cachedAvatar ?? meta.avatar_url ?? null,
        });
        setPhase("alloc");
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
    return () => { teardownChannel(); };
  }, [teardownChannel]);

  // ── Submit final score ────────────────────────────────────────────────────

  const opponentScoresRef = useRef<Record<number, number>>({});
  useEffect(() => { opponentScoresRef.current = opponentScores; }, [opponentScores]);

  const submitResult = useCallback(async (a: QueueAlloc) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const score = myScoreRef.current;
    const xpAward = adapter.xpFor(score);
    if (xpAward > 0) {
      store.getState().addXp(xpAward);
      awardQuestProgress("xp", xpAward);
      pushLeagueXp(xpAward);
    }

    setPhase("submitting");

    try {
      const opponents = opponentScoresRef.current;
      const presence = presenceRef.current;

      const allSlots: Array<{
        slot: number;
        userId: string | null;
        displayName: string;
        avatarUrl: string | null;
        isBot: boolean;
        score: number;
        correct: number;
      }> = [];

      for (let s = 0; s < MAX_PLAYERS; s++) {
        const meta = presence[s];
        if (!meta) continue;
        const isMe = s === a.slotIndex;
        const slotScore = isMe ? score : (opponents[s] ?? 0);
        allSlots.push({
          slot: s,
          userId: meta.userId,
          displayName: meta.displayName,
          avatarUrl: meta.avatarUrl,
          isBot: false,
          score: slotScore,
          correct: 0,
        });
      }

      if (allSlots.length === 0) { submittedRef.current = false; setPhase("alloc"); return; }

      const ranks = denseRanks(allSlots.map((s) => s.score));
      const slotsRanked = allSlots.map((s, i) => ({ ...s, rank: ranks[i] }));

      const humansCount = slotsRanked.length;

      const supabase = getSupabaseBrowserClient();
      const humanIds = slotsRanked.map((s) => s.userId!).filter(Boolean);
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

      const humanRanks = slotsRanked.map((s) => s.rank);
      const minHumanRank = humanRanks.length ? Math.min(...humanRanks) : 0;
      const maxHumanRank = humanRanks.length ? Math.max(...humanRanks) : 0;

      const playerUpdates = slotsRanked.map((s) => {
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
        for (const s of slotsRanked) {
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
          bot_inserts: [],
          player_updates: playerUpdates,
          rating_upserts: ratingUpserts,
        }),
      });
      const data = (await res.json()) as ResultResp | { error: string };
      if ("error" in data) {
        console.error("[RoundShell] result POST failed:", data.error);
        setPhase("alloc");
        return;
      }
      setFinalResult(data);
      setPhase("result");
    } catch (err) {
      console.error("[RoundShell] result POST error:", err);
      setPhase("alloc");
    }
  }, [adapter, store]);

  // ── Match alloc + channel ────────────────────────────────────────────────

  const enterQueue = useCallback(async () => {
    if (!profile || !userId) return;
    setPhase("queue");
    setPresenceSlots({});
    setQueueSecs(QUEUE_GRACE_MS / 1000);

    let res: Response;
    try {
      res = await fetch("/api/live/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_kind: adapter.gameKind, level }),
      });
    } catch (err) {
      console.error("[RoundShell] match POST failed:", err);
      setPhase("alloc");
      return;
    }
    if (!res.ok) {
      console.error("[RoundShell] match POST status:", res.status);
      setPhase("alloc");
      return;
    }
    const data = (await res.json()) as QueueAlloc;
    setAlloc(data);
    allocRef.current = data;

    const locs = adapter.generateLocations(data.seed, adapter.roundCount);
    setLocations(locs);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setPhase("auth"); return; }

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

    channel.on("broadcast", { event: "guess-locked" }, ({ payload }) => {
      const p = payload as GuessLockedPayload<A>;
      if (typeof p?.slot !== "number" || typeof p?.roundIndex !== "number") return;
      if (p.slot === data.slotIndex) return;
      if (p.roundIndex !== roundIndexRef.current) return;
      setRoundGuesses((prev) => ({ ...prev, [p.slot]: p }));
    });

    channel.on("broadcast", { event: "go" }, () => {
      if (phaseRef.current === "queue") setPhase("countdown");
    });

    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "live_matches", filter: `id=eq.${data.matchId}` },
      ({ new: row }) => {
        const r = row as { status?: string };
        if (r.status === "finished" && !submittedRef.current && allocRef.current) {
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
  }, [profile, userId, adapter, level, teardownChannel, submitResult]);

  // Auto-enter queue once alloc-ready
  useEffect(() => {
    if (phase !== "alloc" || !signedIn || !profile || !userId) return;
    void enterQueue();
  }, [phase, signedIn, profile, userId, enterQueue]);

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
        if (phaseRef.current === "queue") setPhase("countdown");
      }
    }, 200);
    return () => clearInterval(iv);
  }, [phase, alloc]);

  useEffect(() => {
    if (phase !== "queue" || !alloc) return;
    if (Object.keys(presenceSlots).length >= MAX_PLAYERS && alloc.slotIndex === 0) {
      const ch = channelRef.current;
      if (ch) ch.send({ type: "broadcast", event: "go", payload: {} });
      setPhase("countdown");
    }
  }, [phase, alloc, presenceSlots]);

  // ── Countdown ─────────────────────────────────────────────────────────────

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
          myScoreRef.current = 0;
          setSlotScores({});
          setOpponentScores({});
          setRoundIndex(0);
          setLocked(false);
          lockedRef.current = false;
          setRoundGuesses({});
          submittedRef.current = false;
          setTimeLeftMs(adapter.roundDurationMs);
          playStartRef.current = Date.now();
          setPhase("playing");
        }, 600));
      }
    };
    timeouts.push(setTimeout(step, 600));
    return () => timeouts.forEach(clearTimeout);
  }, [phase, adapter.roundDurationMs]);

  // ── Playing phase: round timer + tick broadcast ───────────────────────────

  useEffect(() => {
    if (phase !== "playing") return;

    const tickIv = setInterval(() => {
      const elapsed = Date.now() - playStartRef.current;
      const remaining = Math.max(0, adapter.roundDurationMs - elapsed);
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        clearInterval(tickIv);
        setRevealMs(adapter.revealDurationMs);
        setPhase("reveal");
      }
    }, 200);

    const broadcastIv = setInterval(() => {
      const ch = channelRef.current;
      const a = allocRef.current;
      if (!ch || !a) return;
      ch.send({
        type: "broadcast",
        event: "tick",
        payload: { slot: a.slotIndex, score: myScoreRef.current } satisfies TickPayload,
      });
    }, 750);

    return () => {
      clearInterval(tickIv);
      clearInterval(broadcastIv);
    };
  }, [phase, adapter.roundDurationMs, adapter.revealDurationMs]);

  // ── Reveal phase: timer → next round or result ────────────────────────────

  useEffect(() => {
    if (phase !== "reveal") return;
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, adapter.revealDurationMs - elapsed);
      setRevealMs(remaining);
      if (remaining <= 0) {
        clearInterval(iv);
        const next = roundIndexRef.current + 1;
        if (next >= adapter.roundCount) {
          const a = allocRef.current;
          if (a) void submitResult(a);
        } else {
          setRoundIndex(next);
          setLocked(false);
          lockedRef.current = false;
          setRoundGuesses({});
          setTimeLeftMs(adapter.roundDurationMs);
          playStartRef.current = Date.now();
          setPhase("playing");
        }
      }
    }, 200);
    return () => clearInterval(iv);
  }, [phase, adapter.revealDurationMs, adapter.roundDurationMs, adapter.roundCount, submitResult]);

  // ── Lock guess handler ───────────────────────────────────────────────────

  const handleLockGuess = useCallback((guess: A) => {
    if (lockedRef.current || phaseRef.current !== "playing") return;
    const a = allocRef.current;
    if (!a) return;
    const target = locations[roundIndexRef.current];
    if (!target) return;

    const { points, distanceMeters } = adapter.scoreFromGuess(guess, target);
    myScoreRef.current += points;
    setSlotScores((prev) => ({ ...prev, [a.slotIndex]: (prev[a.slotIndex] ?? 0) + points }));
    setLocked(true);
    lockedRef.current = true;

    const payload: GuessLockedPayload<A> = {
      roundIndex: roundIndexRef.current,
      slot: a.slotIndex,
      points,
      distanceMeters,
      guess,
    };
    setRoundGuesses((prev) => ({ ...prev, [a.slotIndex]: payload }));

    const ch = channelRef.current;
    if (ch) {
      ch.send({ type: "broadcast", event: "guess-locked", payload });
      ch.send({
        type: "broadcast",
        event: "tick",
        payload: { slot: a.slotIndex, score: myScoreRef.current } satisfies TickPayload,
      });
    }
  }, [adapter, locations]);

  // ── Reset / play again ────────────────────────────────────────────────────

  const resetToHome = useCallback(() => {
    teardownChannel();
    submittedRef.current = false;
    router.push("/trivia");
  }, [teardownChannel, router]);

  const playAgain = useCallback(() => {
    teardownChannel();
    submittedRef.current = false;
    setAlloc(null);
    allocRef.current = null;
    setFinalResult(null);
    setPresenceSlots({});
    setOpponentScores({});
    setSlotScores({});
    setRoundGuesses({});
    setLocations([]);
    setRoundIndex(0);
    myScoreRef.current = 0;
    setPhase("alloc");
  }, [teardownChannel]);

  // ── Derived view models ───────────────────────────────────────────────────

  const queueSlots: QueueSlot[] = (() => {
    const out: QueueSlot[] = Array(MAX_PLAYERS).fill(null);
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
    for (let s = 0; s < MAX_PLAYERS; s++) {
      const presence = presenceSlots[s];
      if (!presence) continue;
      const isMe = s === alloc.slotIndex;
      out.push({
        slot: s,
        displayName: presence.displayName,
        avatarUrl: presence.avatarUrl,
        isBot: false,
        score: isMe ? (slotScores[s] ?? 0) : (opponentScores[s] ?? 0),
        isMe,
      });
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
          Three rounds of explore-and-guess against up to seven other players. Sign in to play live.
        </p>
        <button
          onClick={() => router.push("/auth")}
          className="mt-6 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: "var(--accent)" }}
        >
          Sign in to play live
        </button>
        <button
          onClick={() => router.push("/trivia")}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium"
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    );
  }

  if (phase === "alloc") {
    return <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg text-sm text-muted">Allocating match…</div>;
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
        onPlayAgainAction={playAgain}
        onBackAction={resetToHome}
      />
    );
  }

  const currentLocation = locations[roundIndex];
  if (!currentLocation) {
    return <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg text-sm text-muted">Loading…</div>;
  }

  if (phase === "reveal") {
    const guesses: Array<RevealGuess<A>> = (() => {
      const out: Array<RevealGuess<A>> = [];
      for (const slotStr of Object.keys(presenceSlots)) {
        const slot = Number(slotStr);
        const meta = presenceSlots[slot];
        const g = roundGuesses[slot];
        out.push({
          slot,
          displayName: meta.displayName,
          guess: g?.guess ?? null,
          points: g?.points ?? 0,
          distanceMeters: g?.distanceMeters ?? null,
        });
      }
      return out;
    })();
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-bg">
        <LiveScoreTicker players={tickerPlayers} />
        <div className="flex-1 min-h-0">
          <RevealBoard actual={currentLocation} guesses={guesses} roundIndex={roundIndex} />
        </div>
        <div className="px-3 pb-3 pt-1 text-center text-xs text-muted">
          Next round in {Math.ceil(revealMs / 1000)}s
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <LiveScoreTicker players={tickerPlayers} />
      <div className="flex-1 min-h-0">
        <PlayBoard
          location={currentLocation}
          roundIndex={roundIndex}
          timeLeftMs={timeLeftMs}
          locked={locked}
          onLockGuess={handleLockGuess}
        />
      </div>
    </div>
  );
}
