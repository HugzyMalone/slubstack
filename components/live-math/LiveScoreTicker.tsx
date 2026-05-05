"use client";

import { Bot } from "lucide-react";

export type TickerPlayer = {
  slot: number;
  displayName: string;
  avatarUrl: string | null;
  isBot: boolean;
  score: number;
  isMe: boolean;
};

type Props = { players: TickerPlayer[] };

function TinyAvatar({ p }: { p: TickerPlayer }) {
  if (p.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={p.avatarUrl} alt={p.displayName} className="h-6 w-6 rounded-full object-cover" />
    );
  }
  if (p.isBot) {
    return (
      <div
        className="flex h-6 w-6 items-center justify-center rounded-full"
        style={{ background: "color-mix(in srgb, var(--game) 16%, var(--surface))" }}
      >
        <Bot size={12} style={{ color: "var(--game)" }} />
      </div>
    );
  }
  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
      style={{ background: "color-mix(in srgb, var(--accent) 18%, var(--surface))", color: "var(--accent)" }}
    >
      {p.displayName[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export function LiveScoreTicker({ players }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="grid grid-cols-4 gap-1.5 px-3 pt-2">
      {sorted.map((p) => (
        <div
          key={p.slot}
          className="flex items-center gap-1.5 rounded-xl px-2 py-1.5"
          style={{
            background: p.isMe
              ? "color-mix(in srgb, var(--accent) 12%, var(--surface))"
              : "var(--surface)",
            border: `1px solid ${p.isMe ? "var(--accent)" : "var(--border)"}`,
          }}
        >
          <TinyAvatar p={p} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[10px] font-semibold leading-tight">{p.displayName}</span>
            <span className="text-sm font-black tabular-nums leading-tight" style={{ color: p.isMe ? "var(--accent)" : "var(--fg)" }}>
              {p.score}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
