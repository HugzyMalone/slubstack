"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle2, Brain, Sparkles, Globe, Film } from "lucide-react";
import { useStore } from "zustand";
import { cn } from "@/lib/utils";
import { mandarinStore, germanStore, spanishStore, vibeCodingStore } from "@/lib/store";
import { BullMascot } from "@/components/BullMascot";

function GrassBlock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="12,2 22,7 12,12 2,7" fill="#6cc24a"/>
      <polygon points="12,3.5 20,7 12,10.5 4,7" fill="#7fd35a" opacity="0.55"/>
      <polygon points="22,7 22,18 12,23 12,12" fill="#8b5a3c"/>
      <polygon points="22,7 22,9 12,14 12,12" fill="#5cb85c"/>
      <polygon points="2,7 2,18 12,23 12,12" fill="#6f4626"/>
      <polygon points="2,7 2,9 12,14 12,12" fill="#4a8b3c"/>
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
    | { kind: "flag"; flag: string }
    | { kind: "badge"; node: React.ReactNode; bg: string }
  );

  const renderNavLink = (
    item: NavItem,
    currentPath: string | null,
    progressByHref: Record<string, { done: number; total: number }>,
  ) => {
    const active = item.match(currentPath ?? "");
    const progress = item.href in progressByHref ? progressByHref[item.href] : null;
    return (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          "group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-[14px] font-semibold transition-all duration-150",
          active ? "text-[var(--accent)]" : "text-fg/75 hover:text-fg",
        )}
        style={
          active
            ? {
                background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--game-soft) 100%)",
                boxShadow: "var(--shadow-bouncy)",
                border: "1.5px solid color-mix(in srgb, var(--accent) 24%, transparent)",
              }
            : { background: "transparent", border: "1.5px solid transparent" }
        }
      >
        {item.kind === "mascot" ? (
          <Mascot kind={item.mascot} active={active} />
        ) : item.kind === "flag" ? (
          <span
            className={cn(
              "ml-1 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md transition-all duration-150",
              active ? "ring-2 ring-[color-mix(in_srgb,var(--accent)_36%,transparent)]" : "",
            )}
            style={{
              boxShadow: active ? "var(--shadow-bouncy)" : "0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.flag} alt="" className="h-full w-full object-cover" />
          </span>
        ) : item.kind === "badge" ? (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white transition-all duration-150",
              active ? "ring-2 ring-[color-mix(in_srgb,var(--accent)_36%,transparent)]" : "",
            )}
            style={{
              background: item.bg,
              boxShadow: active ? "var(--shadow-bouncy)" : "0 2px 6px rgba(0,0,0,0.08)",
            }}
          >
            {item.node}
          </span>
        ) : (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-150",
              active ? "text-[var(--accent)]" : "text-muted group-hover:text-fg",
            )}
            style={{
              background: active ? "var(--surface)" : "color-mix(in srgb, var(--fg) 4%, transparent)",
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
  };

  const homeItem: NavItem = {
    href: "/",
    label: "Home",
    kind: "icon",
    Icon: HomeIcon,
    match: (p: string) => p === "/",
  };

  const learningItems: NavItem[] = [
    {
      href: "/spanish",
      label: "Spanish",
      kind: "flag",
      flag: "/flags/es.svg",
      match: (p: string) => p.startsWith("/spanish"),
    },
    {
      href: "/mandarin",
      label: "Mandarin",
      kind: "flag",
      flag: "/flags/cn.svg",
      match: (p: string) => p.startsWith("/mandarin"),
    },
    {
      href: "/german",
      label: "German",
      kind: "flag",
      flag: "/flags/de.svg",
      match: (p: string) => p.startsWith("/german"),
    },
    {
      href: "/vibe-coding",
      label: "Skills",
      kind: "badge",
      node: <Sparkles size={18} strokeWidth={2.4} />,
      bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      match: (p: string) => p.startsWith("/vibe-coding") || p.startsWith("/skills"),
    },
    {
      href: "/brain-training",
      label: "Brain",
      kind: "badge",
      node: <Brain size={18} strokeWidth={2.4} />,
      bg: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
      match: (p: string) => p.startsWith("/brain-training"),
    },
  ];

  const gamesItems: NavItem[] = [
    {
      href: "/trivia",
      label: "Trivia",
      kind: "badge",
      node: <Film size={18} strokeWidth={2.4} />,
      bg: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
      match: (p: string) => p.startsWith("/trivia") && !p.startsWith("/trivia/geo-clone"),
    },
    {
      href: "/trivia/geo-clone",
      label: "GeoClone",
      kind: "badge",
      node: <Globe size={18} strokeWidth={2.4} />,
      bg: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
      match: (p: string) => p.startsWith("/trivia/geo-clone"),
    },
    {
      href: "/games/block-yard",
      label: "BlockYard",
      kind: "badge",
      node: <GrassBlock />,
      bg: "transparent",
      match: (p: string) => p.startsWith("/games/block-yard"),
    },
  ];

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-border bg-surface">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-1 px-2 py-1 border-b border-border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/slubstack-logo.png" alt="" className="h-24 w-24 -my-2 -mx-1 object-contain" />
        <span
          className="font-display flex flex-col items-center text-[30px] font-extrabold leading-[0.95]"
          style={{
            letterSpacing: "-0.04em",
            background: "linear-gradient(120deg, var(--accent) 0%, var(--game) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          <span>slub</span>
          <span>stack</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {renderNavLink(homeItem, pathname, langProgress)}

        <p className="mt-4 mb-1 px-3 text-[10px] font-extrabold tracking-[0.2em] text-muted uppercase">Learning</p>
        {learningItems.map((item) => renderNavLink(item, pathname, langProgress))}

        <p className="mt-4 mb-1 px-3 text-[10px] font-extrabold tracking-[0.2em] text-muted uppercase">Games</p>
        {gamesItems.map((item) => renderNavLink(item, pathname, langProgress))}
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
