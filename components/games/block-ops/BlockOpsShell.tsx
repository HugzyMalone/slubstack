"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ArrowLeft, Bot, Check, Copy, Crosshair, Home, Play, RotateCcw, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { profileFromUser } from "@/lib/multiplayer/guest";
import { GuestGate } from "@/components/multiplayer/GuestGate";
import { brainTrainingStore } from "@/lib/store";
import { awardQuestProgress } from "@/lib/questsStore";
import { pushLeagueXp } from "@/lib/leagues";
import { XP_GAME_COMPLETE } from "@/lib/xp";
import { BlockOpsEngine } from "@/lib/games/block-ops/engine";
import { sfxCountBeep, sfxEnd } from "@/lib/games/block-ops/audio";
import {
  BOT_NAMES,
  COMBATANTS,
  TEAMS,
  assignTeams,
  xpForMatch,
  type EndPayload,
  type EntityId,
  type GoPayload,
  type HudState,
  type KillFeedEntry,
  type NetEvent,
  type RosterEntry,
  type ScoreRow,
  type Team,
} from "@/lib/games/block-ops/types";
import { Hud } from "./Hud";

type Phase = "auth" | "menu" | "join" | "lobby" | "countdown" | "playing" | "result";

type PresenceMeta = {
  slotIndex: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

type RoomResp = { matchId: string; joinCode?: string; seed: string; slotIndex: number };

type PendingMatch = {
  roster: RosterEntry[];
  localId: EntityId;
  isHost: boolean;
  practice: boolean;
  seed: string;
};

const NET_EVENTS: NetEvent[] = ["st", "bt", "fx", "ht", "dt", "end"];

const INITIAL_HUD: HudState = {
  hp: 100,
  ammo: 30,
  magSize: 30,
  weapon: "rifle",
  reloading: false,
  scores: [0, 0],
  msLeft: 4 * 60_000,
  kills: 0,
  deaths: 0,
  ads: false,
  dead: null,
  spawnProtected: false,
};

export function BlockOpsShell(): React.JSX.Element {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ displayName: string; avatarUrl: string | null } | null>(null);

  const [phase, setPhase] = useState<Phase>("auth");
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [presenceSlots, setPresenceSlots] = useState<Record<number, PresenceMeta>>({});
  const [matchLive, setMatchLive] = useState(false);
  const [countNum, setCountNum] = useState(3);
  const [pendingMatch, setPendingMatch] = useState<PendingMatch | null>(null);

  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const [feed, setFeed] = useState<KillFeedEntry[]>([]);
  const [hitmarker, setHitmarker] = useState<{ key: number; hs: boolean } | null>(null);
  const [damageKey, setDamageKey] = useState(0);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [sens, setSens] = useState(1);
  const [adsOn, setAdsOn] = useState(false);
  const [endResult, setEndResult] = useState<EndPayload | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BlockOpsEngine | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const slotRef = useRef(-1);
  const phaseRef = useRef<Phase>("auth");
  const presenceRef = useRef<Record<number, PresenceMeta>>({});
  const matchRef = useRef<PendingMatch | null>(null);
  const xpAwardedRef = useRef(false);
  const wasLockedRef = useRef(false);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { presenceRef.current = presenceSlots; }, [presenceSlots]);
  useEffect(() => { matchRef.current = pendingMatch; }, [pendingMatch]);
  useEffect(() => {
    setIsTouch(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  }, []);

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
        setPhase("menu");
      }
      setAuthChecked(true);
    });
  }, []);

  // ── Teardown ───────────────────────────────────────────────────────────────
  const disposeEngine = useCallback(() => {
    engineRef.current?.dispose();
    engineRef.current = null;
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

  useEffect(
    () => () => {
      disposeEngine();
      teardownChannel();
    },
    [disposeEngine, teardownChannel],
  );

  // ── Match start ────────────────────────────────────────────────────────────
  const startMatch = useCallback((match: PendingMatch) => {
    xpAwardedRef.current = false;
    setEndResult(null);
    setFeed([]);
    setHud(INITIAL_HUD);
    setDamageKey(0);
    setMatchLive(false);
    setPauseOpen(false);
    setScoreboardOpen(false);
    setPendingMatch(match);
    setPhase("countdown");
  }, []);

  const buildRoster = useCallback((): RosterEntry[] => {
    const presence = presenceRef.current;
    const slots = Object.keys(presence).map(Number).sort((a, b) => a - b);
    const teamsBySlot = assignTeams(slots);
    const roster: RosterEntry[] = slots.map((s) => ({
      id: `h${s}`,
      slot: s,
      name: presence[s].displayName,
      team: teamsBySlot.get(s) as Team,
      isBot: false,
      avatarUrl: presence[s].avatarUrl,
    }));
    const counts: [number, number] = [0, 0];
    roster.forEach((r) => counts[r.team]++);
    let bi = 0;
    while (roster.length < COMBATANTS) {
      const team: Team = counts[0] <= counts[1] ? 0 : 1;
      counts[team]++;
      roster.push({ id: `b${bi}`, slot: null, name: BOT_NAMES[bi % BOT_NAMES.length], team, isBot: true, avatarUrl: null });
      bi++;
    }
    return roster;
  }, []);

  // ── Realtime channel ───────────────────────────────────────────────────────
  const subscribeChannel = useCallback(
    async (mId: string, mySlot: number) => {
      if (!profile || !userId) return;
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      teardownChannel();

      const channel = supabase.channel(`live:block_ops:${mId}`, {
        config: { presence: { key: String(mySlot) } },
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceMeta>();
        const next: Record<number, PresenceMeta> = {};
        for (const key of Object.keys(state)) {
          const metas = state[key];
          if (metas && metas.length > 0) next[Number(key)] = metas[0];
        }
        setPresenceSlots(next);

        const engine = engineRef.current;
        const match = matchRef.current;
        if (engine && match && !match.practice && (phaseRef.current === "playing" || phaseRef.current === "countdown")) {
          const presentHumanSlots = match.roster
            .filter((r) => !r.isBot && r.slot !== null && next[r.slot])
            .map((r) => r.slot as number);
          for (const r of match.roster) {
            if (!r.isBot && r.slot !== null && !next[r.slot]) engine.dropEntity(r.id);
          }
          const lowest = presentHumanSlots.length ? Math.min(...presentHumanSlots) : -1;
          if (lowest === slotRef.current) engine.becomeHost();
        }
      });

      channel.on("broadcast", { event: "go" }, ({ payload }) => {
        const p = payload as GoPayload;
        if (phaseRef.current !== "lobby" && phaseRef.current !== "result") return;
        const meId = `h${slotRef.current}`;
        if (!p.roster.some((r) => r.id === meId)) {
          setMatchLive(true);
          return;
        }
        startMatch({ roster: p.roster, localId: meId, isHost: false, practice: false, seed: p.seed });
      });

      for (const ev of NET_EVENTS) {
        channel.on("broadcast", { event: ev }, ({ payload }) => {
          const engine = engineRef.current;
          if (engine) {
            engine.onNet(ev, payload);
          } else if (phaseRef.current === "lobby" && (ev === "st" || ev === "bt")) {
            setMatchLive(true);
          }
          if (ev === "end" && phaseRef.current === "lobby") setMatchLive(false);
        });
      }

      channel.subscribe();
      await channel.track({
        slotIndex: mySlot,
        userId,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      } satisfies PresenceMeta);

      channelRef.current = channel;
    },
    [profile, userId, teardownChannel, startMatch],
  );

  // ── Rooms ──────────────────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (busy || !profile || !userId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/block-ops/room", { method: "POST" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as RoomResp;
      setJoinCode(data.joinCode ?? null);
      slotRef.current = data.slotIndex;
      setPhase("lobby");
      await subscribeChannel(data.matchId, data.slotIndex);
    } catch (err) {
      console.error("[BlockOps] create room failed:", err);
      toast.error("Could not create a room. Try again.");
    } finally {
      setBusy(false);
    }
  }, [busy, profile, userId, subscribeChannel]);

  const handleJoin = useCallback(async () => {
    if (busy || !profile || !userId || codeInput.length !== 4) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/block-ops/room?code=${encodeURIComponent(codeInput)}`, { method: "POST" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as RoomResp;
      setJoinCode(codeInput);
      slotRef.current = data.slotIndex;
      setPhase("lobby");
      await subscribeChannel(data.matchId, data.slotIndex);
    } catch (err) {
      console.error("[BlockOps] join room failed:", err);
      toast.error("Could not join — check the code.");
    } finally {
      setBusy(false);
    }
  }, [busy, profile, userId, codeInput, subscribeChannel]);

  const startPractice = useCallback(() => {
    if (!profile) return;
    const roster: RosterEntry[] = [
      { id: "h0", slot: 0, name: profile.displayName, team: 0, isBot: false, avatarUrl: profile.avatarUrl },
    ];
    const counts: [number, number] = [1, 0];
    for (let bi = 0; roster.length < COMBATANTS; bi++) {
      const team: Team = counts[0] <= counts[1] ? 0 : 1;
      counts[team]++;
      roster.push({ id: `b${bi}`, slot: null, name: BOT_NAMES[bi % BOT_NAMES.length], team, isBot: true, avatarUrl: null });
    }
    slotRef.current = 0;
    startMatch({ roster, localId: "h0", isHost: true, practice: true, seed: `practice:${Date.now()}` });
  }, [profile, startMatch]);

  const handleStart = useCallback(() => {
    const slots = Object.keys(presenceRef.current).map(Number);
    const hostSlot = slots.length ? Math.min(...slots) : -1;
    if (slotRef.current !== hostSlot) return;
    const roster = buildRoster();
    const seed = Math.random().toString(36).slice(2, 12);
    channelRef.current?.send({ type: "broadcast", event: "go", payload: { seed, roster } satisfies GoPayload });
    startMatch({ roster, localId: `h${slotRef.current}`, isHost: true, practice: false, seed });
  }, [buildRoster, startMatch]);

  // ── Engine lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "countdown" || !pendingMatch) return;
    const container = containerRef.current;
    if (!container || engineRef.current) return;

    let engine: BlockOpsEngine;
    try {
      engine = new BlockOpsEngine({
        container,
        localId: pendingMatch.localId,
        roster: pendingMatch.roster,
        isHost: pendingMatch.isHost,
        practice: pendingMatch.practice,
        seed: pendingMatch.seed,
        send: (event, payload) => {
          channelRef.current?.send({ type: "broadcast", event, payload });
        },
        events: {
          onHud: (h) => setHud(h),
          onKillFeed: (entry) => {
            setFeed((prev) => [...prev.slice(-4), entry]);
            setTimeout(() => setFeed((prev) => prev.filter((f) => f.key !== entry.key)), 4200);
          },
          onHitmarker: (hs) => setHitmarker((prev) => ({ key: (prev?.key ?? 0) + 1, hs })),
          onDamageFlash: () => setDamageKey((k) => k + 1),
          onEnd: (p) => setEndResult(p),
          onPointerLock: (locked) => setPointerLocked(locked),
        },
      });
    } catch (err) {
      console.error("[BlockOps] engine init failed:", err);
      toast.error("Could not start the 3D engine on this device.");
      setPhase("menu");
      return;
    }
    engineRef.current = engine;
    setSens(engine.getSensitivity());

    setCountNum(3);
    sfxCountBeep(false);
    let n = 3;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const step = () => {
      n--;
      if (n > 0) {
        setCountNum(n);
        sfxCountBeep(false);
        timers.push(setTimeout(step, 900));
      } else {
        setCountNum(0);
        sfxCountBeep(true);
        engine.begin();
        setPhase("playing");
      }
    };
    timers.push(setTimeout(step, 900));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, pendingMatch]);

  // Result transition once the engine reports the end.
  useEffect(() => {
    if (!endResult || phaseRef.current === "result") return;
    const t = setTimeout(() => {
      disposeEngine();
      setPhase("result");
    }, 900);
    return () => clearTimeout(t);
  }, [endResult, disposeEngine]);

  // XP award
  useEffect(() => {
    if (phase !== "result" || !endResult || xpAwardedRef.current) return;
    xpAwardedRef.current = true;
    const match = matchRef.current;
    const myRow = endResult.rows.find((r) => r.id === match?.localId);
    const myTeam = myRow?.team ?? 0;
    const won = endResult.scores[myTeam] > endResult.scores[myTeam === 0 ? 1 : 0];
    sfxEnd(won);
    if (match && !match.practice) {
      const xp = xpForMatch(myRow?.kills ?? 0, XP_GAME_COMPLETE);
      brainTrainingStore.getState().addXp(xp);
      awardQuestProgress("xp", xp);
      pushLeagueXp(xp);
    }
  }, [phase, endResult]);

  // Desktop pause on pointer-lock loss; scoreboard on Tab.
  useEffect(() => {
    if (phase !== "playing") return;
    if (pointerLocked) {
      wasLockedRef.current = true;
      setPauseOpen(false);
    } else if (wasLockedRef.current && !isTouch && !endResult) {
      setPauseOpen(true);
    }
  }, [pointerLocked, phase, isTouch, endResult]);

  useEffect(() => {
    if (phase !== "playing" || isTouch) return;
    const down = (e: KeyboardEvent) => {
      if (e.code === "Tab") setScoreboardOpen(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Tab") setScoreboardOpen(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, isTouch]);

  useEffect(() => {
    if (!scoreboardOpen) return;
    const engine = engineRef.current;
    if (engine) setRows(engine.getScoreRows());
    const iv = setInterval(() => {
      const eng = engineRef.current;
      if (eng) setRows(eng.getScoreRows());
    }, 600);
    return () => clearInterval(iv);
  }, [scoreboardOpen]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const leaveMatch = useCallback(() => {
    disposeEngine();
    setPendingMatch(null);
    setPauseOpen(false);
    setEndResult(null);
    wasLockedRef.current = false;
    if (matchRef.current?.practice) {
      teardownChannel();
      setPhase("menu");
    } else {
      setPhase("lobby");
    }
  }, [disposeEngine, teardownChannel]);

  const backToMenu = useCallback(() => {
    disposeEngine();
    teardownChannel();
    setPendingMatch(null);
    setEndResult(null);
    setJoinCode(null);
    setPresenceSlots({});
    setCodeInput("");
    setMatchLive(false);
    wasLockedRef.current = false;
    slotRef.current = -1;
    setPhase("menu");
  }, [disposeEngine, teardownChannel]);

  const backToHub = useCallback(() => {
    disposeEngine();
    teardownChannel();
    router.push("/games");
  }, [disposeEngine, teardownChannel, router]);

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
  const isHost = slotRef.current === hostSlot;
  const lobbyTeams = assignTeams(presentSlots);
  const myTeam = pendingMatch?.roster.find((r) => r.id === pendingMatch.localId)?.team ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!authChecked) {
    return <div className="mx-auto max-w-md px-4 pt-12 text-center text-sm text-muted">Loading…</div>;
  }

  if (!signedIn) {
    return (
      <GuestGate
        title="Block Ops"
        description="A 3v3 team-deathmatch arena shooter. Host a room, share the code, bots fill the gaps."
        backPath="/games"
        onGuestAction={(user) => {
          setSignedIn(true);
          setUserId(user.id);
          setProfile(profileFromUser(user));
          setPhase("menu");
        }}
      />
    );
  }

  if (phase === "menu") {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <button onClick={backToHub} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Block Ops</h1>
        <p className="mt-1 text-sm text-muted">
          Team deathmatch, 3v3. First team to 30 eliminations wins — bots fill any empty slots.
        </p>

        <div className="mt-5 rounded-2xl border border-border bg-surface p-4 text-[13px] leading-relaxed text-muted">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fg">
            <Crosshair size={14} /> How it plays
          </div>
          <p className="mt-2">
            {isTouch
              ? "Left stick to move, drag right side to aim, big red button to fire. ADS toggles aim-down-sights."
              : "WASD to move, mouse to aim, left-click to fire, right-click to aim down sights. Shift sprints, R reloads, Q swaps weapon, Tab shows the scoreboard."}
          </p>
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
        <p className="mt-2 text-center text-xs text-muted">Practice is solo warm-up — no XP.</p>
      </div>
    );
  }

  if (phase === "join") {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <button onClick={() => setPhase("menu")} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Join a match</h1>
        <p className="mt-1 text-sm text-muted">Enter the 4-letter code from your host.</p>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={4}
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
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

  if (phase === "lobby") {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <button onClick={backToMenu} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
          <ArrowLeft size={14} /> Leave room
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Squad up</h1>
        <p className="mt-1 text-sm text-muted">Share the code — empty slots become bots.</p>

        {matchLive && (
          <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm font-medium text-amber-600 dark:text-amber-300">
            Match in progress — you&apos;ll be in the next one when the host restarts.
          </div>
        )}

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

        <div className="mt-5 grid grid-cols-2 gap-3">
          {([0, 1] as Team[]).map((t) => (
            <div key={t} className="rounded-2xl border border-border bg-surface p-3">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: TEAMS[t].color }}>
                {TEAMS[t].name}
              </div>
              <ul className="mt-2 flex flex-col gap-1.5">
                {presentSlots
                  .filter((s) => lobbyTeams.get(s) === t)
                  .map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ background: TEAMS[t].color }} />
                      <span className="truncate">
                        {presenceSlots[s]?.displayName}
                        {s === slotRef.current ? " (you)" : ""}
                      </span>
                      {s === hostSlot && (
                        <span className="rounded-full bg-[var(--accent)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--accent)]">host</span>
                      )}
                    </li>
                  ))}
                {Array.from({ length: Math.max(0, 3 - presentSlots.filter((s) => lobbyTeams.get(s) === t).length) }).map((_, i) => (
                  <li key={`bot-${i}`} className="flex items-center gap-2 text-sm text-muted">
                    <Bot size={13} /> Bot
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            onClick={handleStart}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: "var(--accent)" }}
          >
            <Play className="h-5 w-5" /> Start match
          </button>
        ) : (
          <div className="mt-5 text-center text-sm text-muted">Waiting for the host to start…</div>
        )}
      </div>
    );
  }

  if (phase === "countdown" || phase === "playing") {
    return (
      <div className="fixed inset-0 z-40 bg-black" style={{ height: "100dvh" }}>
        <div ref={containerRef} className="absolute inset-0" />
        {phase === "playing" && (
          <Hud
            hud={hud}
            feed={feed}
            hitmarker={hitmarker}
            damageKey={damageKey}
            myTeam={myTeam}
            myId={pendingMatch?.localId ?? ""}
            touch={isTouch}
            pointerLocked={pointerLocked}
            scoreboardOpen={scoreboardOpen}
            rows={rows}
            onLockRequest={() => engineRef.current?.requestPointerLock()}
            onTouchMove={(x, y) => engineRef.current?.setTouchMove(x, y)}
            onTouchLook={(dx, dy) => engineRef.current?.addTouchLook(dx, dy)}
            onFire={(down) => engineRef.current?.setTouchFire(down)}
            onAdsToggle={() => {
              setAdsOn((v) => {
                engineRef.current?.setTouchAds(!v);
                return !v;
              });
            }}
            adsOn={adsOn}
            onJump={() => engineRef.current?.touchJumpPress()}
            onReload={() => engineRef.current?.touchReload()}
            onSwap={() => engineRef.current?.touchSwap()}
            onScoreboard={(open) => setScoreboardOpen(open)}
            onPause={() => {
              setPauseOpen(true);
              engineRef.current?.setPaused(true);
            }}
          />
        )}

        <AnimatePresence>
          {phase === "countdown" && (
            <motion.div
              key={countNum}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-[110px] font-black text-white drop-shadow-lg">{countNum > 0 ? countNum : "GO"}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {endResult && phase === "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-5xl font-black uppercase tracking-widest text-white drop-shadow-lg">
              {endResult.scores[myTeam] > endResult.scores[myTeam === 0 ? 1 : 0]
                ? "Victory"
                : endResult.scores[myTeam] < endResult.scores[myTeam === 0 ? 1 : 0]
                  ? "Defeat"
                  : "Draw"}
            </span>
          </div>
        )}

        {pauseOpen && !endResult && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-surface p-5">
              <h2 className="text-lg font-bold">Paused</h2>
              <div className="mt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Sensitivity · {sens.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.05}
                  value={sens}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setSens(v);
                    engineRef.current?.setSensitivity(v);
                  }}
                  className="mt-2 w-full accent-[var(--accent)]"
                />
              </div>
              <button
                onClick={() => {
                  setPauseOpen(false);
                  engineRef.current?.setPaused(false);
                  if (!isTouch) engineRef.current?.requestPointerLock();
                }}
                className="mt-5 w-full rounded-2xl py-3.5 text-sm font-bold text-white"
                style={{ background: "var(--accent)" }}
              >
                Resume
              </button>
              <button
                onClick={leaveMatch}
                className="mt-2 w-full rounded-2xl border border-border py-3 text-sm font-medium text-fg"
              >
                Leave match
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // result
  const myRow = endResult?.rows.find((r) => r.id === pendingMatch?.localId);
  const won = endResult ? endResult.scores[myTeam] > endResult.scores[myTeam === 0 ? 1 : 0] : false;
  const draw = endResult ? endResult.scores[0] === endResult.scores[1] : false;

  return (
    <div className="mx-auto max-w-md px-4 pt-8 pb-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <Trophy className="h-10 w-10" style={{ color: won ? "#f59e0b" : "var(--accent)" }} />
        {pendingMatch?.practice && (
          <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
            Practice · no XP
          </span>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{draw ? "Draw" : won ? "Victory!" : "Defeat"}</h1>
        {endResult && (
          <p className="text-sm text-muted">
            <span style={{ color: TEAMS[0].color }}>{TEAMS[0].name} {endResult.scores[0]}</span>
            {" — "}
            <span style={{ color: TEAMS[1].color }}>{TEAMS[1].name} {endResult.scores[1]}</span>
            {myRow && ` · you went ${myRow.kills}/${myRow.deaths}`}
          </p>
        )}
      </div>

      <ul className="mt-6 flex flex-col gap-2">
        {endResult?.rows.map((r, i) => (
          <li
            key={r.id}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              r.id === pendingMatch?.localId ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-border bg-surface"
            }`}
          >
            <span className="w-6 shrink-0 text-center text-base font-black text-muted">{i + 1}</span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TEAMS[r.team].color }} />
            <span className="flex-1 truncate text-sm font-bold">
              {r.name}
              {r.id === pendingMatch?.localId ? " (you)" : ""}
              {r.isBot && <span className="ml-1.5 text-[9px] font-bold uppercase text-muted">bot</span>}
            </span>
            <span className="text-base font-black tabular-nums">
              {r.kills}/{r.deaths}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          if (pendingMatch?.practice) {
            setEndResult(null);
            startPractice();
          } else {
            setEndResult(null);
            setPendingMatch(null);
            setPhase("lobby");
          }
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
        style={{ background: "var(--accent)" }}
      >
        <RotateCcw className="h-5 w-5" /> Play again
      </button>
      <button
        onClick={backToHub}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium"
      >
        <Home className="h-4 w-4" /> Back to Games
      </button>
    </div>
  );
}
