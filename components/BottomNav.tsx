"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Repeat2, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fixed bottom tab bar. Hidden during active lesson sessions
 * (routes under /learn/[id]) to keep focus on the cards.
 */
export function BottomNav() {
  const pathname = usePathname();

  // Hide during lessons
  if (pathname?.startsWith("/learn/") || pathname === "/review-run") return null;

  const tabs = [
    { href: "/", label: "Learn", Icon: Home, match: (p: string) => p === "/" },
    { href: "/review", label: "Review", Icon: Repeat2, match: (p: string) => p.startsWith("/review") },
    { href: "/stats", label: "Stats", Icon: User, match: (p: string) => p.startsWith("/stats") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-xl items-stretch px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ href, label, Icon, match }) => {
          const active = match(pathname ?? "");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition",
                active ? "text-[var(--accent)]" : "text-muted hover:text-fg",
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
