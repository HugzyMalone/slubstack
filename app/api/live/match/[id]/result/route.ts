import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { GameKind } from "@/lib/multiplayer/types";

type Params = { params: Promise<{ id: string }> };

const VALID_KINDS: ReadonlySet<GameKind> = new Set([
  "math_blitz",
  "actor_blitz",
  "flag_blitz",
  "albums",
  "higher_lower",
  "year_guesser",
]);

type PlayerRow = {
  match_id: string;
  slot: number;
  user_id: string | null;
  is_bot: boolean;
  display_name: string;
  avatar_url: string | null;
  score: number | null;
  correct: number | null;
  rank: number | null;
  elo_before: number | null;
  elo_after: number | null;
};

type MatchRow = {
  id: string;
  game_kind: GameKind;
  level: number;
  seed: string;
  status: "waiting" | "playing" | "finished" | "abandoned";
  live_match_players: PlayerRow[];
};

function buildResponse(match: MatchRow) {
  const players = [...match.live_match_players]
    .sort((a, b) => a.slot - b.slot)
    .map((p) => ({
      slot: p.slot,
      userId: p.user_id,
      isBot: p.is_bot,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      score: p.score,
      correct: p.correct,
      rank: p.rank,
      eloBefore: p.elo_before,
      eloAfter: p.elo_after,
    }));

  return {
    matchId: match.id,
    gameKind: match.game_kind,
    status: match.status,
    level: match.level,
    players,
  };
}

export async function POST(request: Request, { params }: Params) {
  const { id: matchId } = await params;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let body: {
    game_kind?: unknown;
    humans_count?: unknown;
    bot_inserts?: unknown;
    player_updates?: unknown;
    rating_upserts?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { game_kind, humans_count, bot_inserts, player_updates, rating_upserts } = body;
  if (typeof game_kind !== "string" || !VALID_KINDS.has(game_kind as GameKind)) {
    return NextResponse.json({ error: "Invalid game_kind" }, { status: 400 });
  }
  if (typeof humans_count !== "number" || !Number.isInteger(humans_count) || humans_count < 0) {
    return NextResponse.json({ error: "Invalid humans_count" }, { status: 400 });
  }
  if (!Array.isArray(bot_inserts) || !Array.isArray(player_updates) || !Array.isArray(rating_upserts)) {
    return NextResponse.json({ error: "Invalid payload arrays" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: matchData, error: matchError } = await admin
    .from("live_matches")
    .select("*, live_match_players(*)")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });
  if (!matchData) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const match = matchData as unknown as MatchRow;
  if (match.game_kind !== game_kind) {
    return NextResponse.json({ error: "Game kind mismatch" }, { status: 400 });
  }

  const callerRow = match.live_match_players.find(
    (p) => !p.is_bot && p.user_id === user.id,
  );
  if (!callerRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (match.status === "finished") {
    return NextResponse.json(buildResponse(match));
  }

  const { error: rpcError } = await admin.rpc("finalise_live_match", {
    p_game_kind: game_kind,
    p_match_id: matchId,
    p_humans_count: humans_count,
    p_bot_inserts: bot_inserts,
    p_player_updates: player_updates,
    p_rating_upserts: rating_upserts,
  });

  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

  const { data: finalData, error: finalError } = await admin
    .from("live_matches")
    .select("*, live_match_players(*)")
    .eq("id", matchId)
    .maybeSingle();

  if (finalError) return NextResponse.json({ error: finalError.message }, { status: 500 });
  if (!finalData) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  return NextResponse.json(buildResponse(finalData as unknown as MatchRow));
}
