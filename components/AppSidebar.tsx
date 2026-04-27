"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle2 } from "lucide-react";
import { useStore } from "zustand";
import { cn } from "@/lib/utils";
import { mandarinStore, germanStore, spanishStore, vibeCodingStore } from "@/lib/store";
import { BullMascot } from "@/components/BullMascot";

function WandIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2" />
      <path d="M15 16v-2" />
      <path d="M8 9h2" />
      <path d="M20 9h2" />
      <path d="M17.8 11.8L19 13" />
      <path d="M15 9h.01" />
      <path d="M17.8 6.2L19 5" />
      <path d="M3 21l9-9" />
      <path d="M12.2 6.2L11 5" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9V20a1 1 0 001 1h3.5v-5h5v5H18a1 1 0 001-1V9" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5v1a3 3 0 0 0 6 0V4a0 0 0 0 1 0 0 3 3 0 0 0-3 0z" />
      <path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-2 5v1a3 3 0 0 1-6 0V4a0 0 0 0 0 0 0 3 3 0 0 1 3 0z" />
    </svg>
  );
}

function ProgressPip({ done, total }: { done: number; total: number }) {
  if (done === 0) return null;
  return (
    <span
      className="ml-auto rounded-full px-2 py-0.5 font-display text-[11px] font-extrabold tabular-nums"
      style={{
        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
        color: "var(--accent)",
      }}
    >
      {done}/{total}
    </span>
  );
}

type MascotKind = "panda" | "bear" | "bull";

function Mascot({ kind, active }: { kind: MascotKind; active: boolean }) {
  const ringColor = active ? "var(--accent)" : "color-mix(in srgb, var(--fg) 12%, transparent)";
  const bg = active ? "color-mix(in srgb, var(--accent-soft) 90%, var(--surface))" : "var(--surface)";

  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden transition-all duration-150"
      style={{
        background: bg,
        border: `1.5px solid ${ringColor}`,
      }}
    >
      {kind === "bull" ? (
        <BullMascot size={28} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={kind === "panda" ? "/3dpanda.png" : "/happy-bear1.png"}
          alt=""
          className="h-7 w-7 object-contain"
        />
      )}
    </span>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const mandarinDone = useStore(mandarinStore, (s) => s.completedUnits.length);
  const germanDone = useStore(germanStore, (s) => s.completedUnits.length);
  const spanishDone = useStore(spanishStore, (s) => s.completedUnits.length);
  const vibeDone = useStore(vibeCodingStore, (s) => s.completedUnits.length);

  const langProgress: Record<string, { done: number; total: number }> = {
    "/spanish":      { done: spanishDone,  total: 8 },
    "/mandarin":     { done: mandarinDone, total: 8 },
    "/german":       { done: germanDone,   total: 7 },
    "/vibe-coding":  { done: vibeDone,     total: 6 },
  };

  type NavItem = {
    href: string;
    label: string;
    match: (p: string) => boolean;
  } & (
    | { kind: "icon"; Icon: () => React.JSX.Element }
    | { kind: "mascot"; mascot: MascotKind }
  );

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Home",
      kind: "icon",
      Icon: HomeIcon,
      match: (p: string) => p === "/",
    },
    {
      href: "/spanish",
      label: "Spanish",
      kind: "mascot",
      mascot: "bull",
      match: (p: string) => p.startsWith("/spanish"),
    },
    {
      href: "/mandarin",
      label: "Mandarin",
      kind: "mascot",
      mascot: "panda",
      match: (p: string) => p.startsWith("/mandarin"),
    },
    {
      href: "/german",
      label: "German",
      kind: "mascot",
      mascot: "bear",
      match: (p: string) => p.startsWith("/german"),
    },
    {
      href: "/vibe-coding",
      label: "Skills",
      kind: "icon",
      Icon: WandIcon,
      match: (p: string) => p.startsWith("/vibe-coding") || p.startsWith("/skills"),
    },
    {
      href: "/brain-training",
      label: "Brain",
      kind: "icon",
      Icon: BrainIcon,
      match: (p: string) => p.startsWith("/brain-training"),
    },
    {
      href: "/trivia",
      label: "Trivia",
      kind: "icon",
      Icon: FilmIcon,
      match: (p: string) => p.startsWith("/trivia"),
    },
  ];

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-border bg-surface">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-5 border-b border-border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/slubstack-logo.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
        <span
          className="font-display text-[22px] font-extrabold"
          style={{
            letterSpacing: "-0.03em",
            background: "linear-gradient(120deg, var(--accent) 0%, var(--game) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          slubstack
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const active = item.match(pathname ?? "");
          const progress = item.href in langProgress ? langProgress[item.href] : null;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-[14px] font-semibold transition-all duration-150",
                active
                  ? "text-[var(--accent)]"
                  : "text-fg/75 hover:text-fg"
              )}
              style={
                active
                  ? {
                      background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--game-soft) 100%)",
                      boxShadow: "var(--shadow-bouncy)",
                      border: "1.5px solid color-mix(in srgb, var(--accent) 24%, transparent)",
                    }
                  : {
                      background: "transparent",
                      border: "1.5px solid transparent",
                    }
              }
            >
              {item.kind === "mascot" ? (
                <Mascot kind={item.mascot} active={active} />
              ) : (
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-150",
                    active ? "text-[var(--accent)]" : "text-muted group-hover:text-fg"
                  )}
                  style={{
                    background: active
                      ? "var(--surface)"
                      : "color-mix(in srgb, var(--fg) 4%, transparent)",
                    border: active
                      ? "1.5px solid color-mix(in srgb, var(--accent) 28%, transparent)"
                      : "1.5px solid transparent",
                  }}
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

      <div className="border-t border-border px-3 py-4">
        <Link
          href="/stats"
          className={cn(
            "group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-[14px] font-semibold transition-all duration-150",
            pathname?.startsWith("/stats")
              ? "text-[var(--accent)]"
              : "text-fg/75 hover:text-fg"
          )}
          style={
            pathname?.startsWith("/stats")
              ? {
                  background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--game-soft) 100%)",
                  boxShadow: "var(--shadow-bouncy)",
                  border: "1.5px solid color-mix(in srgb, var(--accent) 24%, transparent)",
                }
              : { border: "1.5px solid transparent" }
          }
        >
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-150",
              pathname?.startsWith("/stats") ? "text-[var(--accent)]" : "text-muted group-hover:text-fg"
            )}
            style={{
              background: pathname?.startsWith("/stats")
                ? "var(--surface)"
                : "color-mix(in srgb, var(--fg) 4%, transparent)",
              border: pathname?.startsWith("/stats")
                ? "1.5px solid color-mix(in srgb, var(--accent) 28%, transparent)"
                : "1.5px solid transparent",
            }}
          >
            <UserCircle2 size={22} strokeWidth={2} />
          </span>
          Profile
        </Link>
      </div>
    </aside>
  );
}
