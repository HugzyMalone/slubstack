// Required Supabase SQL (run once in dashboard):
//
// CREATE TABLE IF NOT EXISTS actor_blitz_scores (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
//   score integer NOT NULL,
//   correct integer NOT NULL DEFAULT 0,
//   total integer NOT NULL DEFAULT 0,
//   best_streak integer NOT NULL DEFAULT 0,
//   accuracy integer NOT NULL DEFAULT 0,
//   created_at timestamptz DEFAULT now()
// );
// ALTER TABLE actor_blitz_scores ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "public read" ON actor_blitz_scores FOR SELECT USING (true);
// CREATE POLICY "own insert" ON actor_blitz_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
// CREATE INDEX ON actor_blitz_scores (score DESC);

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("actor_blitz_scores")
    .select("user_id, score, correct, total, profiles!inner(username, avatar_url)")
    .order("score", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const bestByUser = new Map<string, { username: string; avatar: string | null; score: number; correct: number; total: number }>();
  for (const row of data ?? []) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const existing = bestByUser.get(row.user_id);
    if (!existing || row.score > existing.score) {
      bestByUser.set(row.user_id, {
        username: (profile as { username?: string })?.username ?? "Learner",
        avatar: (profile as { avatar_url?: string | null })?.avatar_url ?? null,
        score: row.score,
        correct: row.correct,
        total: row.total,
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

  const { score, correct, total, bestStreak, accuracy } = (await request.json()) as {
    score: number; correct: number; total: number; bestStreak: number; accuracy: number;
  };

  if (typeof score !== "number" || score < 0 || !Number.isInteger(score)) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }

  const { error } = await supabase.from("actor_blitz_scores").insert({
    user_id: user.id,
    score,
    correct: correct ?? 0,
    total: total ?? 0,
    best_streak: bestStreak ?? 0,
    accuracy: accuracy ?? 0,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
