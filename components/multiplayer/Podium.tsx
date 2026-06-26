"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bot, RotateCcw, ArrowLeft, Trophy } from "lucide-react";

export type PodiumPlayer = {
  slot: number;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  isBot: boolean;
  score: number;
  correct: number;
  rank: number;
  eloBefore: number | null;
  eloAfter: number | null;
};

type Props = {
  players: PodiumPlayer[];
  currentUserId: string | null;
  gameDisplayName: string;
  onPlayAgainAction: () => void;
  onBackAction: () => void;
  backLabel?: string;
  playAgainLabel?: string;
  extraAction?: ReactNode;
  guestPrompt?: boolean;
  scoreLabel?: string;
  metaFor?: (p: PodiumPlayer) => string;
};

function useCountUp(target: number | null, durationMs = 1200): number | null {
  const [value, setValue] = useState<number | null>(target);
  useEffect(() => {
    if (target === null) {
      setValue(null);
      return;
    }
    const start = performance.now();
    const from = 0;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

// Ranks arrive dense (1, 2, 2, 3); display them with standard competition
// ranking so a tie skips the next position (1, 2, 2, 4). The competition rank of
// an entry is the count of entries placed strictly above it, plus one.
function competitionRank(rank: number, allRanks: number[]) {
  return allRanks.filter((r) => r < rank).length + 1;
}

function rankBadge(rank: number, allRanks: number[]) {
  const shared = allRanks.filter((r) => r === rank).length > 1;
  const display = competitionRank(rank, allRanks);
  return shared ? `=${display}` : `${display}`;
}

function rankColor(rank: number): string {
  if (rank === 1) return "#f59e0b";
  if (rank === 2) return "#94a3b8";
  if (rank === 3) return "#b45309";
  return "var(--muted)";
}

function PlayerAvatar({ p, size = 40 }: { p: PodiumPlayer; size?: number }) {
  const px = `${size}px`;
  if (p.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.avatarUrl}
        alt={p.displayName}
        className="rounded-full object-cover"
        style={{ width: px, height: px }}
      />
    );
  }
  if (p.isBot) {
    return (
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: px,
          height: px,
          background: "color-mix(in srgb, var(--game) 18%, var(--surface))",
        }}
      >
        <Bot size={size * 0.5} style={{ color: "var(--game)" }} />
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: px,
        height: px,
        background: "color-mix(in srgb, var(--accent) 18%, var(--surface))",
        color: "var(--accent)",
        fontSize: size * 0.4,
      }}
    >
      {p.displayName[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function EloRow({ before, after }: { before: number; after: number }) {
  const animated = useCountUp(after);
  const delta = after - before;
  const color = delta > 0 ? "#10b981" : delta < 0 ? "#e11d48" : "var(--muted)";
  const sign = delta > 0 ? "+" : "";
  return (
    <div className="mt-1 flex items-center gap-2 text-xs">
      <span className="text-muted tabular-nums">{before}</span>
      <span className="text-muted">→</span>
      <span className="font-semibold tabular-nums" style={{ color }}>
        {animated ?? after}
      </span>
      <span className="font-bold tabular-nums" style={{ color }}>
        ({sign}{delta})
      </span>
    </div>
  );
}

export function Podium({ players, currentUserId, gameDisplayName, onPlayAgainAction, onBackAction, backLabel, playAgainLabel, extraAction, guestPrompt, scoreLabel, metaFor }: Props) {
  const router = useRouter();
  const sorted = [...players].sort((a, b) => a.rank - b.rank);
  const allRanks = sorted.map((p) => p.rank);

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-bg">
      <div className="mx-auto w-full max-w-md px-5 pb-8 pt-8" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--game))" }}
          >
            <Trophy size={28} style={{ color: "white" }} />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Final results</h2>
        </div>

        <div className="mb-6 space-y-2.5">
          {sorted.map((p) => {
            const isMe = !!currentUserId && p.userId === currentUserId;
            return (
              <div
                key={p.slot}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3.5"
                style={{
                  background: isMe
                    ? "color-mix(in srgb, var(--accent) 10%, var(--surface))"
                    : "var(--surface)",
                  borderColor: isMe ? "var(--accent)" : "var(--border)",
                }}
              >
                <span
                  className="w-7 shrink-0 text-center text-sm font-black tabular-nums"
                  style={{ color: rankColor(competitionRank(p.rank, allRanks)) }}
                >
                  {rankBadge(p.rank, allRanks)}
                </span>
                <PlayerAvatar p={p} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold">{p.displayName}</span>
                    {p.isBot && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: "color-mix(in srgb, var(--game) 16%, transparent)", color: "var(--game)" }}
                      >
                        Bot
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">{metaFor ? metaFor(p) : `${p.correct} correct`}</div>
                  {!p.isBot && p.eloBefore !== null && p.eloAfter !== null && (
                    <EloRow before={p.eloBefore} after={p.eloAfter} />
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-black tabular-nums" style={{ color: rankColor(p.rank) }}>
                    {p.score}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted">{scoreLabel ?? "pts"}</div>
                </div>
              </div>
            );
          })}
        </div>

        {guestPrompt && (
          <button
            onClick={() => router.push("/stats")}
            className="mb-4 block w-full rounded-2xl border border-border bg-surface px-4 py-3 text-left text-xs text-muted transition-colors hover:text-fg"
          >
            Create an account to save progress and climb the ranked ladder.
          </button>
        )}

        <div className="space-y-2.5">
          {extraAction}
          <button
            onClick={onPlayAgainAction}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: "var(--accent)" }}
          >
            <RotateCcw size={15} />
            {playAgainLabel ?? "Play again"}
          </button>
          <button
            onClick={onBackAction}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium transition-colors hover:bg-border/30"
          >
            <ArrowLeft size={15} />
            {backLabel ?? `Back to ${gameDisplayName}`}
          </button>
        </div>
      </div>
    </div>
  );
}
