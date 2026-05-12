"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import type { Location, Guess } from "@/lib/games/geo-clone/adapter";
import { RevealMap } from "./RevealMap";

type RevealBoardProps = {
  actual: Location;
  guesses: Array<{ slot: number; displayName: string; guess: Guess | null; points: number; distanceMeters: number | null }>;
  roundIndex: number;
};

function formatDistance(meters: number | null): string {
  if (meters === null) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(meters >= 10_000 ? 0 : 1)} km`;
  return `${Math.round(meters)} m`;
}

export function RevealBoard({ actual, guesses, roundIndex }: RevealBoardProps) {
  const mapGuesses = guesses
    .filter((g): g is typeof g & { guess: Guess } => g.guess !== null)
    .map((g) => ({ slot: g.slot, displayName: g.displayName, lat: g.guess.lat, lng: g.guess.lng }));

  const sorted = [...guesses].sort((a, b) => b.points - a.points);
  const stack = sorted.length > 4;

  return (
    <div className="relative flex h-full w-full flex-col bg-bg">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="z-10 flex items-center gap-3 border-b px-4 py-3"
        style={{
          background: "var(--surface)",
          borderColor: "color-mix(in srgb, var(--fg) 8%, transparent)",
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--accent)", color: "var(--bg)" }}
        >
          <MapPin size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted">
            Round {roundIndex + 1} reveal
          </div>
          <div className="truncate text-base font-black">{actual.name}</div>
          <div className="truncate text-xs text-muted">{actual.country}</div>
        </div>
      </motion.div>

      <div className="relative flex-1 min-h-0">
        <RevealMap actual={{ lat: actual.lat, lng: actual.lng }} guesses={mapGuesses} />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        className="z-10 border-t px-3 py-2"
        style={{
          background: "var(--surface)",
          borderColor: "color-mix(in srgb, var(--fg) 8%, transparent)",
        }}
      >
        <div className={stack ? "flex flex-col gap-1" : "grid grid-cols-2 gap-1.5 sm:grid-cols-4"}>
          {sorted.map((g, idx) => {
            const rankColour =
              idx === 0 ? "#f5b300" : idx === 1 ? "#c0c5cd" : idx === 2 ? "#cd7c54" : null;
            return (
              <motion.div
                key={g.slot}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 26, delay: 0.25 + idx * 0.07 }}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-1.5"
                style={{ background: "color-mix(in srgb, var(--fg) 4%, var(--bg))" }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black tabular-nums"
                    style={{
                      background: rankColour ?? "color-mix(in srgb, var(--fg) 12%, transparent)",
                      color: rankColour ? "#1a1300" : "var(--muted)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="truncate text-xs font-semibold">{g.displayName}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] tabular-nums text-muted">
                    {formatDistance(g.distanceMeters)}
                  </span>
                  <span
                    className="text-sm font-black tabular-nums"
                    style={{ color: "var(--accent)" }}
                  >
                    {g.points}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
