"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Panda, type PandaMood } from "@/components/Panda";
import { Bear } from "@/components/Bear";
import { BullMascot } from "@/components/BullMascot";
import { useHeartsStore, HEART_MAX } from "@/lib/heartsStore";
import { bouncy } from "@/lib/motion";

type Props = {
  progress: number;
  total: number;
  current: number;
  exitHref?: string;
  pandaMood?: PandaMood;
  character?: "panda" | "bear" | "bull";
  children: React.ReactNode;
  className?: string;
};

export function CardShell({
  progress,
  total,
  current,
  exitHref = "/",
  pandaMood = "idle",
  character = "panda",
  children,
  className,
}: Props) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-bg">
      {/* Progress bar */}
      <div className="shrink-0 bg-bg">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 pb-2 pt-3">
          <Link
            href={exitHref}
            aria-label="Exit lesson"
            className="rounded-full p-1.5 text-muted hover:bg-border/50 hover:text-fg transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </Link>
          <ProgressBar progress={progress} />
          <span className="w-9 text-right font-display text-[13px] font-extrabold tabular-nums text-fg/70">
            {current}/{total}
          </span>
          <HeartChip />
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-center" style={{ height: "clamp(80px, 15vh, 140px)" }}>
        <div className="relative h-full w-full max-w-sm flex items-center justify-center">
          {character === "bear" ? (
            <Bear mood={pandaMood} fill />
          ) : character === "bull" ? (
            <motion.div
              animate={
                pandaMood === "happy" || pandaMood === "celebrating"
                  ? { scale: [1, 1.18, 1], rotate: [0, -4, 4, 0] }
                  : pandaMood === "wrong"
                    ? { rotate: [0, -8, 8, -8, 0], x: [0, -4, 4, -2, 0] }
                    : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="drop-shadow-xl"
              style={{ height: "100%", display: "flex", alignItems: "center" }}
            >
              <BullMascot size={140} />
            </motion.div>
          ) : (
            <Panda mood={pandaMood} fill />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "mx-auto w-full max-w-xl px-4 pb-24",
            className,
          )}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function HeartChip() {
  const hearts = useHeartsStore((s) => s.hearts);
  const broken = hearts === 0;
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2.5 py-1"
      style={{
        background: broken
          ? "color-mix(in srgb, var(--muted) 14%, var(--surface))"
          : "color-mix(in srgb, var(--game) 14%, var(--surface))",
        border: broken
          ? "1.5px solid color-mix(in srgb, var(--muted) 30%, transparent)"
          : "1.5px solid color-mix(in srgb, var(--game) 30%, transparent)",
      }}
      title={`${hearts} of ${HEART_MAX} hearts`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={hearts}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={bouncy}
          className="flex items-center gap-1"
        >
          <Heart
            size={13}
            strokeWidth={2.5}
            className={broken ? "text-muted" : "text-[var(--game)]"}
            fill={broken ? "transparent" : "var(--game)"}
          />
          <span
            className="font-display text-[13px] font-extrabold tabular-nums"
            style={{ color: broken ? "var(--muted)" : "var(--game)" }}
          >
            {hearts}
          </span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      className="relative h-2.5 flex-1 overflow-hidden rounded-full"
      style={{ background: "color-mix(in srgb, var(--fg) 8%, transparent)" }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: "linear-gradient(90deg, var(--accent) 0%, var(--game) 100%)",
          boxShadow: "0 0 12px color-mix(in srgb, var(--accent) 50%, transparent)",
        }}
        animate={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

type FooterProps = {
  variant: "idle" | "correct" | "wrong";
  primary?: { label: string; onClick: () => void; disabled?: boolean };
  secondary?: { label: string; onClick: () => void };
  feedback?: React.ReactNode;
};

export function CardFooter({ variant, primary, secondary, feedback }: FooterProps) {
  const bg =
    variant === "correct"
      ? "var(--success-soft)"
      : variant === "wrong"
        ? "var(--game-soft)"
        : "var(--surface)";

  const borderTop =
    variant === "correct"
      ? "color-mix(in srgb, var(--success) 40%, transparent)"
      : variant === "wrong"
        ? "color-mix(in srgb, var(--game) 40%, transparent)"
        : "var(--border)";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"
      style={{
        background: bg,
        borderTop: `1.5px solid ${borderTop}`,
      }}
    >
      <div className="mx-auto max-w-xl">
        {feedback && <div className="mb-2.5 text-[14px] font-semibold">{feedback}</div>}
        <div className="flex gap-2">
          {secondary && (
            <button
              onClick={secondary.onClick}
              className="flex-1 rounded-2xl px-4 py-3.5 text-[14px] font-bold text-fg transition active:scale-[0.97]"
              style={{
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
              }}
            >
              {secondary.label}
            </button>
          )}
          {primary && (
            <button
              onClick={primary.onClick}
              disabled={primary.disabled}
              className={cn(
                "flex-[2] rounded-2xl px-4 py-3.5 text-[15px] font-extrabold uppercase tracking-wide transition-transform duration-100 active:translate-y-[2px]",
              )}
              style={
                primary.disabled
                  ? {
                      background: "color-mix(in srgb, var(--fg) 8%, transparent)",
                      color: "var(--muted)",
                      boxShadow: "none",
                    }
                  : variant === "correct"
                    ? {
                        background: "var(--success)",
                        color: "#fff",
                        boxShadow: "0 4px 0 color-mix(in srgb, var(--success) 70%, black)",
                      }
                    : variant === "wrong"
                      ? {
                          background: "var(--game)",
                          color: "#fff",
                          boxShadow: "0 4px 0 color-mix(in srgb, var(--game) 70%, black)",
                        }
                      : {
                          background: "var(--accent)",
                          color: "var(--accent-fg)",
                          boxShadow: "0 4px 0 color-mix(in srgb, var(--accent) 70%, black)",
                        }
              }
            >
              {primary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Shared option button — consistent sunset styling across all card types */
type OptionState = "idle" | "selected" | "correct" | "wrong";
type OptionButtonProps = {
  state: OptionState;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function OptionButton({ state, onClick, disabled, children, className, style }: OptionButtonProps) {
  const variantStyle: React.CSSProperties =
    state === "correct"
      ? {
          background: "var(--success-soft)",
          border: "2px solid var(--success)",
          color: "color-mix(in srgb, var(--success) 70%, var(--fg))",
          boxShadow: "0 3px 0 color-mix(in srgb, var(--success) 35%, transparent)",
        }
      : state === "wrong"
        ? {
            background: "var(--game-soft)",
            border: "2px solid var(--game)",
            color: "color-mix(in srgb, var(--game) 60%, var(--fg))",
            boxShadow: "0 3px 0 color-mix(in srgb, var(--game) 35%, transparent)",
          }
        : state === "selected"
          ? {
              background: "var(--accent-soft)",
              border: "2px solid var(--accent)",
              color: "var(--fg)",
              boxShadow: "0 3px 0 color-mix(in srgb, var(--accent) 35%, transparent)",
            }
          : {
              background: "var(--surface)",
              border: "2px solid var(--border)",
              color: "var(--fg)",
              boxShadow: "0 3px 0 color-mix(in srgb, var(--fg) 8%, transparent)",
            };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-2xl px-4 py-3.5 text-[15px] font-bold transition-transform duration-100 active:translate-y-[2px] text-left",
        className,
      )}
      style={{ ...variantStyle, ...style }}
    >
      {children}
    </button>
  );
}
