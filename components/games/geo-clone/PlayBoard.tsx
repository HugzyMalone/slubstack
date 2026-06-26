"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Lock } from "lucide-react";
import type { Location, Guess } from "@/lib/games/geo-clone/adapter";
import { StreetViewPanel } from "./StreetViewPanel";
import { GuessMap } from "./GuessMap";

type PlayBoardProps = {
  location: Location;
  roundIndex: number;
  roundCount: number;
  timeLeftMs: number;
  locked: boolean;
  onLockGuess: (guess: Guess) => void;
};

function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayBoard({ location, roundIndex, roundCount, timeLeftMs, locked, onLockGuess }: PlayBoardProps) {
  const [pendingGuess, setPendingGuess] = useState<Guess | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(true);
  const [panelLarge, setPanelLarge] = useState(false);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prevRoundIndex, setPrevRoundIndex] = useState(roundIndex);
  if (roundIndex !== prevRoundIndex) {
    setPrevRoundIndex(roundIndex);
    setPendingGuess(null);
    setSheetOpen(false);
  }

  useEffect(() => () => {
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
  }, []);

  function handlePanelEnter() {
    if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
    expandTimerRef.current = setTimeout(() => setPanelLarge(true), 1000);
  }

  function handlePanelLeave() {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
    setPanelLarge(false);
  }

  function handleConfirm() {
    if (locked || !pendingGuess) return;
    onLockGuess(pendingGuess);
  }

  const buttonLabel = locked
    ? "GUESS LOCKED"
    : pendingGuess
      ? "CONFIRM GUESS"
      : "TAP MAP TO GUESS";

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <StreetViewPanel location={location} />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 px-3 pb-3"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 0.75rem)",
          background: "linear-gradient(to bottom, color-mix(in srgb, var(--bg) 92%, transparent) 0%, color-mix(in srgb, var(--bg) 80%, transparent) 60%, transparent 100%)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          maskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
        }}
      >
        <div
          className="rounded-full px-3 py-1.5 text-xs font-black tracking-wider"
          style={{
            background: "color-mix(in srgb, var(--bg) 88%, transparent)",
            color: "var(--muted)",
            border: "1px solid color-mix(in srgb, var(--fg) 10%, transparent)",
          }}
        >
          ROUND {roundIndex + 1} / {roundCount}
        </div>
        <div
          className="rounded-full px-3 py-1.5 text-xs font-black tabular-nums tracking-wider"
          style={{
            background: "color-mix(in srgb, var(--bg) 88%, transparent)",
            color: timeLeftMs <= 10_000 ? "#ef4444" : "var(--fg)",
            border: "1px solid color-mix(in srgb, var(--fg) 10%, transparent)",
          }}
        >
          {formatTime(timeLeftMs)}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {timeLeftMs > 0 && timeLeftMs <= 5_000 && (
          <motion.div
            key={Math.ceil(timeLeftMs / 1000)}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2"
            style={{ top: "calc(max(env(safe-area-inset-top), 0.75rem) + 2.5rem)" }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-2xl font-black tabular-nums"
              style={{
                background: "rgba(239,68,68,0.92)",
                color: "#fff",
                boxShadow: "0 6px 24px rgba(239,68,68,0.55), 0 0 0 2px rgba(255,255,255,0.18) inset",
              }}
            >
              {Math.ceil(timeLeftMs / 1000)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="pointer-events-none absolute bottom-4 right-4 z-20 hidden lg:block">
        <motion.div
          onMouseEnter={overlayOpen ? handlePanelEnter : undefined}
          onMouseLeave={overlayOpen ? handlePanelLeave : undefined}
          animate={{
            width: overlayOpen ? (panelLarge ? "min(78vw, 1100px)" : 360) : 56,
            height: overlayOpen ? (panelLarge ? "min(82vh, 800px)" : 320) : 56,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="pointer-events-auto overflow-hidden rounded-2xl border shadow-xl"
          style={{
            background: "var(--surface)",
            borderColor: "color-mix(in srgb, var(--fg) 12%, transparent)",
          }}
        >
          {overlayOpen ? (
            <div className="flex h-full w-full flex-col">
              <div className="flex items-center justify-between border-b px-3 py-1.5"
                style={{ borderColor: "color-mix(in srgb, var(--fg) 8%, transparent)" }}
              >
                <span className="text-[11px] font-black uppercase tracking-widest text-muted">Your guess</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setOverlayOpen(false)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:text-fg"
                    aria-label="Collapse map"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
              <div className="relative flex-1">
                <GuessMap onGuess={setPendingGuess} guess={pendingGuess} disabled={locked} />
              </div>
              <div className="p-2">
                <button
                  type="button" onClick={handleConfirm}
                  disabled={locked || !pendingGuess}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl font-black tracking-wider disabled:opacity-50"
                  style={{
                    background: locked ? "var(--surface)" : "var(--accent)",
                    color: locked ? "var(--muted)" : "var(--bg)",
                    border: locked ? "1px solid color-mix(in srgb, var(--fg) 12%, transparent)" : "none",
                  }}
                >
                  {locked && <Lock size={14} />}
                  <span className="text-xs">{buttonLabel}</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOverlayOpen(true)}
              className="flex h-full w-full items-center justify-center text-fg"
              style={{ background: "var(--surface)" }}
              aria-label="Expand map"
            >
              <ChevronUp size={18} />
            </button>
          )}
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 lg:hidden">
        <AnimatePresence initial={false}>
          {sheetOpen && (
            <motion.div
              key="sheet"
              initial={{ height: 0 }}
              animate={{ height: "50vh" }}
              exit={{ height: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 38 }}
              className="overflow-hidden"
              style={{
                background: "var(--surface)",
                borderTop: "1px solid color-mix(in srgb, var(--fg) 12%, transparent)",
              }}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 pt-2 pb-1">
                  <div className="mx-auto h-1 w-10 rounded-full" style={{ background: "color-mix(in srgb, var(--fg) 18%, transparent)" }} />
                </div>
                <div className="flex items-center justify-between px-4 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted">Your guess</span>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted"
                    aria-label="Close map"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="relative flex-1">
                  <GuessMap onGuess={setPendingGuess} guess={pendingGuess} disabled={locked} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="px-3 pt-2"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)", background: sheetOpen ? "var(--surface)" : "transparent" }}
        >
          {locked ? (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                disabled
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-black tracking-wider opacity-70"
                style={{
                  background: "var(--surface)",
                  color: "var(--muted)",
                  border: "1px solid color-mix(in srgb, var(--fg) 12%, transparent)",
                }}
              >
                <Lock size={16} /> GUESS LOCKED
              </button>
              <span className="text-[11px] text-muted">Waiting for round to end…</span>
            </div>
          ) : pendingGuess ? (
            <div className="flex flex-col gap-1.5">
              <button
                type="button" onClick={handleConfirm}
                className="h-12 w-full rounded-2xl font-black tracking-wider"
                style={{ background: "var(--accent)", color: "var(--bg)" }}
              >
                CONFIRM GUESS
              </button>
              {!sheetOpen && (
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="text-[11px] font-semibold text-muted underline-offset-2 hover:underline"
                >
                  Adjust on map
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="h-12 w-full rounded-2xl font-black tracking-wider"
              style={{
                background: "color-mix(in srgb, var(--bg) 80%, transparent)",
                color: "var(--fg)",
                border: "1px solid color-mix(in srgb, var(--fg) 18%, transparent)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              TAP MAP TO GUESS
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
