"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bot, User } from "lucide-react";

export type QueueSlot = {
  slot: number;
  displayName: string;
  avatarUrl: string | null;
  isBot: boolean;
} | null;

type Props = {
  players: QueueSlot[];
  secondsRemaining: number;
  level: number;
  title?: string;
};

function Avatar({ slot, compact }: { slot: NonNullable<QueueSlot>; compact: boolean }) {
  const sizeClass = compact ? "h-10 w-10" : "h-14 w-14";
  const iconSize = compact ? 18 : 24;
  const fallbackText = compact ? "text-base font-bold" : "text-lg font-bold";
  if (slot.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={slot.avatarUrl}
        alt={slot.displayName}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }
  if (slot.isBot) {
    return (
      <div
        className={`flex ${sizeClass} items-center justify-center rounded-full`}
        style={{ background: "color-mix(in srgb, var(--game) 18%, var(--surface))" }}
      >
        <Bot size={iconSize} style={{ color: "var(--game)" }} />
      </div>
    );
  }
  return (
    <div
      className={`flex ${sizeClass} items-center justify-center rounded-full ${fallbackText}`}
      style={{ background: "color-mix(in srgb, var(--accent) 18%, var(--surface))", color: "var(--accent)" }}
    >
      {slot.displayName[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export function QueueRoom({ players, secondsRemaining, level, title = "Math Blitz" }: Props) {
  const compact = players.length > 4;
  const gridClass = compact
    ? "grid w-full max-w-md grid-cols-4 gap-2 lg:max-w-2xl lg:grid-cols-4"
    : "grid w-full max-w-md grid-cols-2 gap-3 lg:max-w-2xl lg:grid-cols-4";
  const cardClass = compact
    ? "flex flex-col items-center gap-1.5 rounded-2xl border bg-surface px-2 py-3"
    : "flex flex-col items-center gap-2 rounded-2xl border bg-surface px-4 py-5";
  const innerGapClass = compact ? "flex flex-col items-center gap-1.5" : "flex flex-col items-center gap-2";
  const nameClass = compact
    ? "max-w-[5rem] truncate text-xs font-semibold"
    : "max-w-[8rem] truncate text-sm font-semibold";
  const emptyAvatarClass = compact
    ? "flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed"
    : "flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed";
  const emptyIconSize = compact ? 16 : 20;
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <div className="mb-8 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</div>
          <div className="mt-1 text-3xl font-black tracking-tight">Level {level}</div>
          <p className="mt-2 text-sm text-muted">Looking for opponents…</p>
        </div>

        <div className={gridClass}>
          {players.map((p, i) => (
            <div
              key={i}
              className={cardClass}
              style={{
                borderColor: p ? "color-mix(in srgb, var(--accent) 30%, var(--border))" : "var(--border)",
                opacity: p ? 1 : 0.5,
              }}
            >
              <AnimatePresence mode="wait">
                {p ? (
                  <motion.div
                    key="filled"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                    className={innerGapClass}
                  >
                    <Avatar slot={p} compact={compact} />
                    <div className={nameClass}>{p.displayName}</div>
                    {p.isBot && (
                      <div
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: "color-mix(in srgb, var(--game) 16%, transparent)", color: "var(--game)" }}
                      >
                        Bot
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={innerGapClass}
                  >
                    <div
                      className={emptyAvatarClass}
                      style={{ borderColor: "var(--border)" }}
                    >
                      <User size={emptyIconSize} style={{ color: "var(--muted)" }} />
                    </div>
                    <div className="text-xs text-muted">Waiting…</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="text-5xl font-black tabular-nums" style={{ color: "var(--accent)" }}>
            {secondsRemaining}
          </div>
          <div className="mt-1 text-xs text-muted">Match starts in {secondsRemaining}s</div>
        </div>
      </div>
    </div>
  );
}
