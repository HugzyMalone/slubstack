"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Zap, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PandaImage } from "@/components/Panda";

const navItems = [
  {
    href: "/",
    label: "Home",
    Icon: Home,
    match: (p: string) =>
      p === "/" || p === "/mandarin" || p === "/german" || p === "/spanish" || p === "/trivia",
  },
  {
    href: "/spanish",
    label: "Spanish",
    Icon: BookOpen,
    match: (p: string) => p.startsWith("/spanish"),
  },
  {
    href: "/mandarin",
    label: "Mandarin",
    Icon: BookOpen,
    match: (p: string) => p.startsWith("/mandarin"),
  },
  {
    href: "/german",
    label: "German",
    Icon: BookOpen,
    match: (p: string) => p.startsWith("/german"),
  },
  {
    href: "/trivia",
    label: "Trivia",
    Icon: Zap,
    match: (p: string) => p.startsWith("/trivia"),
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-border bg-surface">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-5 py-4 border-b border-border"
      >
        <PandaImage size={28} />
        <span className="text-sm font-bold tracking-tight">slubstack</span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
        {navItems.map(({ href, label, Icon, match }) => {
          const active = match(pathname ?? "");
          return (
            <Link
              key={label}
              href={href}
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
              <Icon
                size={16}
                className={cn(
                  "shrink-0 transition-colors duration-150",
                  active ? "text-[var(--accent)]" : "text-muted group-hover:text-fg"
                )}
              />
              {label}
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
            size={16}
            className={cn(
              "shrink-0 transition-colors duration-150",
              pathname?.startsWith("/stats")
                ? "text-[var(--accent)]"
                : "text-muted group-hover:text-fg"
            )}
          />
          Profile
        </Link>
      </div>
    </aside>
  );
}
