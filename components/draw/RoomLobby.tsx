"use client";

import React, { useState } from "react";
import { Copy, Play, Users, ArrowLeft, Check } from "lucide-react";

type Player = {
  slot: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

type RoomLobbyProps = {
  phase: "create" | "join" | "waiting";
  roomCode?: string;
  players: Player[];
  onCreate: (opts: { totalRounds: number; roundDurationMs: number }) => void;
  onJoin: (code: string) => void;
  onStart: () => void;
  onBack: () => void;
  onSwitchPhase: (phase: "create" | "join") => void;
  isHost: boolean;
  busy?: boolean;
};

const DURATION_OPTIONS = [
  { label: "45s", ms: 45_000 },
  { label: "60s", ms: 60_000 },
  { label: "90s", ms: 90_000 },
] as const;

const ROUNDS_OPTIONS = [1, 2, 3] as const;

export function RoomLobby({
  phase,
  roomCode,
  players,
  onCreate,
  onJoin,
  onStart,
  onBack,
  onSwitchPhase,
  isHost,
  busy,
}: RoomLobbyProps): React.JSX.Element {
  const [code, setCode] = useState("");
  const [totalRounds, setTotalRounds] = useState<number>(2);
  const [roundDurationMs, setRoundDurationMs] = useState<number>(60_000);
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (phase === "waiting" && roomCode) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <button
          onClick={onBack}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Waiting for players</h1>
        <p className="mt-1 text-sm text-muted">Share this code so friends can join.</p>

        <div className="mt-5 rounded-2xl border border-border bg-surface p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Room code</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-4xl font-black tracking-[0.25em] text-[var(--accent)]">
              {roomCode}
            </span>
            <button
              onClick={copy}
              aria-label="Copy room code"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-bg text-fg hover:border-[var(--accent)]/40"
            >
              {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <Users className="h-4 w-4" /> Players ({players.length})
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {players.map((p) => (
              <li key={p.slot} className="flex items-center gap-3">
                {p.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    {p.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium">{p.displayName}</span>
                {p.slot === 0 ? (
                  <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                    host
                  </span>
                ) : null}
              </li>
            ))}
            {players.length === 0 ? (
              <li className="text-sm text-muted">Waiting…</li>
            ) : null}
          </ul>
        </div>

        {isHost ? (
          <button
            onClick={onStart}
            disabled={players.length < 2}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            <Play className="h-5 w-5" />
            {players.length < 2 ? "Need 2+ players to start" : "Start match"}
          </button>
        ) : (
          <div className="mt-5 text-center text-sm text-muted">
            Waiting for host to start…
          </div>
        )}
      </div>
    );
  }

  if (phase === "join") {
    return (
      <div className="mx-auto max-w-md px-4 pt-6 pb-8">
        <button
          onClick={() => onSwitchPhase("create")}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Join a room</h1>
        <p className="mt-1 text-sm text-muted">Enter the 4-letter code from your host.</p>

        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
          placeholder="ABCD"
          className="mt-5 w-full rounded-2xl border border-border bg-surface px-4 py-4 text-center text-2xl font-black tracking-[0.4em] text-fg placeholder:text-muted/40 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        />

        <button
          onClick={() => code.length === 4 && onJoin(code)}
          disabled={busy || code.length !== 4}
          className="mt-4 w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {busy ? "Joining…" : "Join room"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-8">
      <button
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft size={14} /> Back
      </button>
      <h1 className="text-2xl font-bold tracking-tight">Draw My Thing</h1>
      <p className="mt-1 text-sm text-muted">Create a room or join one with a code.</p>

      <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-muted">
          Rounds per player
        </div>
        <div className="mt-2 flex gap-2">
          {ROUNDS_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setTotalRounds(n)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition-all ${
                totalRounds === n
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-border bg-bg text-fg hover:border-[var(--accent)]/40"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">
          Round length
        </div>
        <div className="mt-2 flex gap-2">
          {DURATION_OPTIONS.map((o) => (
            <button
              key={o.ms}
              onClick={() => setRoundDurationMs(o.ms)}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition-all ${
                roundDurationMs === o.ms
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-border bg-bg text-fg hover:border-[var(--accent)]/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onCreate({ totalRounds, roundDurationMs })}
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        <Play className="h-5 w-5" />
        {busy ? "Creating…" : "Create room"}
      </button>

      <button
        onClick={() => onSwitchPhase("join")}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-4 text-sm font-bold text-fg hover:border-[var(--accent)]/40"
      >
        <Users className="h-5 w-5" />
        Join with code
      </button>
    </div>
  );
}
