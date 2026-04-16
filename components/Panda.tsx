"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type PandaMood = "idle" | "happy" | "sad" | "celebrating" | "sleeping";

type Props = {
  mood?: PandaMood;
  size?: number;
  className?: string;
};

/** A cute flat-SVG panda with swappable facial expressions. */
export function Panda({ mood = "idle", size = 120, className }: Props) {
  const bounce =
    mood === "celebrating"
      ? { y: [0, -12, 0] }
      : mood === "happy"
        ? { rotate: [0, -3, 3, 0] }
        : mood === "sad"
          ? { y: [0, 2, 0] }
          : { y: [0, -3, 0] };

  return (
    <motion.div
      className={cn("inline-block select-none", className)}
      style={{ width: size, height: size }}
      animate={bounce}
      transition={{
        duration: mood === "celebrating" ? 0.6 : mood === "sleeping" ? 2.4 : 3.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden>
        {/* ears */}
        <ellipse cx="32" cy="28" rx="14" ry="14" fill="#18181b" />
        <ellipse cx="88" cy="28" rx="14" ry="14" fill="#18181b" />
        <ellipse cx="32" cy="28" rx="6" ry="6" fill="#3f3f46" />
        <ellipse cx="88" cy="28" rx="6" ry="6" fill="#3f3f46" />

        {/* head */}
        <ellipse cx="60" cy="62" rx="42" ry="38" fill="#ffffff" stroke="#0c0a09" strokeWidth="1.25" />

        {/* eye patches */}
        <Patch cx={44} cy={58} mood={mood} side="left" />
        <Patch cx={76} cy={58} mood={mood} side="right" />

        {/* eyes */}
        <Eye cx={44} cy={60} mood={mood} />
        <Eye cx={76} cy={60} mood={mood} />

        {/* nose */}
        <ellipse cx="60" cy="74" rx="4" ry="3" fill="#0c0a09" />

        {/* mouth */}
        <Mouth mood={mood} />

        {/* cheeks for happy/celebrating */}
        {(mood === "happy" || mood === "celebrating") && (
          <>
            <circle cx="34" cy="78" r="4" fill="#fb7185" opacity="0.55" />
            <circle cx="86" cy="78" r="4" fill="#fb7185" opacity="0.55" />
          </>
        )}

        {/* zzz for sleeping */}
        {mood === "sleeping" && (
          <text x="96" y="30" fontSize="14" fill="#a1a1aa" fontFamily="ui-sans-serif, system-ui">
            z
          </text>
        )}
      </svg>
    </motion.div>
  );
}

function Patch({ cx, cy, mood, side }: { cx: number; cy: number; mood: PandaMood; side: "left" | "right" }) {
  const rx = 11;
  const ry = mood === "sad" ? 8 : 10;
  const rotate = side === "left" ? -15 : 15;
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="#18181b"
      transform={`rotate(${rotate} ${cx} ${cy})`}
    />
  );
}

function Eye({ cx, cy, mood }: { cx: number; cy: number; mood: PandaMood }) {
  if (mood === "sleeping") {
    return (
      <path
        d={`M ${cx - 4} ${cy} Q ${cx} ${cy + 3} ${cx + 4} ${cy}`}
        stroke="#fafafa"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  if (mood === "happy" || mood === "celebrating") {
    return (
      <path
        d={`M ${cx - 3} ${cy} Q ${cx} ${cy - 4} ${cx + 3} ${cy}`}
        stroke="#fafafa"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={3.2} fill="#fafafa" />
      <circle cx={cx + 0.8} cy={cy - 0.6} r={1.2} fill="#0c0a09" />
    </g>
  );
}

function Mouth({ mood }: { mood: PandaMood }) {
  if (mood === "celebrating") {
    return <ellipse cx="60" cy="84" rx="6" ry="4" fill="#0c0a09" />;
  }
  if (mood === "happy") {
    return (
      <path
        d="M 52 82 Q 60 90 68 82"
        stroke="#0c0a09"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  if (mood === "sad") {
    return (
      <path
        d="M 52 86 Q 60 80 68 86"
        stroke="#0c0a09"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  // idle / sleeping
  return (
    <path
      d="M 55 82 Q 60 85 65 82"
      stroke="#0c0a09"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  );
}
