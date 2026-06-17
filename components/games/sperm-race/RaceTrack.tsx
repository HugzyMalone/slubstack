"use client";

import React from "react";
import { Egg } from "lucide-react";

export type Racer = {
  slot: number;
  displayName: string;
  avatarUrl: string | null;
  pos: number;
  isMe: boolean;
};

type RaceTrackProps = {
  racers: Racer[];
};

function Sperm({ racer }: { racer: Racer }): React.JSX.Element {
  const left = `${Math.min(100, racer.pos * 100)}%`;
  return (
    <div className="relative h-12 overflow-hidden rounded-2xl border border-border bg-surface">
      <div
        className="absolute right-2 top-1/2 -translate-y-1/2"
        style={{ color: "color-mix(in srgb, var(--accent) 50%, var(--muted))" }}
      >
        <Egg size={28} fill="currentColor" />
      </div>
      <div
        className="absolute top-1/2 flex items-center gap-1 transition-[left] duration-75 ease-linear"
        style={{ left, transform: "translate(-50%, -50%)" }}
      >
        {racer.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={racer.avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full border-2 object-cover"
            style={{ borderColor: racer.isMe ? "var(--accent)" : "var(--border)" }}
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black text-white"
            style={{
              background: racer.isMe ? "var(--accent)" : "var(--muted)",
              borderColor: racer.isMe ? "var(--accent)" : "var(--border)",
            }}
          >
            {racer.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

export function RaceTrack({ racers }: RaceTrackProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2 px-3">
      {racers.map((r) => (
        <div key={r.slot} className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-1">
            <span className={`max-w-[10rem] truncate text-xs font-semibold ${r.isMe ? "text-[var(--accent)]" : "text-muted"}`}>
              {r.displayName}
              {r.isMe ? " (you)" : ""}
            </span>
            <span className="text-xs font-bold tabular-nums text-muted">{Math.round(r.pos * 100)}%</span>
          </div>
          <Sperm racer={r} />
        </div>
      ))}
    </div>
  );
}
