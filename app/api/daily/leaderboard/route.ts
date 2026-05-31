import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTodayStr } from "@/lib/wordle-words";

const DEFAULT_LIMIT = 50;

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const date = request.nextUrl.searchParams.get("date") ?? getTodayStr();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100 ? limitParam : DEFAULT_LIMIT;

  const { data, error } = await supabase
    .from("daily_results")
    .select("user_id, score, correct, profiles!inner(username, avatar_url)")
    .eq("date", date)
    .order("score", { ascending: false })
    .order("correct", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const entries = (data ?? []).map((row, i) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      rank: i + 1,
      userId: row.user_id,
      username: profile?.username ?? "Learner",
      avatarUrl: profile?.avatar_url ?? null,
      score: row.score,
      correct: row.correct,
    };
  });

  return NextResponse.json({ date, entries });
}
