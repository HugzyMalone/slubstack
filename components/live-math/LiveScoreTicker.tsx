"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Flag } from "lucide-react";
import { motion } from "framer-motion";

export type TickerPlayer = {
  slot: number;
  displayName: string;
  avatarUrl: string | null;
  isBot: boolean;
  score: number;
  isMe: boolean;
};

type Props = { players: TickerPlayer[] };

function useCountUp(target: number, durationMs = 450): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const progress = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

function HorseAvatar({ p, bumpKey }: { p: TickerPlayer; bumpKey: number }) {
  const ring = p.isMe ? "var(--accent)" : "var(--border)";
  const inner = (() => {
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
  })();

  return (
    <motion.div
      key={bumpKey}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.18, 1] }}
      transition={{ duration: 0.35, ease: "easeOut", times: [0, 0.4, 1] }}
    >
      {inner}
    </motion.div>
  );
}

function Lane({ p, maxScore }: { p: TickerPlayer; maxScore: number }) {
  const displayedScore = useCountUp(p.score, 450);
  const pct = Math.min(88, (p.score / maxScore) * 88);
  return (
    <div className="relative h-6">
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
          transition: "left 450ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <HorseAvatar p={p} bumpKey={p.score} />
        <span
          className="text-xs font-black tabular-nums whitespace-nowrap"
          style={{ color: p.isMe ? "var(--accent)" : "var(--fg)" }}
        >
          {displayedScore}
        </span>
      </div>
    </div>
  );
}

export function LiveScoreTicker({ players }: Props) {
  const lanes = [...players].sort((a, b) => a.slot - b.slot);
  const maxScore = Math.max(1, ...players.map((p) => p.score));

  return (
    <div className="px-3 pt-2">
      <div
        className="relative overflow-hidden rounded-2xl border px-3 py-2"
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

        <div className="space-y-1">
          {lanes.map((p) => (
            <Lane key={p.slot} p={p} maxScore={maxScore} />
          ))}
        </div>
      </div>
    </div>
  );
}
