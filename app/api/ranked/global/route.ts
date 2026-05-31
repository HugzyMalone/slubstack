import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { RANKED_LADDER } from "@/lib/multiplayer/types";

type RatingRow = {
  user_id: string;
  game_kind: string;
  rating: number;
  matches: number;
  profiles: { username: string | null; avatar_url: string | null } | { username: string | null; avatar_url: string | null }[] | null;
};

// The cross-game ranked ladder: one rating per player. Reads the shared
// RANKED_LADDER rows from live_ratings; no dedicated table. The max-dedup is a
// safety net (one row per user is expected).
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 25, 1), 50);

  const { data, error } = await supabase
    .from("live_ratings")
    .select("user_id, game_kind, rating, matches, profiles!inner(username, avatar_url)")
    .eq("game_kind", RANKED_LADDER)
    .order("rating", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const bestByUser = new Map<string, { rating: number; gameKind: string; matches: number; username: string; avatarUrl: string | null }>();
  for (const row of (data ?? []) as RatingRow[]) {
    if (bestByUser.has(row.user_id)) continue;
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    bestByUser.set(row.user_id, {
      rating: row.rating,
      gameKind: row.game_kind,
      matches: row.matches,
      username: profile?.username ?? "Learner",
      avatarUrl: profile?.avatar_url ?? null,
    });
  }

  const entries = [...bestByUser.entries()]
    .map(([userId, v]) => ({ userId, ...v }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit)
    .map((e, i) => ({ rank: i + 1, ...e }));

  return NextResponse.json({ entries });
}
