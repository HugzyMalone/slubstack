// Result endpoint does not award XP. The client awards `correct * 5` to brainTrainingStore
// on round end, matching solo Math Blitz. ELO updates here; XP awarded client-side.

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { simulateBotTimeline } from "@/lib/math-blitz/bot";
import { updateRatings, type EloPlayer } from "@/lib/math-blitz/elo";
import type { Level } from "@/lib/math-blitz/engine";

type Params = { params: Promise<{ id: string }> };

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
  level: Level;
  seed: string;
  status: "waiting" | "playing" | "finished" | "abandoned";
  live_math_match_players: PlayerRow[];
};

const MATCH_DURATION_MS = 30_000;
const DEFAULT_RATING = 1200;

function buildResponse(match: MatchRow) {
  const players = [...match.live_math_match_players]
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
    status: match.status,
    level: match.level,
    players,
  };
}

function denseRanks(scores: number[]): number[] {
  const sorted = [...new Set(scores)].sort((a, b) => b - a);
  const rankFor = new Map<number, number>();
  sorted.forEach((s, i) => rankFor.set(s, i + 1));
  return scores.map((s) => rankFor.get(s)!);
}

export async function POST(request: Request, { params }: Params) {
  const { id: matchId } = await params;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let body: { score?: unknown; correct?: unknown };
  try {
    body = (await request.json()) as { score?: unknown; correct?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { score, correct } = body;
  if (
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 0 ||
    typeof correct !== "number" ||
    !Number.isInteger(correct) ||
    correct < 0
  ) {
    return NextResponse.json({ error: "Invalid score or correct" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: matchData, error: matchError } = await admin
    .from("live_math_matches")
    .select("*, live_math_match_players(*)")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });
  if (!matchData) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  let match = matchData as unknown as MatchRow;

  const callerRow = match.live_math_match_players.find(
    (p) => !p.is_bot && p.user_id === user.id,
  );
  if (!callerRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (match.status === "finished") {
    return NextResponse.json(buildResponse(match));
  }

  const { error: updateError } = await admin
    .from("live_math_match_players")
    .update({ score, correct })
    .eq("match_id", matchId)
    .eq("slot", callerRow.slot);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  callerRow.score = score;
  callerRow.correct = correct;

  const humans = match.live_math_match_players.filter((p) => !p.is_bot);
  const allHumansReported = humans.every((p) => p.score !== null);

  if (allHumansReported) {
    const occupiedSlots = new Set(match.live_math_match_players.map((p) => p.slot));
    const botInserts: Array<{
      slot: number;
      display_name: string;
      score: number;
      correct: number;
    }> = [];

    for (let slot = 0; slot < 4; slot++) {
      if (occupiedSlots.has(slot)) continue;
      const events = simulateBotTimeline(match.seed, match.level, MATCH_DURATION_MS, slot);
      const botScore = events.reduce((sum, e) => sum + e.scoreDelta, 0);
      const botCorrect = Math.round(botScore / 12);
      botInserts.push({
        slot,
        display_name: `MathBot ${slot + 1}`,
        score: botScore,
        correct: botCorrect,
      });
    }

    const allSlots: Array<{
      slot: number;
      userId: string | null;
      isBot: boolean;
      score: number;
      correct: number;
    }> = [];

    for (const p of match.live_math_match_players) {
      allSlots.push({
        slot: p.slot,
        userId: p.user_id,
        isBot: p.is_bot,
        score: p.score ?? 0,
        correct: p.correct ?? 0,
      });
    }
    for (const b of botInserts) {
      allSlots.push({
        slot: b.slot,
        userId: null,
        isBot: true,
        score: b.score,
        correct: b.correct,
      });
    }

    allSlots.sort((a, b) => a.slot - b.slot);

    const ranks = denseRanks(allSlots.map((s) => s.score));
    allSlots.forEach((s, i) => ((s as { rank?: number }).rank = ranks[i]));

    const humanIds = allSlots.filter((s) => !s.isBot).map((s) => s.userId!);
    const { data: ratingRows, error: ratingError } = await admin
      .from("live_math_ratings")
      .select("user_id, rating, matches, wins, draws, losses")
      .eq("level", match.level)
      .in("user_id", humanIds);

    if (ratingError) return NextResponse.json({ error: ratingError.message }, { status: 500 });

    const ratingByUser = new Map<
      string,
      { rating: number; matches: number; wins: number; draws: number; losses: number }
    >();
    for (const r of ratingRows ?? []) {
      ratingByUser.set(r.user_id, {
        rating: r.rating,
        matches: r.matches,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
      });
    }

    const eloInput: EloPlayer[] = allSlots.map((s) => {
      if (s.isBot) {
        return { userId: `bot-${s.slot}`, rating: 0, matches: 0, score: s.score, isBot: true };
      }
      const existing = ratingByUser.get(s.userId!);
      return {
        userId: s.userId!,
        rating: existing?.rating ?? DEFAULT_RATING,
        matches: existing?.matches ?? 0,
        score: s.score,
        isBot: false,
      };
    });

    const eloUpdates = updateRatings(eloInput);
    const eloByUser = new Map(eloUpdates.map((u) => [u.userId, u]));

    const humanSlots = allSlots.filter((s) => !s.isBot) as Array<
      typeof allSlots[number] & { rank: number }
    >;
    const humanRanks = humanSlots.map((s) => s.rank);
    const minHumanRank = Math.min(...humanRanks);
    const maxHumanRank = Math.max(...humanRanks);

    const playerUpdates: Array<{
      slot: number;
      score: number;
      correct: number;
      rank: number;
      elo_before: number | null;
      elo_after: number | null;
    }> = [];

    const ratingUpserts: Array<{
      user_id: string;
      level: number;
      rating: number;
      matches: number;
      wins: number;
      draws: number;
      losses: number;
    }> = [];

    for (const s of allSlots) {
      if (s.isBot) continue;
      const typed = s as typeof s & { rank: number };
      const elo = eloByUser.get(s.userId!);
      const eloBefore = elo?.before ?? null;
      const eloAfter = elo?.after ?? null;

      playerUpdates.push({
        slot: s.slot,
        score: s.score,
        correct: s.correct,
        rank: typed.rank,
        elo_before: eloBefore,
        elo_after: eloAfter,
      });

      if (elo) {
        const existing = ratingByUser.get(s.userId!);
        const baseMatches = existing?.matches ?? 0;
        const baseWins = existing?.wins ?? 0;
        const baseDraws = existing?.draws ?? 0;
        const baseLosses = existing?.losses ?? 0;

        let isWin = false;
        let isLoss = false;
        if (humanSlots.length >= 2) {
          const uniquelyHeld = humanRanks.filter((r) => r === typed.rank).length === 1;
          if (uniquelyHeld && typed.rank === minHumanRank) isWin = true;
          else if (uniquelyHeld && typed.rank === maxHumanRank) isLoss = true;
        }
        const isDraw = !isWin && !isLoss;

        ratingUpserts.push({
          user_id: s.userId!,
          level: match.level,
          rating: elo.after,
          matches: baseMatches + 1,
          wins: baseWins + (isWin ? 1 : 0),
          draws: baseDraws + (isDraw ? 1 : 0),
          losses: baseLosses + (isLoss ? 1 : 0),
        });
      }
    }

    const botInsertPayload = botInserts.map((b) => {
      const slotData = allSlots.find((s) => s.slot === b.slot)! as typeof allSlots[number] & {
        rank: number;
      };
      return {
        slot: b.slot,
        display_name: b.display_name,
        score: b.score,
        correct: b.correct,
        rank: slotData.rank,
      };
    });

    const { error: rpcError } = await admin.rpc("finalise_live_math_match", {
      p_match_id: matchId,
      p_bot_inserts: botInsertPayload,
      p_player_updates: playerUpdates,
      p_rating_upserts: ratingUpserts,
    });

    if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  const { data: finalData, error: finalError } = await admin
    .from("live_math_matches")
    .select("*, live_math_match_players(*)")
    .eq("id", matchId)
    .maybeSingle();

  if (finalError) return NextResponse.json({ error: finalError.message }, { status: 500 });
  if (!finalData) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  match = finalData as unknown as MatchRow;
  return NextResponse.json(buildResponse(match));
}
