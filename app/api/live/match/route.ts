import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { GameKind } from "@/lib/multiplayer/types";

const VALID_KINDS: ReadonlySet<GameKind> = new Set([
  "math_blitz",
  "actor_blitz",
  "flag_blitz",
  "posters",
  "albums",
  "logos",
  "higher_lower",
  "year_guesser",
]);

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let body: { game_kind?: unknown; level?: unknown };
  try {
    body = (await request.json()) as { game_kind?: unknown; level?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { game_kind, level } = body;
  if (typeof game_kind !== "string" || !VALID_KINDS.has(game_kind as GameKind)) {
    return NextResponse.json({ error: "Invalid game_kind" }, { status: 400 });
  }
  if (typeof level !== "number" || !Number.isInteger(level) || level < 1) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const displayName = profile?.username ?? `learner-${user.id.slice(0, 8)}`;
  const avatarUrl = profile?.avatar_url ?? null;

  const { data, error } = await admin.rpc("find_or_create_waiting_live_match", {
    p_game_kind: game_kind,
    p_level: level,
    p_user_id: user.id,
    p_display_name: displayName,
    p_avatar_url: avatarUrl,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const row = (Array.isArray(data) ? data[0] : data) as
    | { match_id: string; seed: string; slot_index: number }
    | null
    | undefined;
  if (!row) return NextResponse.json({ error: "Match allocation failed" }, { status: 500 });

  return NextResponse.json({
    matchId: row.match_id,
    seed: row.seed,
    level,
    slotIndex: row.slot_index,
  });
}
