"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UserCircle2 } from "lucide-react";
import { useStore } from "zustand";
import { cn } from "@/lib/utils";
import { mandarinStore, germanStore, spanishStore } from "@/lib/store";

function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.5" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9V20a1 1 0 001 1h3.5v-5h5v5H18a1 1 0 001-1V9" />
    </svg>
  );
}

function ProgressPip({ done, total }: { done: number; total: number }) {
  if (done === 0) return null;
  return (
    <span className="ml-auto text-[10px] tabular-nums text-muted/70">
      {done}/{total}
    </span>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const mandarinDone = useStore(mandarinStore, (s) => s.completedUnits.length);
  const germanDone = useStore(germanStore, (s) => s.completedUnits.length);
  const spanishDone = useStore(spanishStore, (s) => s.completedUnits.length);

  const langProgress: Record<string, { done: number; total: number }> = {
    "/spanish":  { done: spanishDone,  total: 8 },
    "/mandarin": { done: mandarinDone, total: 8 },
    "/german":   { done: germanDone,   total: 7 },
  };

  const navItems = [
    {
      href: "/",
      label: "Home",
      type: "icon" as const,
      Icon: HomeIcon,
      match: (p: string) => p === "/" || p === "/mandarin" || p === "/german" || p === "/spanish" || p === "/trivia",
    },
    {
      href: "/spanish",
      label: "Spanish",
      type: "code" as const,
      code: "ES",
      accent: "#c2410c",
      match: (p: string) => p.startsWith("/spanish"),
    },
    {
      href: "/mandarin",
      label: "Mandarin",
      type: "code" as const,
      code: "中",
      accent: "#e11d48",
      match: (p: string) => p.startsWith("/mandarin"),
    },
    {
      href: "/german",
      label: "German",
      type: "code" as const,
      code: "DE",
      accent: "#f97316",
      match: (p: string) => p.startsWith("/german"),
    },
    {
      href: "/trivia",
      label: "Trivia",
      type: "icon" as const,
      Icon: FilmIcon,
      match: (p: string) => p.startsWith("/trivia"),
    },
  ];

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-border bg-surface">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center px-5 py-4 border-b border-border"
      >
        <span
          className="text-[15px] font-semibold"
          style={{ letterSpacing: "-0.02em" }}
        >
          slubstack
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {navItems.map((item) => {
          const active = item.match(pathname ?? "");
          const progress = item.href in langProgress ? langProgress[item.href] : null;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]"
                  : "text-muted hover:bg-[color-mix(in_srgb,var(--fg)_5%,transparent)] hover:text-fg"
              )}
            >
              {active && (
                <span
                  className="absolute left-0 h-5 w-0.5 rounded-r"
                  style={{ background: "var(--accent)" }}
                />
              )}

              {item.type === "code" ? (
                <span
                  className="flex h-5 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                  style={{
                    background: active
                      ? item.accent
                      : "color-mix(in srgb, var(--fg) 18%, transparent)",
                    color: active ? "#fff" : "var(--muted)",
                  }}
                >
                  {item.code}
                </span>
              ) : (
                <span
                  className={cn(
                    "shrink-0 transition-colors duration-150",
                    active ? "text-[var(--accent)]" : "text-muted group-hover:text-fg"
                  )}
                >
                  <item.Icon />
                </span>
              )}

              {item.label}

              {progress && <ProgressPip done={progress.done} total={progress.total} />}
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="border-t border-border px-3 py-4">
        <Link
          href="/stats"
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
            pathname?.startsWith("/stats")
              ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]"
              : "text-muted hover:bg-[color-mix(in_srgb,var(--fg)_5%,transparent)] hover:text-fg"
          )}
        >
          <UserCircle2
            size={15}
            strokeWidth={1.8}
            className={cn(
              "shrink-0 transition-colors duration-150",
              pathname?.startsWith("/stats") ? "text-[var(--accent)]" : "text-muted group-hover:text-fg"
            )}
          />
          Profile
        </Link>
      </div>
    </aside>
  );
}
