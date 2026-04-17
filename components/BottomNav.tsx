"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function HomeIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Roof */}
      <path d="M3 10.5L12 3l9 7.5" />
      {/* Walls */}
      <path d="M5 9V20a1 1 0 001 1h3.5v-5h5v5H18a1 1 0 001-1V9" />
    </svg>
  );
}

function CardsIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Open book */}
      <path d="M2 4h6a4 4 0 014 4v13a3 3 0 00-3-3H2V4z" />
      <path d="M22 4h-6a4 4 0 00-4 4v13a3 3 0 013-3h7V4z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4 21c0-4.42 3.58-8 8-8s8 3.58 8 8" />
    </svg>
  );
}

const SPRING = { type: "spring", stiffness: 420, damping: 36, mass: 0.9 } as const;

export function BottomNav() {
  const pathname = usePathname();

  if (
    pathname?.startsWith("/learn/") ||
    pathname?.startsWith("/mandarin/learn/") ||
    pathname?.startsWith("/german/learn/") ||
    pathname?.startsWith("/spanish/learn/") ||
    pathname === "/review-run"
  ) {
    return null;
  }

  const flashcardsHref = pathname?.startsWith("/german")
    ? "/german/review"
    : pathname?.startsWith("/spanish")
      ? "/spanish/review"
      : "/mandarin/review";

  const tabs = [
    {
      href: "/",
      label: "Home",
      Icon: HomeIcon,
      match: (p: string) =>
        p === "/" || p === "/mandarin" || p === "/german" || p === "/spanish" || p === "/trivia",
    },
    {
      href: flashcardsHref,
      label: "Review",
      Icon: CardsIcon,
      match: (p: string) =>
        p.startsWith("/mandarin/review") ||
        p.startsWith("/german/review") ||
        p.startsWith("/spanish/review") ||
        p.startsWith("/review"),
    },
    {
      href: "/stats",
      label: "Profile",
      Icon: PersonIcon,
      match: (p: string) => p.startsWith("/stats") || p.startsWith("/leaderboard"),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-6 lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 4px)" }}
    >
      <div
        className="flex items-stretch gap-0.5 rounded-[30px] p-1.5"
        style={{
          background: "linear-gradient(180deg, color-mix(in srgb, var(--surface) 80%, transparent) 0%, color-mix(in srgb, var(--surface) 72%, transparent) 100%)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          border: "1px solid color-mix(in srgb, var(--fg) 9%, transparent)",
          boxShadow: "0 10px 40px color-mix(in srgb, black 16%, transparent), 0 1px 0 color-mix(in srgb, white 28%, transparent) inset",
        }}
      >
        {tabs.map(({ href, label, Icon, match }) => {
          const active = match(pathname ?? "");
          return (
            <Link
              key={label}
              href={href}
              className="relative flex flex-col items-center gap-0.5 rounded-[22px] px-7 py-2"
            >
              {/* Sliding pill — layoutId makes it animate between tabs */}
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-[22px]"
                  style={{ background: "color-mix(in srgb, var(--accent) 13%, transparent)" }}
                  transition={SPRING}
                />
              )}

              {/* Icon — bounces up slightly when becoming active */}
              <motion.span
                className={cn(
                  "relative transition-colors duration-150",
                  active ? "text-[var(--accent)]" : "text-muted",
                )}
                animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }}
                transition={SPRING}
              >
                <Icon />
              </motion.span>

              {/* Label — fades + slides in when active */}
              <motion.span
                className={cn(
                  "relative text-[10px] font-semibold tracking-wide",
                  active ? "text-[var(--accent)]" : "text-muted",
                )}
                animate={{ opacity: active ? 1 : 0.55 }}
                transition={{ duration: 0.18 }}
              >
                {label}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
