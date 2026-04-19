// Required Supabase SQL (run once in dashboard):
//
// CREATE TABLE IF NOT EXISTS math_blitz_scores (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
//   difficulty text NOT NULL,
//   score integer NOT NULL,
//   correct integer NOT NULL DEFAULT 0,
//   created_at timestamptz DEFAULT now()
// );
// ALTER TABLE math_blitz_scores ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "public read" ON math_blitz_scores FOR SELECT USING (true);
// CREATE POLICY "own insert" ON math_blitz_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
// CREATE INDEX ON math_blitz_scores (difficulty, score DESC);

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const difficulty = request.nextUrl.searchParams.get("difficulty") ?? "medium";

  const { data, error } = await supabase
    .from("math_blitz_scores")
    .select("user_id, score, correct, created_at, profiles!inner(username, avatar_url)")
    .eq("difficulty", difficulty)
    .order("score", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Best score per user
  const bestByUser = new Map<string, { username: string; avatar: string | null; score: number; correct: number }>();
  for (const row of data ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const existing = bestByUser.get(row.user_id);
    if (!existing || row.score > existing.score) {
      bestByUser.set(row.user_id, {
        username: profile?.username ?? "Learner",
        avatar: profile?.avatar_url ?? null,
        score: row.score,
        correct: row.correct,
      });
    }
  }

  const leaderboard = Array.from(bestByUser.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return NextResponse.json({ leaderboard });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { difficulty, score, correct } = (await request.json()) as {
    difficulty: string; score: number; correct: number;
  };

  const VALID_DIFFICULTIES = ["easy", "medium", "hard"] as const;
  if (!VALID_DIFFICULTIES.includes(difficulty as typeof VALID_DIFFICULTIES[number])) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }
  if (typeof score !== "number" || score < 0 || !Number.isInteger(score)) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }
  if (typeof correct !== "number" || correct < 0 || !Number.isInteger(correct)) {
    return NextResponse.json({ error: "Invalid correct count" }, { status: 400 });
  }

  const { error } = await supabase.from("math_blitz_scores").insert({
    user_id: user.id,
    difficulty,
    score,
    correct: correct ?? 0,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
