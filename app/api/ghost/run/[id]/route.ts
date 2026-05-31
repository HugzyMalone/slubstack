import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

type GhostRunRow = {
  id: string;
  user_id: string;
  game_kind: string;
  level: number;
  seed: string;
  score: number;
  correct: number;
  timeline: { atMs: number; scoreDelta: number }[];
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("ghost_runs")
    .select("id, user_id, game_kind, level, seed, score, correct, timeline")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const run = data as GhostRunRow;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", run.user_id)
    .maybeSingle();

  return NextResponse.json({
    id: run.id,
    gameKind: run.game_kind,
    level: run.level,
    seed: run.seed,
    score: run.score,
    correct: run.correct,
    timeline: run.timeline,
    ownerId: run.user_id,
    displayName: profile?.username ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  });
}
