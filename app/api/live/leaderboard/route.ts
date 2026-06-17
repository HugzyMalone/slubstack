import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { LadderKind, GameKind } from "@/lib/multiplayer/types";

const VALID_LADDERS: ReadonlySet<LadderKind> = new Set<LadderKind>([
  "math_blitz",
  "actor_blitz",
  "flag_blitz",
  "albums",
  "higher_lower",
  "year_guesser",
  "geo_clone",
  "batman_shakespeare",
  "sperm_race",
  "trivia",
  "ranked",
] satisfies (LadderKind | GameKind)[]);

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const kindParam = request.nextUrl.searchParams.get("kind") ?? "";
  if (!VALID_LADDERS.has(kindParam as LadderKind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  const kind = kindParam as LadderKind;

  const levelParam = request.nextUrl.searchParams.get("level");
  const level = levelParam ? Number(levelParam) : 1;
  if (!Number.isInteger(level) || level < 1 || level > 3) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 50);

  const { data, error } = await supabase
    .from("live_ratings")
    .select("user_id, rating, matches, wins, draws, losses, profiles!inner(username, avatar_url)")
    .eq("game_kind", kind)
    .eq("level", level)
    .order("rating", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const entries = (data ?? []).map((row, i) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      rank: i + 1,
      userId: row.user_id,
      username: profile?.username ?? "Learner",
      avatarUrl: profile?.avatar_url ?? null,
      rating: row.rating,
      matches: row.matches,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
    };
  });

  return NextResponse.json({ kind, level, entries });
}
