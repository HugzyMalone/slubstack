"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Blocks, Brain, Brush, Globe, Film, Keyboard, Compass, ArrowRight } from "lucide-react";

const GAMES = [
  {
    href: "/trivia/geo-clone",
    title: "GeoClone",
    subtitle: "8-player live geo-guessing, 3 rounds × 30s",
    icon: <Globe size={26} />,
    tint: "#0ea5e9",
    bg: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    available: true,
  },
  {
    href: "/games/draw",
    title: "Draw My Thing",
    subtitle: "Multiplayer Pictionary — invite friends with a 4-char code",
    icon: <Brush size={26} />,
    tint: "#ec4899",
    bg: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    available: true,
  },
  {
    href: "/games/block-yard",
    title: "BlockYard",
    subtitle: "In development — slotting in soon",
    icon: <Blocks size={26} />,
    tint: "#f59e0b",
    bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    available: false,
  },
  {
    href: "/games/type-racer",
    title: "Type Racer",
    subtitle: "Live typing sprint — race four players on speed and accuracy",
    icon: <Keyboard size={26} />,
    tint: "#14b8a6",
    bg: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
    available: true,
  },
  {
    href: "/games/wiki-race",
    title: "Wikirace",
    subtitle: "Race from one Wikipedia article to another in the fewest clicks",
    icon: <Compass size={26} />,
    tint: "#6366f1",
    bg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    available: true,
  },
  {
    href: "/brain-training",
    title: "Brain Training",
    subtitle: "Math Blitz, Wordle, Connections",
    icon: <Brain size={26} />,
    tint: "#ec4899",
    bg: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
    available: true,
  },
  {
    href: "/trivia",
    title: "Trivia",
    subtitle: "Actors, flags, albums, year guesser & more",
    icon: <Film size={26} />,
    tint: "#a855f7",
    bg: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)",
    available: true,
  },
];

export default function GamesPage() {
  return (
    <div className="px-4 pt-4 pb-24 lg:max-w-[1200px] lg:mx-auto lg:px-8 lg:py-10">
      <div className="mb-6 lg:mb-10">
        <p className="text-[12px] font-semibold tracking-widest text-muted uppercase">Slubstack</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight lg:text-4xl">Games</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted lg:text-base">
          Live multiplayer rounds, trivia and competitive challenges. Pick a game and play.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map(({ href, title, subtitle, icon, tint, bg, available }, i) => (
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
                opacity: available ? 1 : 0.78,
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                  style={{ background: bg }}
                >
                  {icon}
                </div>
                {!available && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold leading-none tracking-wider uppercase"
                    style={{
                      background: `color-mix(in srgb, ${tint} 18%, var(--surface))`,
                      color: tint,
                      border: `1px solid color-mix(in srgb, ${tint} 28%, transparent)`,
                    }}
                  >
                    Soon
                  </span>
                )}
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
