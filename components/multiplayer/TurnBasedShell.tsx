"use client";

import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Trophy, RotateCcw, Home } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { brainTrainingStore } from "@/lib/store";
import { awardQuestProgress } from "@/lib/questsStore";
import { pushLeagueXp } from "@/lib/leagues";
import { useStrokeBroadcast } from "@/hooks/useStrokeBroadcast";
import { judge } from "@/lib/multiplayer/draw-scoring";
import type {
  TurnBasedAdapter,
  StrokeDelta,
  StrokeEnd,
  GuessMessage,
  CorrectMessage,
  RoundReady,
  Point,
} from "@/lib/multiplayer/draw-types";
import { GuestGate } from "./GuestGate";
import { profileFromUser } from "@/lib/multiplayer/guest";
import { DrawCanvas } from "@/components/draw/DrawCanvas";
import { ColorPalette, DRAW_COLORS } from "@/components/draw/ColorPalette";
import { BrushControls, BRUSH_SIZES } from "@/components/draw/BrushControls";
import { RoomLobby } from "@/components/draw/RoomLobby";
import { RoundHeader } from "@/components/draw/RoundHeader";
import { GuessFeed, type GuessEntry } from "@/components/draw/GuessFeed";
import { GuessInput } from "@/components/draw/GuessInput";

type Phase = "auth" | "lobby" | "countdown" | "playing" | "between" | "result";

type LobbyPhase = "create" | "join" | "waiting";

