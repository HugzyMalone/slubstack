"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Flame, Zap, User } from "lucide-react";
import { levelFromXp, xpToNextLevel } from "@/lib/xp";

const TIERS = [
  { min: 50, name: "Obsidian",  color: "#8b5cf6" },
  { min: 40, name: "Emerald",   color: "#10b981" },
  { min: 30, name: "Diamond",   color: "#60d5fa" },
  { min: 20, name: "Platinum",  color: "#b0bec5" },
  { min: 10, name: "Gold",      color: "#f59e0b" },
  { min: 5,  name: "Silver",    color: "#94a3b8" },
  { min: 0,  name: "Bronze",    color: "#cd7c54" },
];
function getTier(level: number) {
  return TIERS.find((t) => level >= t.min) ?? TIERS[TIERS.length - 1];
}

function isAvatarUrl(v: string | null | undefined): v is string {
  return !!v && (v.startsWith("http") || v.startsWith("data:") || v.startsWith("/"));
}

type Profile = {
  userId: string;
  username: string;
  avatar: string | null;
  status: string | null;
  xp: number;
  streak: number;
  wordsLearned: number;
  unitsDone: number;
};

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/user/${userId}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { setProfile(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [userId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 pt-8 animate-pulse space-y-4">
        <div className="rounded-3xl border border-border bg-surface p-6">
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 rounded-full bg-border" />
          </div>
          <div className="mx-auto h-5 w-32 rounded bg-border mb-2" />
          <div className="mx-auto h-3 w-24 rounded bg-border" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 pt-12 text-center text-muted text-sm">
        Profile not found.
      </div>
    );
  }

  const level = levelFromXp(profile.xp);
  const { current, next, progress } = xpToNextLevel(profile.xp);
  const tier = getTier(level);

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-4">
      <div className="rounded-3xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="flex justify-center mb-4">
            {isAvatarUrl(profile.avatar) ? (
              <div className="h-24 w-24 rounded-full overflow-hidden bg-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.avatar} alt="avatar" className="h-full w-full object-cover object-center" />
              </div>
            ) : (
              <div
                className="h-24 w-24 rounded-full flex items-center justify-center"
                style={{ background: "color-mix(in srgb, var(--accent) 15%, var(--surface))" }}
              >
                {profile.avatar
                  ? <span className="text-5xl">{profile.avatar}</span>
                  : <User size={36} className="text-muted" />
                }
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-bold leading-none">{profile.username}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold leading-none"
              style={{
                background: `color-mix(in srgb, ${tier.color} 15%, var(--surface))`,
                color: tier.color,
                border: `1px solid color-mix(in srgb, ${tier.color} 35%, transparent)`,
              }}
            >
              {tier.name} · Lv. {level}
            </span>
          </div>

          {profile.status ? (
            <p className="mt-1.5 text-sm text-muted italic">&ldquo;{profile.status}&rdquo;</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted/50">No status set</p>
          )}

          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%`, background: tier.color }}
              />
            </div>
            <div className="mt-1.5 text-xs text-muted tabular-nums">
              {profile.xp - current} <span className="opacity-50">/</span> {next - current} XP to level {level + 1}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-border divide-x divide-border">
          <div className="flex flex-col items-center gap-1 py-3 px-1">
            <Flame size={14} className="text-orange-400" />
            <span className="text-sm font-bold tabular-nums leading-none">{profile.streak}d</span>
            <span className="text-[9px] text-muted leading-none">streak</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-3 px-1">
            <Zap size={14} className="text-amber-400" />
            <span className="text-sm font-bold tabular-nums leading-none">{profile.xp}</span>
            <span className="text-[9px] text-muted leading-none">xp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
