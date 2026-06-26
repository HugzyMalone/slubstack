"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Landmark, ChevronRight } from "lucide-react";
import { RoundShell } from "@/components/multiplayer/RoundShell";
import {
  makeGeoCloneAdapter,
  GEO_CLONE_CATEGORIES,
  LOCATION_POOLS,
  type GeoCloneCategory,
} from "@/lib/games/geo-clone/adapter";
import { PlayBoard } from "@/components/games/geo-clone/PlayBoard";
import { RevealBoard } from "@/components/games/geo-clone/RevealBoard";

const CATEGORY_VISUAL: Record<GeoCloneCategory, { icon: typeof Globe; gradient: string; accent: string }> = {
  global: {
    icon: Globe,
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
    accent: "#0ea5e9",
  },
  london: {
    icon: Landmark,
    gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    accent: "#ef4444",
  },
};

export default function GeoClonePage() {
  const [category, setCategory] = useState<GeoCloneCategory | null>(null);

  const adapter = useMemo(() => (category ? makeGeoCloneAdapter(category) : null), [category]);
  const level = useMemo(
    () => (category ? GEO_CLONE_CATEGORIES.find((c) => c.id === category)!.level : 1),
    [category],
  );

  if (adapter && category) {
    return <RoundShell adapter={adapter} level={level} PlayBoard={PlayBoard} RevealBoard={RevealBoard} />;
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">GeoClone</h1>
        <p className="mt-1 text-sm text-muted">
          Pick where you&apos;re dropping in. 5 rounds × 60 seconds.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {GEO_CLONE_CATEGORIES.map((cat) => {
          const visual = CATEGORY_VISUAL[cat.id];
          const Icon = visual.icon;
          const poolSize = LOCATION_POOLS[cat.id].length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className="block w-full text-left transition-transform duration-150 active:scale-[0.99]"
            >
              <div
                className="flex items-center gap-4 rounded-2xl px-5 py-4"
                style={{
                  background: "var(--surface)",
                  border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
                }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: visual.gradient }}
                >
                  <Icon size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold">{cat.label}</div>
                  <div className="text-sm text-muted">{cat.blurb}</div>
                  <div className="mt-1 text-xs font-medium" style={{ color: visual.accent }}>
                    {poolSize} locations
                  </div>
                </div>
                <ChevronRight size={20} className="shrink-0 text-muted" />
              </div>
            </button>
          );
        })}
      </div>

      <Link
        href="/trivia"
        className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-sm font-medium"
      >
        <ArrowLeft size={15} /> Back to trivia
      </Link>
    </div>
  );
}
