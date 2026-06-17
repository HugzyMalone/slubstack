import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateTapTimeline } from "@/lib/games/sperm-race/engine";
import type { Track } from "@/lib/games/sperm-race/engine";
import type { GameKind, LadderKind } from "@/lib/multiplayer/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_LADDERS: ReadonlySet<LadderKind> = new Set<LadderKind>([
  "math_blitz",
  "actor_blitz",
  "flag_blitz",
  "albums",
  "higher_lower",
  "year_guesser",
  "geo_clone",
  "batman_shakespeare",
  "type_racer",
  "sperm_race",
  "trivia",
  "ranked",
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

function buildResponse(match: MatchRow, validMs: number, improved: boolean) {
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
    validMs,
    improved,
  };
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let body: {
    matchId?: unknown;
    track?: unknown;
    taps?: unknown;
    rating_kind?: unknown;
    humans_count?: unknown;
    bot_inserts?: unknown;
    player_updates?: unknown;
    rating_upserts?: unknown;
    allow_bot_rating?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { matchId, track, taps, rating_kind, humans_count, bot_inserts, player_updates, rating_upserts, allow_bot_rating } = body;

  if (typeof matchId !== "string" || !UUID_RE.test(matchId)) {
    return NextResponse.json({ error: "Invalid matchId" }, { status: 400 });
  }
  if (track !== 1 && track !== 2 && track !== 3) {
    return NextResponse.json({ error: "Invalid track" }, { status: 400 });
  }
  if (!Array.isArray(taps) || !taps.every((t) => typeof t === "number" && Number.isFinite(t))) {
    return NextResponse.json({ error: "Invalid taps" }, { status: 400 });
  }
  const ratingKind: LadderKind | null =
    rating_kind === undefined || rating_kind === null
      ? null
      : typeof rating_kind === "string" && VALID_LADDERS.has(rating_kind as LadderKind)
        ? (rating_kind as LadderKind)
        : null;
  if (rating_kind !== undefined && rating_kind !== null && ratingKind === null) {
    return NextResponse.json({ error: "Invalid rating_kind" }, { status: 400 });
  }
  if (typeof humans_count !== "number" || !Number.isInteger(humans_count) || humans_count < 0) {
    return NextResponse.json({ error: "Invalid humans_count" }, { status: 400 });
  }
  if (!Array.isArray(bot_inserts) || !Array.isArray(player_updates) || !Array.isArray(rating_upserts)) {
    return NextResponse.json({ error: "Invalid payload arrays" }, { status: 400 });
  }

  // Never trust a client-supplied finish time: recompute from the tap timeline
  // and reject any run that implies an impossible tap rate or wrong tap count.
  const { validMs } = validateTapTimeline(taps as number[], track as Track);
  if (validMs === null) {
    return NextResponse.json({ error: "Run rejected" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ratingUpserts = user.is_anonymous ? [] : rating_upserts;

  const { data: matchData, error: matchError } = await admin
    .from("live_matches")
    .select("*, live_match_players(*)")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });
  if (!matchData) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const match = matchData as unknown as MatchRow;
  if (match.game_kind !== "sperm_race") {
    return NextResponse.json({ error: "Game kind mismatch" }, { status: 400 });
  }

  const callerRow = match.live_match_players.find(
    (p) => !p.is_bot && p.user_id === user.id,
  );
  if (!callerRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Best-time board write runs under the service-role client with the server-derived
  // user id and the server-recomputed validMs — never a client-supplied time.
  const { data: improved, error: timesError } = await admin.rpc("record_race_times", {
    p_user_id: user.id,
    p_track: track,
    p_best_ms: validMs,
  });
  if (timesError) return NextResponse.json({ error: timesError.message }, { status: 500 });

  if (match.status === "finished") {
    return NextResponse.json(buildResponse(match, validMs, improved === true));
  }

  const rpcParams: Record<string, unknown> = {
    p_game_kind: "sperm_race",
    p_match_id: matchId,
    p_humans_count: humans_count,
    p_bot_inserts: bot_inserts,
    p_player_updates: player_updates,
    p_rating_upserts: ratingUpserts,
  };
  if (ratingKind !== null && ratingKind !== "sperm_race") {
    rpcParams.p_rating_kind = ratingKind;
  }
  if (allow_bot_rating === true) {
    rpcParams.p_allow_bot_rating = true;
  }
  const { error: rpcError } = await admin.rpc("finalise_live_match", rpcParams);

  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

  const { data: finalData, error: finalError } = await admin
    .from("live_matches")
    .select("*, live_match_players(*)")
    .eq("id", matchId)
    .maybeSingle();

  if (finalError) return NextResponse.json({ error: finalError.message }, { status: 500 });
  if (!finalData) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  return NextResponse.json(buildResponse(finalData as unknown as MatchRow, validMs, improved === true));
}
