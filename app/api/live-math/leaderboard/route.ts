import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const levelParam = request.nextUrl.searchParams.get("level");
  const level = levelParam ? Number(levelParam) : NaN;
  if (level !== 1 && level !== 2 && level !== 3) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("live_ratings")
    .select("user_id, rating, matches, wins, draws, losses, profiles!inner(username, avatar_url)")
    .eq("game_kind", "math_blitz")
    .eq("level", level)
    .order("rating", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const entries = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
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

  return NextResponse.json({ entries });
}
