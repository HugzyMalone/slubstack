"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers3, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/learn/") || pathname === "/review-run") return null;

  const tabs = [
    { href: "/", label: "Learn", Icon: Home, match: (p: string) => p === "/" },
    {
      href: "/review",
      label: "Flashcards",
      Icon: Layers3,
      match: (p: string) => p.startsWith("/review"),
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      Icon: Trophy,
      match: (p: string) => p.startsWith("/leaderboard"),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-xl items-stretch px-3 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ href, label, Icon, match }) => {
          const active = match(pathname ?? "");
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              {active && (
                <span
                  className="absolute inset-x-3 inset-y-2 rounded-2xl"
                  style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
                />
              )}
              <Icon
                size={19}
                className={cn(
                  "relative transition-colors duration-150",
                  active ? "text-[var(--accent)]" : "text-muted",
                )}
              />
              <span
                className={cn(
                  "relative text-[10px] font-medium transition-colors duration-150",
                  active ? "text-[var(--accent)]" : "text-muted",
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
