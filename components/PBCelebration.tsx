"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { playFanfare } from "@/lib/sound";
import { levelUp as hapticLevelUp } from "@/lib/haptics";
import { shareOrCopy } from "@/lib/share";

type Props = {
  open: boolean;
  onClose: () => void;
  value: number | string;
  label?: string;
  gameLabel: string;
  shareText: string;
};

const SUNSET_PALETTE = ["#ff8a4c", "#e83a8e", "#7b5bff", "#ffb37a", "#ff6cb0"];

export function PBCelebration({ open, onClose, value, label = "New best!", gameLabel, shareText }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (!open || fired.current) return;
    fired.current = true;
    playFanfare();
    hapticLevelUp();
    const burst = (origin: { x: number; y: number }) => {
      confetti({
        particleCount: 60,
        spread: 70,
        startVelocity: 35,
        origin,
        colors: SUNSET_PALETTE,
        scalar: 0.9,
        zIndex: 60,
      });
    };
    burst({ x: 0.2, y: 0.4 });
    burst({ x: 0.8, y: 0.4 });
    setTimeout(() => burst({ x: 0.5, y: 0.3 }), 220);
  }, [open]);

  useEffect(() => {
    if (!open) fired.current = false;
  }, [open]);

  async function handleShare() {
    const result = await shareOrCopy(shareText);
    if (result === "copied") toast.success("Copied to clipboard");
    else if (result === "shared") toast.success("Shared");
    else toast.error("Couldn't copy — try again");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] flex items-center justify-center px-6"
          style={{ background: "color-mix(in srgb, var(--fg) 40%, transparent)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.7, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="relative w-full max-w-sm rounded-[28px] p-7 text-center"
            style={{
              background: "linear-gradient(160deg, var(--accent-soft) 0%, var(--game-soft) 100%)",
              border: "2px solid color-mix(in srgb, var(--accent) 36%, transparent)",
              boxShadow: "0 24px 48px -16px color-mix(in srgb, var(--game) 50%, transparent), 0 8px 0 color-mix(in srgb, var(--accent) 20%, transparent)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full p-1.5 text-fg/50 hover:bg-white/40 hover:text-fg transition-colors"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 14 }}
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, var(--game) 100%)",
                boxShadow: "0 6px 0 color-mix(in srgb, var(--game) 70%, black)",
              }}
            >
              <Trophy size={32} strokeWidth={2.4} fill="white" className="text-white" />
            </motion.div>

            <p className="font-display text-[14px] font-extrabold uppercase tracking-widest text-[var(--accent)]">
              {gameLabel}
            </p>
            <h2 className="font-display mt-1 text-3xl font-extrabold tracking-tight">{label}</h2>

            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 14 }}
              className="my-5 flex items-baseline justify-center"
            >
              <span
                className="font-display text-7xl font-black tabular-nums"
                style={{
                  background: "linear-gradient(120deg, var(--accent) 0%, var(--game) 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {value}
              </span>
            </motion.div>

            <button
              onClick={handleShare}
              className="w-full rounded-2xl px-5 py-4 font-display text-[15px] font-extrabold uppercase tracking-wide text-white transition-transform duration-100 active:translate-y-[2px]"
              style={{
                background: "linear-gradient(120deg, var(--accent) 0%, var(--game) 100%)",
                boxShadow: "0 4px 0 color-mix(in srgb, var(--game) 70%, black)",
              }}
            >
              Share with a friend
            </button>

            <button
              onClick={onClose}
              className="mt-2 w-full rounded-2xl px-5 py-3 text-[14px] font-bold text-fg/70 hover:text-fg transition-colors"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