type Player = {
  slot: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

type PresenceMeta = {
  slotIndex: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

type RoundState = {
  roundIndex: number;
  drawerSlot: number;
  word: string | null;
  startedAt: number;
  winnerSlot: number | null;
};

type Score = { slot: number; points: number };

type IncomingStroke = {
  id: string;
  color: string;
  size: number;
  points: Point[];
  complete: boolean;
};

type RoomCreateResp = {
  matchId: string;
  roomCode: string;
  seed: string;
  slotIndex: number;
  totalRounds: number;
  roundDurationMs: number;
};

type RoomJoinResp = {
  matchId: string;
  seed: string;
  slotIndex: number;
  totalRounds: number;
  roundDurationMs: number;
};

type RoundResp = {
  drawerSlot: number;
  word: string | null;
};

type TurnBasedShellProps = {
  adapter: TurnBasedAdapter;
};

type ReducerState = {
  phase: Phase;
  round: RoundState | null;
  scores: Score[];
  totalRounds: number;
};

type ReducerAction =
  | { type: "to-lobby" }
  | { type: "to-countdown"; totalRounds: number }
  | { type: "start-round"; round: RoundState }
  | { type: "win-round"; winnerSlot: number; drawerSlot: number; points: { drawer: number; guesser: number } }
  | { type: "to-between" }
  | { type: "to-result" }
  | { type: "reset" };

function addPoints(scores: Score[], slot: number, points: number): Score[] {
  const idx = scores.findIndex((s) => s.slot === slot);
  if (idx === -1) return [...scores, { slot, points }];
  const next = [...scores];
  next[idx] = { slot, points: next[idx].points + points };
  return next;
}

function reducer(state: ReducerState, action: ReducerAction): ReducerState {
  switch (action.type) {
    case "to-lobby":
      return { phase: "lobby", round: null, scores: [], totalRounds: state.totalRounds };
    case "to-countdown":
      return { phase: "countdown", round: null, scores: [], totalRounds: action.totalRounds };
    case "start-round":
      return { ...state, phase: "playing", round: action.round };
    case "win-round": {
      if (!state.round) return state;
      let scores = state.scores;
      if (action.winnerSlot >= 0) {
        scores = addPoints(scores, action.drawerSlot, action.points.drawer);
        scores = addPoints(scores, action.winnerSlot, action.points.guesser);
      }
      return {
        ...state,
        phase: "between",
        round: { ...state.round, winnerSlot: action.winnerSlot },
        scores,
      };
    }
    case "to-between":
      return { ...state, phase: "between" };
    case "to-result":
      return { ...state, phase: "result" };
    case "reset":
      return { phase: "lobby", round: null, scores: [], totalRounds: state.totalRounds };
    default:
      return state;
  }
}

export function TurnBasedShell({ adapter }: TurnBasedShellProps): React.JSX.Element {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ displayName: string; avatarUrl: string | null } | null>(null);

  const [state, dispatch] = useReducer(reducer, {
    phase: "auth",
    round: null,
    scores: [],
    totalRounds: adapter.totalRoundsPerPlayer,
  } satisfies ReducerState);

  const [lobbyPhase, setLobbyPhase] = useState<LobbyPhase>("create");
  const [lobbyBusy, setLobbyBusy] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [slotIndex, setSlotIndex] = useState<number>(-1);
  const [roundDurationMs, setRoundDurationMs] = useState<number>(adapter.roundDurationMs);

  const [presenceSlots, setPresenceSlots] = useState<Record<number, PresenceMeta>>({});

  const [countNum, setCountNum] = useState(3);

  const [incomingStrokes, setIncomingStrokes] = useState<IncomingStroke[]>([]);
  const [guessFeed, setGuessFeed] = useState<GuessEntry[]>([]);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(adapter.roundDurationMs);

  const [drawColor, setDrawColor] = useState<string>(DRAW_COLORS[0]);
  const [brushSize, setBrushSize] = useState<number>(BRUSH_SIZES[0]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const slotIndexRef = useRef<number>(-1);
  const phaseRef = useRef<Phase>(state.phase);
  const roundRef = useRef<RoundState | null>(state.round);
  const scoresRef = useRef<Score[]>(state.scores);
  const totalRoundsRef = useRef<number>(state.totalRounds);
  const playStartRef = useRef<number>(0);
  const presenceRef = useRef<Record<number, PresenceMeta>>({});
  const xpAwardedRef = useRef(false);
  const submittedRef = useRef(false);
  const requestedRoundRef = useRef<number>(-1);

  useEffect(() => { phaseRef.current = state.phase; }, [state.phase]);
  useEffect(() => { roundRef.current = state.round; }, [state.round]);
  useEffect(() => { scoresRef.current = state.scores; }, [state.scores]);
  useEffect(() => { totalRoundsRef.current = state.totalRounds; }, [state.totalRounds]);
  useEffect(() => { matchIdRef.current = matchId; }, [matchId]);
  useEffect(() => { slotIndexRef.current = slotIndex; }, [slotIndex]);
  useEffect(() => { presenceRef.current = presenceSlots; }, [presenceSlots]);

  // ── Auth gate ────────────────────────────────────────────────────────────

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
        const uid = data.session.user.id;
        const meta = data.session.user.user_metadata as { username?: string; avatar_url?: string };
        const cachedName = typeof window !== "undefined" ? localStorage.getItem("slubstack_username") : null;
        const cachedAvatar = typeof window !== "undefined" ? localStorage.getItem("slubstack_avatar") : null;
        setProfile({
          displayName: cachedName ?? meta.username ?? `learner-${uid.slice(0, 8)}`,
          avatarUrl: cachedAvatar ?? meta.avatar_url ?? null,
        });
        dispatch({ type: "to-lobby" });
      } else {
        setSignedIn(false);
      }
      setAuthChecked(true);
    });
  }, []);

  // ── Channel teardown ─────────────────────────────────────────────────────

  const teardownChannel = useCallback(() => {
    const ch = channelRef.current;
    if (ch) {
      const supabase = getSupabaseBrowserClient();
      ch.unsubscribe();
      if (supabase) supabase.removeChannel(ch);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => () => teardownChannel(), [teardownChannel]);

  // ── Realtime channel subscribe ────────────────────────────────────────────

  const subscribeChannel = useCallback(
    async (mId: string, slot: number) => {
      if (!profile || !userId) return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      teardownChannel();

      const channel = supabase.channel(`live:draw_my_thing:${mId}`, {
        config: { presence: { key: String(slot) } },
      });

      channel.on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState<PresenceMeta>();
        const next: Record<number, PresenceMeta> = {};
        for (const key of Object.keys(presenceState)) {
          const metas = presenceState[key];
          if (metas && metas.length > 0) next[Number(key)] = metas[0];
        }
        setPresenceSlots(next);
      });

      channel.on("broadcast", { event: "go" }, () => {
        if (phaseRef.current === "lobby") {
          dispatch({ type: "to-countdown", totalRounds: totalRoundsRef.current });
        }
      });

      channel.on("broadcast", { event: "round_ready" }, ({ payload }) => {
        const p = payload as RoundReady;
        if (typeof p?.roundIndex !== "number" || typeof p?.drawerSlot !== "number") return;
        const r = roundRef.current;
        if (r && r.roundIndex === p.roundIndex) return;
        const isMeDrawer = p.drawerSlot === slotIndexRef.current;
        if (isMeDrawer) return;
        setIncomingStrokes([]);
        setGuessFeed([]);
        playStartRef.current = performance.now();
        dispatch({
          type: "start-round",
          round: {
            roundIndex: p.roundIndex,
            drawerSlot: p.drawerSlot,
            word: null,
            startedAt: playStartRef.current,
            winnerSlot: null,
          },
        });
      });

      channel.on("broadcast", { event: "stroke_delta" }, ({ payload }) => {
        const p = payload as StrokeDelta;
        if (!p || typeof p.strokeId !== "string") return;
        if (p.slot === slotIndexRef.current) return;
        setIncomingStrokes((prev) => {
          const idx = prev.findIndex((s) => s.id === p.strokeId);
          if (idx === -1) {
            return [
              ...prev,
              { id: p.strokeId, color: p.color, size: p.size, points: [...p.points], complete: false },
            ];
          }
          const merged = [...prev];
          merged[idx] = { ...merged[idx], points: [...merged[idx].points, ...p.points] };
          return merged;
        });
      });

      channel.on("broadcast", { event: "stroke_end" }, ({ payload }) => {
        const p = payload as StrokeEnd;
        if (!p || typeof p.strokeId !== "string") return;
        setIncomingStrokes((prev) =>
          prev.map((s) => (s.id === p.strokeId ? { ...s, complete: true } : s)),
        );
      });

      channel.on("broadcast", { event: "guess" }, ({ payload }) => {
        const p = payload as GuessMessage;
        if (!p || typeof p.slot !== "number" || typeof p.text !== "string") return;
        const r = roundRef.current;
        if (!r || r.roundIndex !== p.roundIndex) return;
        const meta = presenceRef.current[p.slot];
        const displayName = meta?.displayName ?? `Player ${p.slot + 1}`;

        setGuessFeed((prev) => {
          const next = [...prev, { slot: p.slot, displayName, text: p.text, correct: false, tsMs: Date.now() }];
          return next.length > 50 ? next.slice(next.length - 50) : next;
        });

        if (r.drawerSlot === slotIndexRef.current && r.word && r.winnerSlot === null) {
          if (judge(p.text, r.word)) {
            const msElapsed = performance.now() - r.startedAt;
            const correctPayload: CorrectMessage = {
              guesserSlot: p.slot,
              msElapsed,
              roundIndex: r.roundIndex,
            };
            const ch = channelRef.current;
            if (ch) ch.send({ type: "broadcast", event: "correct", payload: correctPayload });
            roundRef.current = { ...r, winnerSlot: p.slot };
            const guesserPts = adapter.guesserPointsFor(msElapsed, roundDurationMs);
            dispatch({
              type: "win-round",
              winnerSlot: p.slot,
              drawerSlot: r.drawerSlot,
              points: { drawer: adapter.pointsForDrawerOnCorrect, guesser: guesserPts },
            });
            setGuessFeed((prev) => {
              const next = [...prev, { slot: p.slot, displayName, text: p.text, correct: true, tsMs: Date.now() }];
              return next.length > 50 ? next.slice(next.length - 50) : next;
            });
          }
        }
      });

      channel.on("broadcast", { event: "correct" }, ({ payload }) => {
        const p = payload as CorrectMessage;
        if (!p || typeof p.guesserSlot !== "number" || typeof p.roundIndex !== "number") return;
        const r = roundRef.current;
        if (!r || r.roundIndex !== p.roundIndex || r.winnerSlot !== null) return;
        if (r.drawerSlot === slotIndexRef.current) return;
        const guesserPts =
          p.guesserSlot >= 0 ? adapter.guesserPointsFor(p.msElapsed, roundDurationMs) : 0;
        const drawerPts = p.guesserSlot >= 0 ? adapter.pointsForDrawerOnCorrect : 0;
        dispatch({
          type: "win-round",
          winnerSlot: p.guesserSlot,
          drawerSlot: r.drawerSlot,
          points: { drawer: drawerPts, guesser: guesserPts },
        });
      });

      channel.subscribe();
      await channel.track({
        slotIndex: slot,
        userId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      } satisfies PresenceMeta);

      channelRef.current = channel;
    },
    [profile, userId, teardownChannel, adapter, roundDurationMs],
  );

  // ── Room create / join ───────────────────────────────────────────────────

  const handleCreate = useCallback(
    async (opts: { totalRounds: number; roundDurationMs: number }) => {
      if (lobbyBusy || !profile || !userId) return;
      setLobbyBusy(true);
      try {
        const res = await fetch("/api/live/draw/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalRounds: opts.totalRounds, roundDurationMs: opts.roundDurationMs }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as RoomCreateResp;
        setMatchId(data.matchId);
        setRoomCode(data.roomCode);
        setSlotIndex(data.slotIndex);
        setRoundDurationMs(data.roundDurationMs);
        totalRoundsRef.current = data.totalRounds;
        setLobbyPhase("waiting");
        await subscribeChannel(data.matchId, data.slotIndex);
      } catch (err) {
        console.error("[TurnBasedShell] create room failed:", err);
      } finally {
        setLobbyBusy(false);
      }
    },
    [lobbyBusy, profile, userId, subscribeChannel],
  );

  const handleJoin = useCallback(
    async (code: string) => {
      if (lobbyBusy || !profile || !userId) return;
      setLobbyBusy(true);
      try {
        const res = await fetch(`/api/live/draw/room?code=${encodeURIComponent(code)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as RoomJoinResp;
        setMatchId(data.matchId);
        setRoomCode(code);
        setSlotIndex(data.slotIndex);
        setRoundDurationMs(data.roundDurationMs);
        totalRoundsRef.current = data.totalRounds;
        setLobbyPhase("waiting");
        await subscribeChannel(data.matchId, data.slotIndex);
      } catch (err) {
        console.error("[TurnBasedShell] join room failed:", err);
      } finally {
        setLobbyBusy(false);
      }
    },
    [lobbyBusy, profile, userId, subscribeChannel],
  );

  const handleStart = useCallback(() => {
    if (slotIndex !== 0) return;
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({ type: "broadcast", event: "go", payload: {} });
    dispatch({ type: "to-countdown", totalRounds: totalRoundsRef.current });
  }, [slotIndex]);

  // ── Countdown ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (state.phase !== "countdown") return;
    setCountNum(3);
    let n = 3;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const step = (): void => {
      n--;
      setCountNum(n);
      if (n > 0) {
        timeouts.push(setTimeout(step, 600));
      } else {
        timeouts.push(setTimeout(() => {
          requestedRoundRef.current = -1;
          beginRound(0);
        }, 600));
      }
    };
    timeouts.push(setTimeout(step, 600));
    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // ── Round start (drawer fetches word; broadcasts round_ready) ────────────

  const beginRound = useCallback(
    async (roundIndex: number) => {
      const mId = matchIdRef.current;
      const slot = slotIndexRef.current;
      if (!mId || slot < 0) return;
      if (requestedRoundRef.current === roundIndex) return;
      requestedRoundRef.current = roundIndex;

      try {
        const res = await fetch("/api/live/draw/round", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: mId, roundIndex, callerSlot: slot }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as RoundResp;

        const isMeDrawer = data.drawerSlot === slot;
        if (isMeDrawer) {
          setIncomingStrokes([]);
          setGuessFeed([]);
          playStartRef.current = performance.now();
          dispatch({
            type: "start-round",
            round: {
              roundIndex,
              drawerSlot: data.drawerSlot,
              word: data.word,
              startedAt: playStartRef.current,
              winnerSlot: null,
            },
          });
          const ch = channelRef.current;
          if (ch) {
            const payload: RoundReady = { roundIndex, drawerSlot: data.drawerSlot };
            ch.send({ type: "broadcast", event: "round_ready", payload });
          }
        }
      } catch (err) {
        console.error("[TurnBasedShell] round fetch failed:", err);
      }
    },
    [],
  );

  // ── Playing timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (state.phase !== "playing" || !state.round) return;
    setTimeLeftMs(roundDurationMs);
    const iv = setInterval(() => {
      const elapsed = performance.now() - playStartRef.current;
      const remaining = Math.max(0, roundDurationMs - elapsed);
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        clearInterval(iv);
        const r = roundRef.current;
        if (!r || r.winnerSlot !== null) return;
        if (r.drawerSlot === slotIndexRef.current) {
          const ch = channelRef.current;
          if (ch) {
            const payload: CorrectMessage = { guesserSlot: -1, msElapsed: roundDurationMs, roundIndex: r.roundIndex };
            ch.send({ type: "broadcast", event: "correct", payload });
          }
          dispatch({
            type: "win-round",
            winnerSlot: -1,
            drawerSlot: r.drawerSlot,
            points: { drawer: 0, guesser: 0 },
          });
        }
      }
    }, 200);
    return () => clearInterval(iv);
  }, [state.phase, state.round, roundDurationMs]);

  // ── Between rounds ──────────────────────────────────────────────────────

  useEffect(() => {
    if (state.phase !== "between" || !state.round) return;
    const t = setTimeout(() => {
      const next = (roundRef.current?.roundIndex ?? 0) + 1;
      const presenceCount = Object.keys(presenceRef.current).length || 1;
      const totalRoundsAll = totalRoundsRef.current * presenceCount;
      if (next >= totalRoundsAll) {
        dispatch({ type: "to-result" });
      } else {
        setIncomingStrokes([]);
        setGuessFeed([]);
        requestedRoundRef.current = -1;
        void beginRound(next);
      }
    }, adapter.betweenRoundsMs);
    return () => clearTimeout(t);
  }, [state.phase, state.round, adapter.betweenRoundsMs, beginRound]);

  // ── XP wiring at match end ───────────────────────────────────────────────

  useEffect(() => {
    if (state.phase !== "result" || xpAwardedRef.current) return;
    xpAwardedRef.current = true;
    const myScore = scoresRef.current.find((s) => s.slot === slotIndexRef.current)?.points ?? 0;
    const xp = adapter.xpFor(myScore);
    if (xp > 0) {
      brainTrainingStore.getState().addXp(xp);
      awardQuestProgress("xp", xp);
      pushLeagueXp(xp);
    }
  }, [state.phase, adapter]);

  // ── Result POST (best-effort; non-blocking) ──────────────────────────────

  useEffect(() => {
    if (state.phase !== "result" || submittedRef.current) return;
    const mId = matchIdRef.current;
    if (!mId) return;
    submittedRef.current = true;
    const slots = Object.keys(presenceRef.current).map(Number);
    const scoreVals = slots.map((s) => scoresRef.current.find((sc) => sc.slot === s)?.points ?? 0);
    const sorted = [...new Set(scoreVals)].sort((a, b) => b - a);
    const rankFor = new Map<number, number>();
    sorted.forEach((v, i) => rankFor.set(v, i + 1));
    const playerUpdates = slots.map((slot) => {
      const score = scoresRef.current.find((sc) => sc.slot === slot)?.points ?? 0;
      return { slot, score, correct: 0, rank: rankFor.get(score) ?? 1 };
    });
    void fetch("/api/live/draw/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: mId, playerUpdates }),
      keepalive: true,
    }).catch(() => {});
  }, [state.phase]);

  // ── Stroke broadcast (drawer) ────────────────────────────────────────────

  const isDrawer =
    state.phase === "playing" && state.round?.drawerSlot === slotIndex;

  const { sendStrokeDelta, sendStrokeEnd } = useStrokeBroadcast({
    channel: channelRef.current,
    slot: slotIndex,
    enabled: isDrawer,
  });

  const onStrokeSegment = useCallback(
    (seg: StrokeDelta) => sendStrokeDelta(seg),
    [sendStrokeDelta],
  );
  const onStrokeEnd = useCallback(
    (end: StrokeEnd) => sendStrokeEnd(end),
    [sendStrokeEnd],
  );

  const onClear = useCallback(() => {
    setIncomingStrokes([]);
  }, []);

  const onUndo = useCallback(() => {
    setIncomingStrokes((prev) => prev.slice(0, -1));
  }, []);

  // ── Guess handler ────────────────────────────────────────────────────────

  const onGuess = useCallback(
    (text: string) => {
      const r = roundRef.current;
      const ch = channelRef.current;
      if (!r || !ch || phaseRef.current !== "playing" || r.winnerSlot !== null) return;
      const slot = slotIndexRef.current;
      if (slot < 0 || slot === r.drawerSlot) return;
      const payload: GuessMessage = { slot, text, roundIndex: r.roundIndex };
      ch.send({ type: "broadcast", event: "guess", payload });
      const meta = presenceRef.current[slot];
      const displayName = meta?.displayName ?? "You";
      setGuessFeed((prev) => {
        const next = [...prev, { slot, displayName, text, correct: false, tsMs: Date.now() }];
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
    },
    [],
  );

  // ── Reset / play again ───────────────────────────────────────────────────

  const playAgain = useCallback(() => {
    teardownChannel();
    submittedRef.current = false;
    xpAwardedRef.current = false;
    setMatchId(null);
    setRoomCode(null);
    setSlotIndex(-1);
    setPresenceSlots({});
    setIncomingStrokes([]);
    setGuessFeed([]);
    setLobbyPhase("create");
    dispatch({ type: "reset" });
  }, [teardownChannel]);

  const backToHub = useCallback(() => {
    teardownChannel();
    router.push("/brain-training");
  }, [teardownChannel, router]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const players: Player[] = Object.keys(presenceSlots)
    .map(Number)
    .sort((a, b) => a - b)
    .map((slot) => {
      const meta = presenceSlots[slot];
      return {
        slot,
        userId: meta.userId,
        displayName: meta.displayName,
        avatarUrl: meta.avatarUrl,
      };
    });

  const drawerMeta =
    state.round != null ? presenceSlots[state.round.drawerSlot] : undefined;
  const drawerName = drawerMeta?.displayName ?? `Player ${(state.round?.drawerSlot ?? 0) + 1}`;

  // ── Render ───────────────────────────────────────────────────────────────

  if (!authChecked) {
    return <div className="mx-auto max-w-md px-4 pt-12 text-center text-sm text-muted">Loading…</div>;
  }

  if (!signedIn) {
    return (
      <GuestGate
        title={adapter.displayName}
        description="Turn-based drawing party game. Host or join a room."
        backPath={adapter.routePath.replace(/\/[^/]+$/, "") || "/brain-training"}
        onGuestAction={(user) => {
          setSignedIn(true);
          setUserId(user.id);
          setProfile(profileFromUser(user));
          dispatch({ type: "to-lobby" });
        }}
      />
    );
  }

  if (state.phase === "lobby") {
    return (
      <RoomLobby
        phase={lobbyPhase}
        roomCode={roomCode ?? undefined}
        players={players}
        onCreate={handleCreate}
        onJoin={handleJoin}
        onStart={handleStart}
        onBack={backToHub}
        onSwitchPhase={setLobbyPhase}
        isHost={slotIndex === 0}
        busy={lobbyBusy}
      />
    );
  }

  if (state.phase === "countdown") {
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
              <span className="text-6xl font-black" style={{ color: "var(--accent)" }}>Draw!</span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (state.phase === "result") {
    const presenceCount = Object.keys(presenceSlots).length || 1;
    const podium = Array.from({ length: presenceCount }, (_, i) => {
      const meta = presenceSlots[i];
      const score = state.scores.find((s) => s.slot === i)?.points ?? 0;
      return {
        slot: i,
        displayName: meta?.displayName ?? `Player ${i + 1}`,
        avatarUrl: meta?.avatarUrl ?? null,
        score,
        isMe: i === slotIndex,
      };
    }).sort((a, b) => b.score - a.score);

    return (
      <div className="mx-auto max-w-md px-4 pt-8 pb-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <Trophy className="h-10 w-10 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold tracking-tight">Final scores</h1>
        </div>
        <ul className="mt-6 flex flex-col gap-2">
          {podium.map((p, i) => (
            <li
              key={p.slot}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                p.isMe ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-border bg-surface"
              }`}
            >
              <span className="w-6 shrink-0 text-center text-base font-black text-muted">
                {i + 1}
              </span>
              {p.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatarUrl} alt="" className="h-9 w-9 rounded-full border border-border object-cover" />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  {p.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="flex-1 truncate text-sm font-bold">{p.displayName}</span>
              <span className="text-base font-black tabular-nums">{p.score}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={playAgain}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: "var(--accent)" }}
        >
          <RotateCcw className="h-5 w-5" />
          Play again
        </button>
        <button
          onClick={backToHub}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium"
        >
          <Home className="h-4 w-4" /> Back to brain training
        </button>
      </div>
    );
  }

  if (state.phase === "between" && state.round) {
    const winner =
      state.round.winnerSlot != null && state.round.winnerSlot >= 0
        ? presenceSlots[state.round.winnerSlot]?.displayName ?? `Player ${state.round.winnerSlot + 1}`
        : null;
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg px-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted">The word was</div>
        <div className="mt-2 text-4xl font-black uppercase tracking-[0.15em] text-[var(--accent)]">
          {state.round.word ?? "—"}
        </div>
        <div className="mt-6 text-sm text-fg">
          {winner ? (
            <>
              <span className="font-bold">{winner}</span> got it!
            </>
          ) : (
            "Nobody got it this round."
          )}
        </div>
        <div className="mt-2 text-xs text-muted">Next round in {Math.ceil(adapter.betweenRoundsMs / 1000)}s</div>
      </div>
    );
  }

  if (state.phase === "playing" && state.round) {
    const drawing = isDrawer;
    return (
      <div
        className="fixed inset-0 z-40 flex flex-col bg-bg"
        style={{
          height: "100dvh",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <RoundHeader
          roundIndex={state.round.roundIndex}
          totalRounds={state.totalRounds * Math.max(1, Object.keys(presenceSlots).length)}
          drawerName={drawerName}
          isDrawer={drawing}
          word={drawing ? state.round.word ?? undefined : undefined}
          msRemaining={timeLeftMs}
          roundDurationMs={roundDurationMs}
        />

        <div className="flex flex-col gap-2 px-3 pt-2">
          <DrawCanvas
            isDrawer={drawing}
            color={drawColor}
            size={brushSize}
            slot={slotIndex}
            onStrokeSegment={onStrokeSegment}
            onStrokeEnd={onStrokeEnd}
            incomingStrokes={incomingStrokes}
            onClear={onClear}
            onUndo={onUndo}
          />

          {drawing ? (
            <div className="flex flex-col gap-2">
              <ColorPalette selected={drawColor} onSelect={setDrawColor} />
              <BrushControls
                size={brushSize}
                onSize={setBrushSize}
                onUndo={onUndo}
                onClear={onClear}
              />
            </div>
          ) : (
            <GuessInput
              disabled={state.round.winnerSlot !== null}
              onGuess={onGuess}
            />
          )}
        </div>

        <div className="flex-1 min-h-0 px-3 pt-2 pb-3">
          <GuessFeed entries={guessFeed} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg text-sm text-muted">
      Loading…
    </div>
  );
}
