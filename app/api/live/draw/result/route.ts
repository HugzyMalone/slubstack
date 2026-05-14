import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PlayerUpdate = {
  slot: number;
  score: number;
  correct: number;
  rank: number;
};

function isPlayerUpdate(v: unknown): v is PlayerUpdate {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.slot === "number" && Number.isInteger(o.slot) && o.slot >= 0 &&
    typeof o.score === "number" && Number.isInteger(o.score) &&
    typeof o.correct === "number" && Number.isInteger(o.correct) &&
    typeof o.rank === "number" && Number.isInteger(o.rank) && o.rank >= 1
  );
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let body: { matchId?: unknown; playerUpdates?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { matchId, playerUpdates } = body;
  if (typeof matchId !== "string" || !UUID_RE.test(matchId)) {
    return NextResponse.json({ error: "Invalid matchId" }, { status: 400 });
  }
  if (!Array.isArray(playerUpdates) || playerUpdates.length === 0 || !playerUpdates.every(isPlayerUpdate)) {
    return NextResponse.json({ error: "Invalid playerUpdates" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerRow, error: callerError } = await admin
    .from("live_match_players")
    .select("slot")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (callerError) return NextResponse.json({ error: callerError.message }, { status: 500 });
  if (!callerRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin.rpc("finalise_draw_match", {
    p_match_id: matchId,
    p_player_updates: playerUpdates,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ finalised: data === true });
}
