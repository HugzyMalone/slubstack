"use client";

import { Bot, Flag } from "lucide-react";

export type TickerPlayer = {
  slot: number;
  displayName: string;
  avatarUrl: string | null;
  isBot: boolean;
  score: number;
  isMe: boolean;
};

type Props = { players: TickerPlayer[] };

function HorseAvatar({ p }: { p: TickerPlayer }) {
  const ring = p.isMe ? "var(--accent)" : "var(--border)";
  if (p.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.avatarUrl}
        alt={p.displayName}
        className="h-7 w-7 rounded-full object-cover"
        style={{ boxShadow: `0 0 0 2px ${ring}` }}
      />
    );
  }
  if (p.isBot) {
    return (
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{
          background: "color-mix(in srgb, var(--game) 18%, var(--surface))",
          boxShadow: `0 0 0 2px ${ring}`,
        }}
      >
        <Bot size={14} style={{ color: "var(--game)" }} />
      </div>
    );
  }
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
      style={{
        background: "color-mix(in srgb, var(--accent) 18%, var(--surface))",
        color: "var(--accent)",
        boxShadow: `0 0 0 2px ${ring}`,
      }}
    >
      {p.displayName[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export function LiveScoreTicker({ players }: Props) {
  const lanes = [...players].sort((a, b) => a.slot - b.slot);
  const maxScore = Math.max(1, ...players.map((p) => p.score));

  return (
    <div className="px-3 pt-2">
      <div
        className="relative overflow-hidden rounded-2xl border px-3 py-2.5"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <div
          className="pointer-events-none absolute bottom-2.5 top-2.5 w-px"
          style={{
            right: "0.75rem",
            background: `repeating-linear-gradient(to bottom, var(--game) 0, var(--game) 4px, transparent 4px, transparent 8px)`,
          }}
        />
        <Flag
          size={11}
          className="pointer-events-none absolute right-1.5 top-1"
          style={{ color: "var(--game)" }}
        />

        <div className="space-y-1.5">
          {lanes.map((p) => {
            const pct = Math.min(88, (p.score / maxScore) * 88);
            return (
              <div key={p.slot} className="relative h-7">
                <div
                  className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
                  style={{
                    background: `repeating-linear-gradient(to right, var(--border) 0, var(--border) 3px, transparent 3px, transparent 7px)`,
                  }}
                />
                <div
                  className="absolute top-1/2 flex items-center gap-1.5"
                  style={{
                    left: `${pct}%`,
                    transform: "translateY(-50%)",
                    transition: "left 350ms ease-out",
                  }}
                >
                  <HorseAvatar p={p} />
                  <span
                    className="text-xs font-black tabular-nums whitespace-nowrap"
                    style={{ color: p.isMe ? "var(--accent)" : "var(--fg)" }}
                  >
                    {p.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
