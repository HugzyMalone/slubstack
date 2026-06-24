"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ArrowLeft, Bot, Check, Copy, Play, Trophy, RotateCcw, Home, Users } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAnonymousUser, profileFromUser } from "@/lib/multiplayer/guest";
import { updateRatings, type EloPlayer, type EloUpdate } from "@/lib/multiplayer/elo";
import { denseRanks } from "@/lib/multiplayer/ranking";
import { brainTrainingStore } from "@/lib/store";
import { awardQuestProgress } from "@/lib/questsStore";
import { pushLeagueXp } from "@/lib/leagues";
import { XP_GAME_COMPLETE } from "@/lib/xp";
import {
  createRaceState,
  registerTap,
  RACE_MAX_MS,
  type Button,
  type RaceState,
  type Track,
} from "@/lib/games/sperm-race/engine";
import { makePracticeBots, type PracticeBot } from "@/lib/games/sperm-race/bots";
import { GuestGate } from "@/components/multiplayer/GuestGate";
import { RaceTrack, type Racer } from "./RaceTrack";
import { TapPad } from "./TapPad";

type Phase = "auth" | "create" | "join" | "waiting" | "countdown" | "racing" | "result";

type PresenceMeta = {
  slotIndex: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

type PosPayload = { slot: number; pos: number };
type FinishPayload = { slot: number; ms: number };

type StandingEntry = {
  slot: number;
  displayName: string;
  rank: number | null;
  score: number | null;
};

type RoomResp = {
  matchId: string;
  seed: string;
  joinCode?: string;
  slotIndex: number;
};

const POS_BROADCAST_MS = 100;
const DEFAULT_RATING = 1200;
// Standings-snapshot window: wait for every present racer's `finish` broadcast
// to land before computing placements, but resolve early once they all have so
// fast rooms aren't penalised. The cap bounds a slow-broadcast straggler.
const SNAPSHOT_POLL_MS = 150;
const SNAPSHOT_MAX_MS = 4_000;

export function RaceShell(): React.JSX.Element {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ displayName: string; avatarUrl: string | null } | null>(null);

  const [phase, setPhase] = useState<Phase>("auth");
  const [busy, setBusy] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [slot, setSlot] = useState<number>(-1);
  const [track, setTrack] = useState<Track>(1);
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  const [presenceSlots, setPresenceSlots] = useState<Record<number, PresenceMeta>>({});
  const [positions, setPositions] = useState<Record<number, number>>({});
  const [finishers, setFinishers] = useState<FinishPayload[]>([]);
  const [standings, setStandings] = useState<StandingEntry[] | null>(null);
  const [countNum, setCountNum] = useState(3);

  const [practiceBots, setPracticeBots] = useState<PracticeBot[]>([]);
  const practiceRef = useRef(false);
  const practiceBotsRef = useRef<PracticeBot[]>([]);
  useEffect(() => { practiceBotsRef.current = practiceBots; }, [practiceBots]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const slotRef = useRef(-1);
  const phaseRef = useRef<Phase>("auth");
  const raceRef = useRef<RaceState>(createRaceState(1));
  const finishedRef = useRef(false);
  const myTapsRef = useRef<number[]>([]);
  const submittedRef = useRef(false);
  const xpAwardedRef = useRef(false);
  const lastSentPosRef = useRef(-1);
  const isGuestRef = useRef(false);
  const finishersRef = useRef<FinishPayload[]>([]);
  const presenceSlotsRef = useRef<Record<number, PresenceMeta>>({});

  useEffect(() => { slotRef.current = slot; }, [slot]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { finishersRef.current = finishers; }, [finishers]);
  useEffect(() => { presenceSlotsRef.current = presenceSlots; }, [presenceSlots]);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthChecked(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSignedIn(true);
        setUserId(data.session.user.id);
        setProfile(profileFromUser(data.session.user));
        isGuestRef.current = isAnonymousUser(data.session.user);
        setPhase("create");
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

  // ── Race lifecycle ─────────────────────────────────────────────────────────
  const startRace = useCallback((t: Track) => {
    raceRef.current = createRaceState(t);
    lastSentPosRef.current = -1;
    finishedRef.current = false;
    myTapsRef.current = [];
    submittedRef.current = false;
    xpAwardedRef.current = false;
    setPositions({});
    setFinishers([]);
    setStandings(null);
    setPhase("countdown");
  }, []);

  // ── Practice vs bots (local-only, no channel / no result POST) ──────────────
  const startPractice = useCallback(() => {
    if (busy || !profile) return;
    const bots = makePracticeBots(track, `practice:${track}:${Date.now()}`, 3);
    practiceRef.current = true;
    practiceBotsRef.current = bots;
    setPracticeBots(bots);
    setSlot(0);
    setMatchId(null);
    setJoinCode(null);
    setFinishers([]);
    startRace(track);
  }, [busy, profile, track, startRace]);

  // ── Realtime channel ──────────────────────────────────────────────────────
  const subscribeChannel = useCallback(
    async (mId: string, mySlot: number) => {
      if (!profile || !userId) return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      teardownChannel();

      const channel = supabase.channel(`live:sperm_race:${mId}`, {
        config: { presence: { key: String(mySlot) } },
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

      channel.on("broadcast", { event: "go" }, ({ payload }) => {
        const p = payload as { track?: Track };
        if (phaseRef.current !== "waiting") return;
        if (p?.track === 1 || p?.track === 2 || p?.track === 3) setTrack(p.track);
        startRace(p?.track ?? 1);
      });

      channel.on("broadcast", { event: "pos" }, ({ payload }) => {
        const p = payload as PosPayload;
        if (typeof p?.slot !== "number" || typeof p?.pos !== "number") return;
        if (p.slot === slotRef.current) return;
        setPositions((prev) => (prev[p.slot] === p.pos ? prev : { ...prev, [p.slot]: p.pos }));
      });

      channel.on("broadcast", { event: "finish" }, ({ payload }) => {
        const p = payload as FinishPayload;
        if (typeof p?.slot !== "number" || typeof p?.ms !== "number") return;
        setPositions((prev) => ({ ...prev, [p.slot]: 1 }));
        setFinishers((prev) => (prev.some((f) => f.slot === p.slot) ? prev : [...prev, p]));
      });

      channel.subscribe();
      await channel.track({
        slotIndex: mySlot,
        userId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      } satisfies PresenceMeta);

      channelRef.current = channel;
    },
    [profile, userId, teardownChannel, startRace],
  );

  // ── Room create / join ─────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (busy || !profile || !userId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/sperm-race/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as RoomResp;
      setMatchId(data.matchId);
      setJoinCode(data.joinCode ?? null);
      setSlot(data.slotIndex);
      setPhase("waiting");
      await subscribeChannel(data.matchId, data.slotIndex);
    } catch (err) {
      console.error("[RaceShell] create room failed:", err);
      toast.error("Could not create a room. Try again.");
    } finally {
      setBusy(false);
    }
  }, [busy, profile, userId, track, subscribeChannel]);

  const handleJoin = useCallback(async () => {
    if (busy || !profile || !userId || codeInput.length !== 4) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sperm-race/room?code=${encodeURIComponent(codeInput)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as RoomResp;
      setMatchId(data.matchId);
      setJoinCode(codeInput);
      setSlot(data.slotIndex);
      setPhase("waiting");
      await subscribeChannel(data.matchId, data.slotIndex);
    } catch (err) {
      console.error("[RaceShell] join room failed:", err);
      toast.error("Could not join — check the code.");
    } finally {
      setBusy(false);
    }
  }, [busy, profile, userId, codeInput, subscribeChannel]);

  // The host is whoever holds the lowest present slot, not strictly slot 0 — so
  // if the original host (slot 0) leaves the lobby, the next remaining racer
  // inherits the start control instead of the room becoming unstartable.
  const handleStart = useCallback(() => {
    const presentSlotNums = Object.keys(presenceSlotsRef.current).map(Number);
    const hostSlot = presentSlotNums.length ? Math.min(...presentSlotNums) : -1;
    if (slotRef.current !== hostSlot) return;
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({ type: "broadcast", event: "go", payload: { track } });
    startRace(track);
  }, [track, startRace]);

  useEffect(() => {
    if (phase !== "countdown") return;
    setCountNum(3);
    let n = 3;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const step = () => {
      n--;
      setCountNum(n);
      if (n > 0) timeouts.push(setTimeout(step, 700));
      else timeouts.push(setTimeout(() => setPhase("racing"), 700));
    };
    timeouts.push(setTimeout(step, 700));
    return () => timeouts.forEach(clearTimeout);
  }, [phase]);

  // 10Hz position broadcast while racing.
  useEffect(() => {
    if (phase !== "racing") return;
    const iv = setInterval(() => {
      const ch = channelRef.current;
      const pos = raceRef.current.pos;
      if (ch && pos !== lastSentPosRef.current) {
        lastSentPosRef.current = pos;
        ch.send({ type: "broadcast", event: "pos", payload: { slot: slotRef.current, pos } satisfies PosPayload });
      }
    }, POS_BROADCAST_MS);
    return () => clearInterval(iv);
  }, [phase]);

  // Bot lanes in practice mode: drive each bot's position from elapsed/finishMs
  // with mild per-tick jitter so lanes don't move in lockstep, and record a
  // `finish` locally when a bot crosses. Entirely client-side — no broadcast.
  useEffect(() => {
    if (phase !== "racing" || !practiceRef.current) return;
    const startedAt = performance.now();
    const finished = new Set<number>();
    const iv = setInterval(() => {
      const elapsed = performance.now() - startedAt;
      setPositions((prev) => {
        const next = { ...prev };
        for (const bot of practiceBotsRef.current) {
          if (finished.has(bot.slot)) continue;
          const base = elapsed / bot.finishMs;
          const jitter = (Math.random() - 0.5) * 0.02;
          const pos = Math.min(1, Math.max(next[bot.slot] ?? 0, base + jitter));
          next[bot.slot] = pos;
          if (pos >= 1) {
            finished.add(bot.slot);
            setFinishers((f) => (f.some((x) => x.slot === bot.slot) ? f : [...f, { slot: bot.slot, ms: bot.finishMs }]));
          }
        }
        return next;
      });
    }, 50);
    return () => clearInterval(iv);
  }, [phase]);

  // Terminal race clock: if the local player never crosses the line, force the
  // result screen anyway so the match can't hang in `racing` forever. The
  // result POST then finalises standings as a DNF (no best-time write).
  useEffect(() => {
    if (phase !== "racing") return;
    const t = setTimeout(() => {
      if (phaseRef.current === "racing") setPhase("result");
    }, RACE_MAX_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const onTap = useCallback((button: Button) => {
    if (phaseRef.current !== "racing") return;
    const before = raceRef.current;
    if (before.finished) return;
    const next = registerTap(before, button, performance.now());
    if (next === before) return;
    raceRef.current = next;
    setPositions((prev) => ({ ...prev, [slotRef.current]: next.pos }));

    if (next.finished && !finishedRef.current) {
      finishedRef.current = true;
      myTapsRef.current = next.timeline;
      const ms = next.timeline[next.timeline.length - 1] - next.timeline[0];
      const ch = channelRef.current;
      if (ch) ch.send({ type: "broadcast", event: "finish", payload: { slot: slotRef.current, ms } satisfies FinishPayload });
      setFinishers((prev) => (prev.some((f) => f.slot === slotRef.current) ? prev : [...prev, { slot: slotRef.current, ms }]));
      setPhase("result");
    }
  }, []);

  // ── XP at finish ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "result" || xpAwardedRef.current) return;
    if (practiceRef.current) return;
    xpAwardedRef.current = true;
    brainTrainingStore.getState().addXp(XP_GAME_COMPLETE);
    awardQuestProgress("xp", XP_GAME_COMPLETE);
    pushLeagueXp(XP_GAME_COMPLETE);
  }, [phase]);

  // ── Result POST (finalise standings + ELO, plus the tap timeline) ───────────
  // Fires on every racer reaching the result screen — whether they finished or
  // were forced there by the RACE_MAX_MS clock (DNF). One racer's POST wins the
  // finalise advisory lock and writes standings; later ones are idempotent via
  // the route's status=finished short-circuit, but each still records their own
  // best-time before that. The snapshot is deferred until all present racers'
  // `finish` broadcasts have landed (or SNAPSHOT_MAX_MS) so a slow-broadcast
  // finisher isn't mis-ranked as DNF. Only a finisher holds a tap timeline; a
  // DNF posts an empty one and the route finalises without a best-time write.
  useEffect(() => {
    if (phase !== "result" || submittedRef.current) return;
    if (practiceRef.current) return;
    submittedRef.current = true;
    const mId = matchId;
    const trackVal = raceRef.current.track;
    const taps = myTapsRef.current;
    if (!mId) return;

    let poll: ReturnType<typeof setInterval> | null = null;
    let settled = false;
    const startedAt = performance.now();

    const run = () => {
      if (settled) return;
      settled = true;
      if (poll) clearInterval(poll);
      void submitResult();
    };

    const submitResult = async () => {
      {
        const present = Object.values(presenceSlotsRef.current);
        // A racer's "score" is their placement value: finishers ranked by finish
        // time (faster = higher score), non-finishers (DNF) score 0. This feeds
        // the same denseRanks → updateRatings path the other shells use.
        const finishMs = new Map(finishersRef.current.map((f) => [f.slot, f.ms]));
        const slots = present.map((meta) => {
          const ms = finishMs.get(meta.slotIndex);
          const score = ms === undefined ? 0 : Math.max(1, 1_000_000 - Math.round(ms));
          return {
            slot: meta.slotIndex,
            userId: meta.userId,
            score,
            isBot: false,
          };
        });
        const ranks = denseRanks(slots.map((s) => s.score));
        const slotsRanked = slots.map((s, i) => ({ ...s, rank: ranks[i] }));
        const humansCount = slotsRanked.length;

        const supabase = getSupabaseBrowserClient();
        const humanIds = slotsRanked.map((s) => s.userId);
        const ratingByUser = new Map<
          string,
          { rating: number; matches: number; wins: number; draws: number; losses: number }
        >();
        if (supabase && humanIds.length > 0) {
          const { data: rows } = await supabase
            .from("live_ratings")
            .select("user_id, rating, matches, wins, draws, losses")
            .eq("game_kind", "sperm_race")
            .eq("level", trackVal)
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
          const existing = ratingByUser.get(s.userId);
          return {
            userId: s.userId,
            rating: existing?.rating ?? DEFAULT_RATING,
            matches: existing?.matches ?? 0,
            score: s.score,
            isBot: false,
          };
        });
        const eloByUser = new Map<string, EloUpdate>(updateRatings(eloInput).map((u) => [u.userId, u]));

        const allRanks = slotsRanked.map((s) => s.rank);
        const minRank = allRanks.length ? Math.min(...allRanks) : 0;
        const maxRank = allRanks.length ? Math.max(...allRanks) : 0;

        const playerUpdates = slotsRanked.map((s) => {
          const elo = eloByUser.get(s.userId);
          return {
            slot: s.slot,
            score: s.score,
            correct: s.rank === minRank ? 1 : 0,
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
        const guest = isGuestRef.current;
        if (humansCount >= 2 && !guest) {
          for (const s of slotsRanked) {
            const elo = eloByUser.get(s.userId);
            if (!elo) continue;
            const existing = ratingByUser.get(s.userId);
            const uniquelyHeld = slotsRanked.filter((r) => r.rank === s.rank).length === 1;
            const isWin = uniquelyHeld && s.rank === minRank;
            const isLoss = uniquelyHeld && s.rank === maxRank;
            const isDraw = !isWin && !isLoss;
            ratingUpserts.push({
              user_id: s.userId,
              level: trackVal,
              rating: elo.after,
              matches: (existing?.matches ?? 0) + 1,
              wins: (existing?.wins ?? 0) + (isWin ? 1 : 0),
              draws: (existing?.draws ?? 0) + (isDraw ? 1 : 0),
              losses: (existing?.losses ?? 0) + (isLoss ? 1 : 0),
            });
          }
        }

        // Retry on a dropped POST (mobile Safari backgrounding): the result
        // route's status=finished short-circuit makes retries idempotent.
        const body = JSON.stringify({
          matchId: mId,
          track: trackVal,
          taps,
          rating_kind: "sperm_race",
          humans_count: humansCount,
          bot_inserts: [],
          player_updates: playerUpdates,
          rating_upserts: ratingUpserts,
        });
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch("/api/sperm-race/result", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
              keepalive: true,
            });
            if (res.ok) {
              const data = await res.json() as { players?: StandingEntry[] };
              if (Array.isArray(data?.players)) setStandings(data.players);
              return;
            }
          } catch {
            // fall through to retry / final toast
          }
          if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
        toast.error("Couldn't save your result. Check your connection.");
      }
    };

    poll = setInterval(() => {
      const presentCount = Object.keys(presenceSlotsRef.current).length;
      const finishedCount = finishersRef.current.length;
      const elapsed = performance.now() - startedAt;
      if ((presentCount > 0 && finishedCount >= presentCount) || elapsed >= SNAPSHOT_MAX_MS) {
        run();
      }
    }, SNAPSHOT_POLL_MS);

    return () => {
      if (poll) clearInterval(poll);
    };
  }, [phase, matchId]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const playAgain = useCallback(() => {
    teardownChannel();
    practiceRef.current = false;
    practiceBotsRef.current = [];
    setPracticeBots([]);
    setMatchId(null);
    setJoinCode(null);
    setSlot(-1);
    setPresenceSlots({});
    setPositions({});
    setFinishers([]);
    setCodeInput("");
    setPhase("create");
  }, [teardownChannel]);

  const backToHub = useCallback(() => {
    teardownChannel();
    router.push("/brain-training");
  }, [teardownChannel, router]);

  const copyCode = useCallback(async () => {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [joinCode]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const presentSlots = Object.keys(presenceSlots).map(Number).sort((a, b) => a - b);
  const hostSlot = presentSlots.length ? presentSlots[0] : -1;
  const isHost = slot === hostSlot;
  const racers: Racer[] = practiceRef.current
    ? [
        {
          slot: 0,
          displayName: profile?.displayName ?? "You",
          avatarUrl: profile?.avatarUrl ?? null,
          pos: positions[0] ?? 0,
          isMe: true,
        },
        ...practiceBots.map((bot) => ({
          slot: bot.slot,
          displayName: bot.displayName,
          avatarUrl: null,
          pos: positions[bot.slot] ?? 0,
          isMe: false,
        })),
      ]
    : presentSlots.map((s) => {
        const meta = presenceSlots[s];
        return {
          slot: s,
          displayName: meta.displayName,
          avatarUrl: meta.avatarUrl,
          pos: positions[s] ?? 0,
          isMe: s === slot,
        };
      });

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!authChecked) {
    return <div className="mx-auto max-w-md px-4 pt-12 text-center text-sm text-muted">Loading…</div>;
  }

  if (!signedIn) {
    return (
      <GuestGate
        title="Sperm Race"
        description="Race your friends to the egg. Host or join a room with a code."
        backPath="/brain-training"
        onGuestAction={(user) => {
          setSignedIn(true);
          setUserId(user.id);
          setProfile(profileFromUser(user));
          isGuestRef.current = isAnonymousUser(user);
          setPhase("create");
        }}
      />
    );
  }

  if (phase === "create") {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <button onClick={backToHub} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Sperm Race</h1>
        <p className="mt-1 text-sm text-muted">Create a room or join one with a code.</p>

        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Track length</div>
          <div className="mt-2 flex gap-2">
            {([1, 2, 3] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTrack(t)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition-all ${
                  track === t
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-border bg-bg text-fg hover:border-[var(--accent)]/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          <Play className="h-5 w-5" />
          {busy ? "Creating…" : "Create room"}
        </button>
        <button
          onClick={() => setPhase("join")}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-4 text-sm font-bold text-fg hover:border-[var(--accent)]/40"
        >
          <Users className="h-5 w-5" /> Join with code
        </button>
        <button
          onClick={startPractice}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-bold text-muted hover:border-[var(--accent)]/40 hover:text-fg"
        >
          <Bot className="h-5 w-5" /> Practice vs bots
        </button>
        <p className="mt-2 text-center text-xs text-muted">Solo warm-up — not ranked, no XP.</p>
      </div>
    );
  }

  if (phase === "join") {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <button onClick={() => setPhase("create")} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Join a race</h1>
        <p className="mt-1 text-sm text-muted">Enter the 4-character code from your host.</p>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={4}
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))}
          placeholder="ABCD"
          className="mt-5 w-full rounded-2xl border border-border bg-surface px-4 py-4 text-center text-2xl font-black tracking-[0.4em] text-fg placeholder:text-muted/40 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        />
        <button
          onClick={handleJoin}
          disabled={busy || codeInput.length !== 4}
          className="mt-4 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {busy ? "Joining…" : "Join room"}
        </button>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <button onClick={backToHub} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Waiting for racers</h1>
        <p className="mt-1 text-sm text-muted">Share this code so friends can join.</p>

        {joinCode && (
          <div className="mt-5 rounded-2xl border border-border bg-surface p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted">Room code</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-4xl font-black tracking-[0.25em] text-[var(--accent)]">{joinCode}</span>
              <button
                onClick={copyCode}
                aria-label="Copy room code"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg text-fg hover:border-[var(--accent)]/40"
              >
                {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <Users className="h-4 w-4" /> Racers ({racers.length})
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {racers.map((p) => (
              <li key={p.slot} className="flex items-center gap-3">
                {p.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatarUrl} alt="" className="h-8 w-8 rounded-full border border-border object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "var(--accent)" }}>
                    {p.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium">{p.displayName}</span>
                {p.slot === hostSlot && (
                  <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">host</span>
                )}
              </li>
            ))}
            {racers.length === 0 && <li className="text-sm text-muted">Waiting…</li>}
          </ul>
        </div>

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={racers.length < 2}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            <Play className="h-5 w-5" />
            {racers.length < 2 ? "Need 2+ racers to start" : "Start race"}
          </button>
        ) : (
          <div className="mt-5 text-center text-sm text-muted">Waiting for host to start…</div>
        )}
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
            className="select-none text-center"
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

  if (phase === "racing") {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-bg" style={{ height: "100dvh", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="px-3 pb-2 pt-4 text-center text-xs font-bold uppercase tracking-widest text-muted">
          Tap A · B · A · B to swim
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <RaceTrack racers={racers} />
        </div>
        <TapPad onTap={onTap} nextButton={raceRef.current.lastButton === "A" ? "B" : "A"} />
      </div>
    );
  }

  // result
  const isPractice = practiceRef.current;
  const finishMsMap = new Map(finishers.map((f) => [f.slot, f.ms]));
  const myFinish = finishers.find((f) => f.slot === slot);

  // Practice names come from the local roster (no presence); a slot lookup that
  // covers me (slot 0) and each bot.
  const practiceName = (s: number): string =>
    s === 0
      ? profile?.displayName ?? "You"
      : practiceBots.find((b) => b.slot === s)?.displayName ?? `Player ${s + 1}`;

  // Server standings include all racers (DNFs too) once the result POST resolves.
  // Fall back to local finishers (finishers-only, no DNFs) until the fetch
  // completes. Practice mode is always the local path — it never posts.
  const displayOrder: Array<{ slot: number; rank: number; name: string; ms: number | null }> =
    standings && !isPractice
      ? [...standings]
          .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
          .map((s) => ({ slot: s.slot, rank: s.rank ?? 999, name: s.displayName, ms: finishMsMap.get(s.slot) ?? null }))
      : [...finishers]
          .sort((a, b) => a.ms - b.ms)
          .map((f, i) => ({
            slot: f.slot,
            rank: i + 1,
            name: isPractice ? practiceName(f.slot) : presenceSlots[f.slot]?.displayName ?? `Player ${f.slot + 1}`,
            ms: f.ms,
          }));

  const won = displayOrder.some((e) => e.slot === slot && e.rank === 1);

  return (
    <div className="mx-auto max-w-md px-4 pt-8 pb-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <Trophy className="h-10 w-10 text-[var(--accent)]" />
        {isPractice && (
          <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
            Practice · not ranked
          </span>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{won ? "You won!" : "Finished"}</h1>
        {myFinish && <p className="text-sm text-muted">Your time: {(myFinish.ms / 1000).toFixed(2)}s</p>}
      </div>
      <ul className="mt-6 flex flex-col gap-2">
        {displayOrder.map((entry) => {
          const isMe = entry.slot === slot;
          return (
            <li
              key={entry.slot}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${isMe ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-border bg-surface"}`}
            >
              <span className="w-6 shrink-0 text-center text-base font-black text-muted">{entry.rank}</span>
              <span className="flex-1 truncate text-sm font-bold">{entry.name}{isMe ? " (you)" : ""}</span>
              <span className="text-base font-black tabular-nums">
                {entry.ms !== null ? `${(entry.ms / 1000).toFixed(2)}s` : "DNF"}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        onClick={playAgain}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
        style={{ background: "var(--accent)" }}
      >
        <RotateCcw className="h-5 w-5" /> Play again
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
