import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDailyChallenge } from "@/lib/games/daily";

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { score?: unknown; correct?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { score, correct } = body;
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }
  if (typeof correct !== "number" || !Number.isInteger(correct) || correct < 0) {
    return NextResponse.json({ error: "Invalid correct" }, { status: 400 });
  }

  const challenge = getDailyChallenge();

  // Ensure a profile row exists so the leaderboard join resolves (mirrors the wordle score POST).
  await supabase.from("profiles").upsert(
    { id: user.id, username: `learner-${user.id.slice(0, 8)}`, email: user.email ?? null },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const { data, error } = await supabase.rpc("submit_daily_result", {
    p_date: challenge.date,
    p_game_kind: challenge.gameKind,
    p_score: score,
    p_correct: correct,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    rank: row?.rank ?? null,
    streak: row?.current_streak ?? 0,
    longest: row?.longest_streak ?? 0,
    alreadyPlayed: Boolean(row?.already_played),
  });
}
