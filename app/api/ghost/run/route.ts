import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { GameKind } from "@/lib/multiplayer/types";

const VALID_KINDS: ReadonlySet<GameKind> = new Set([
  "math_blitz",
  "actor_blitz",
  "flag_blitz",
  "albums",
  "higher_lower",
  "year_guesser",
  "geo_clone",
  "batman_shakespeare",
]);

const MAX_TIMELINE = 1000;

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let body: {
    game_kind?: unknown;
    level?: unknown;
    seed?: unknown;
    score?: unknown;
    correct?: unknown;
    timeline?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { game_kind, level, seed, score, correct, timeline } = body;

  if (typeof game_kind !== "string" || !VALID_KINDS.has(game_kind as GameKind)) {
    return NextResponse.json({ error: "Invalid game_kind" }, { status: 400 });
  }
  if (typeof level !== "number" || !Number.isInteger(level) || level < 1) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }
  if (typeof seed !== "string" || seed.length === 0 || seed.length > 200) {
    return NextResponse.json({ error: "Invalid seed" }, { status: 400 });
  }
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }
  if (typeof correct !== "number" || !Number.isInteger(correct) || correct < 0) {
    return NextResponse.json({ error: "Invalid correct" }, { status: 400 });
  }
  if (!Array.isArray(timeline) || timeline.length > MAX_TIMELINE) {
    return NextResponse.json({ error: "Invalid timeline" }, { status: 400 });
  }
  for (const e of timeline) {
    if (typeof e?.atMs !== "number" || typeof e?.scoreDelta !== "number") {
      return NextResponse.json({ error: "Invalid timeline event" }, { status: 400 });
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await admin
    .from("ghost_runs")
    .insert({
      user_id: user.id,
      game_kind,
      level,
      seed,
      score,
      correct,
      timeline,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ runId: data.id });
}
