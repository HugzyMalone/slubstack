"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, Wand2, Brain, ArrowRight } from "lucide-react";

const LEARNING = [
  {
    href: "/languages",
    title: "Languages",
    subtitle: "Spanish · Mandarin · German",
    icon: <Globe size={26} />,
    tint: "#6366f1",
    bg: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
  },
  {
    href: "/skills",
    title: "Skills",
    subtitle: "Vibe Coding & more",
    icon: <Wand2 size={26} />,
    tint: "#f59e0b",
    bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  },
  {
    href: "/brain-training",
    title: "Brain Training",
    subtitle: "Math Blitz, Wordle, Connections",
    icon: <Brain size={26} />,
    tint: "#0ea5e9",
    bg: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
  },
];

export default function LearningPage() {
  return (
    <div className="px-4 pt-4 pb-24 lg:max-w-[1200px] lg:mx-auto lg:px-8 lg:py-10">
      <div className="mb-6 lg:mb-10">
        <p className="text-[12px] font-semibold tracking-widest text-muted uppercase">Slubstack</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight lg:text-4xl">Learning</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted lg:text-base">
          Languages, skills and brain training. Pick a path.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LEARNING.map(({ href, title, subtitle, icon, tint, bg }, i) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link
              href={href}
              className="group relative flex h-full flex-col gap-4 rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5 lg:p-6"
              style={{
                background: `color-mix(in srgb, ${tint} 8%, var(--surface))`,
                border: `1px solid color-mix(in srgb, ${tint} 22%, transparent)`,
                minHeight: 160,
              }}
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{ background: bg }}
              >
                {icon}
              </div>
              <div>
                <div className="text-[17px] font-bold leading-tight">{title}</div>
                <div className="mt-1 text-[13px] leading-snug text-muted">{subtitle}</div>
              </div>
              <div
                className="absolute right-5 bottom-5 flex items-center gap-1 text-[13px] font-semibold opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                style={{ color: tint }}
              >
                Open <ArrowRight size={14} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
