"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function HomeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9V20a1 1 0 001 1h3.5v-5h5v5H18a1 1 0 001-1V9" />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h6a4 4 0 014 4v13a3 3 0 00-3-3H2V4z" />
      <path d="M22 4h-6a4 4 0 00-4 4v13a3 3 0 013-3h7V4z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8v4a4 4 0 11-8 0V3z" />
      <path d="M5 5H3a3 3 0 003 3" />
      <path d="M19 5h2a3 3 0 01-3 3" />
      <path d="M10 13h4v3h-4z" />
      <path d="M9 21h6" />
      <path d="M12 16v5" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  if (
    pathname?.startsWith("/learn/") ||
    pathname?.startsWith("/mandarin/learn/") ||
    pathname?.startsWith("/german/learn/") ||
    pathname?.startsWith("/spanish/learn/") ||
    pathname?.startsWith("/vibe-coding/learn/") ||
    pathname?.startsWith("/brain-training/wordle") ||
    pathname?.startsWith("/brain-training/math-blitz") ||
    pathname?.startsWith("/brain-training/connections") ||
    pathname?.startsWith("/trivia/actors") ||
    pathname === "/review-run"
  ) {
    return null;
  }

  const tabs = [
    {
      href: "/",
      label: "Home",
      Icon: HomeIcon,
      match: (p: string) =>
        p === "/" || p === "/mandarin" || p === "/german" || p === "/spanish" || p === "/trivia",
    },
    {
      href: "/review",
      label: "Review",
      Icon: CardsIcon,
      match: (p: string) =>
        p.startsWith("/mandarin/review") ||
        p.startsWith("/german/review") ||
        p.startsWith("/spanish/review") ||
        p.startsWith("/review"),
    },
    {
      href: "/leaderboard/league",
      label: "League",
      Icon: TrophyIcon,
      match: (p: string) => p.startsWith("/leaderboard/league"),
    },
    {
      href: "/stats",
      label: "Profile",
      Icon: PersonIcon,
      match: (p: string) => p.startsWith("/stats") || (p.startsWith("/leaderboard") && !p.startsWith("/leaderboard/league")),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6px)" }}
    >
      <div
        className="flex items-stretch gap-1 rounded-[var(--radius-pill)] p-1.5"
        style={{
          background: "color-mix(in srgb, var(--surface) 88%, transparent)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          border: "1.5px solid color-mix(in srgb, var(--fg) 8%, transparent)",
          boxShadow: "0 12px 32px -10px color-mix(in srgb, var(--accent) 35%, transparent), var(--shadow-bouncy)",
        }}
      >
        {tabs.map(({ href, label, Icon, match }) => {
          const active = match(pathname ?? "");
          return (
            <Link
              key={label}
              href={href}
              prefetch
              className="relative flex flex-col items-center gap-0.5 rounded-full px-4 py-2.5"
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--game-soft) 100%)",
                }}
                initial={false}
                animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.8 }}
                transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
              />
              <span
                className={cn(
                  "relative transition-colors duration-150",
                  active ? "text-[var(--accent)]" : "text-muted",
                )}
              >
                <Icon />
              </span>
              <span
                className={cn(
                  "relative text-[10px] font-bold tracking-wide transition-opacity duration-150",
                  active ? "text-[var(--accent)] opacity-100" : "text-muted opacity-55",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
