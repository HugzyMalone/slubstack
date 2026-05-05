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
  level: 1 | 2 | 3;
};

function Avatar({ slot }: { slot: NonNullable<QueueSlot> }) {
  if (slot.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={slot.avatarUrl}
        alt={slot.displayName}
        className="h-14 w-14 rounded-full object-cover"
      />
    );
  }
  if (slot.isBot) {
    return (
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "color-mix(in srgb, var(--game) 18%, var(--surface))" }}
      >
        <Bot size={24} style={{ color: "var(--game)" }} />
      </div>
    );
  }
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold"
      style={{ background: "color-mix(in srgb, var(--accent) 18%, var(--surface))", color: "var(--accent)" }}
    >
      {slot.displayName[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export function QueueRoom({ players, secondsRemaining, level }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <div className="mb-8 text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">Live Math Blitz</div>
          <div className="mt-1 text-3xl font-black tracking-tight">Level {level}</div>
          <p className="mt-2 text-sm text-muted">Looking for opponents…</p>
        </div>

        <div className="grid w-full max-w-md grid-cols-2 gap-3 lg:max-w-2xl lg:grid-cols-4">
          {players.map((p, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-2xl border bg-surface px-4 py-5"
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
                    className="flex flex-col items-center gap-2"
                  >
                    <Avatar slot={p} />
                    <div className="max-w-[8rem] truncate text-sm font-semibold">{p.displayName}</div>
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
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <User size={20} style={{ color: "var(--muted)" }} />
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
