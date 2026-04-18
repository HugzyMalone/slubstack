"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Panda, type PandaMood } from "@/components/Panda";
import { Bear } from "@/components/Bear";

type Props = {
  progress: number;
  total: number;
  current: number;
  exitHref?: string;
  pandaMood?: PandaMood;
  character?: "panda" | "bear";
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
    // Fixed full-screen overlay — covers TopBar/BottomNav, no scrolling
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-bg">
      {/* Progress bar */}
      <div className="shrink-0 bg-bg">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 pb-2 pt-3">
          <Link
            href={exitHref}
            aria-label="Exit lesson"
            className="rounded-full p-1 text-muted hover:bg-border/50 hover:text-fg"
          >
            <X size={20} />
          </Link>
          <ProgressBar progress={progress} />
          <span className="w-12 text-right text-xs tabular-nums text-muted">
            {current}/{total}
          </span>
        </div>
      </div>

      {/* Character */}
      <div className="shrink-0 flex items-center justify-center" style={{ height: "clamp(80px, 15vh, 140px)" }}>
        <div className="relative h-full w-full max-w-sm">
          {character === "bear" ? <Bear mood={pandaMood} fill /> : <Panda mood={pandaMood} fill />}
        </div>
      </div>

      {/* Question — fixed height, no scroll */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "mx-auto w-full max-w-xl px-4 pb-20",
            className,
          )}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border/60">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: "var(--accent)" }}
        animate={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
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
      ? "bg-emerald-50 dark:bg-emerald-950/40 border-t-emerald-500/40"
      : variant === "wrong"
        ? "bg-rose-50 dark:bg-rose-950/40 border-t-rose-500/40"
        : "bg-surface border-t-border";

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]",
        bg,
      )}
    >
      <div className="mx-auto max-w-xl">
        {feedback && <div className="mb-2 text-sm">{feedback}</div>}
        <div className="flex gap-2">
          {secondary && (
            <button
              onClick={secondary.onClick}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-fg hover:bg-border/40 active:scale-[0.98]"
            >
              {secondary.label}
            </button>
          )}
          {primary && (
            <button
              onClick={primary.onClick}
              disabled={primary.disabled}
              className={cn(
                "flex-[2] rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98]",
                primary.disabled
                  ? "bg-border text-muted"
                  : variant === "correct"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : variant === "wrong"
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90",
              )}
            >
              {primary.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
