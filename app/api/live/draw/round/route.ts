import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RoundRow = {
  drawer_slot: number;
  word: string;
};

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let body: { matchId?: unknown; roundIndex?: unknown; callerSlot?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { matchId, roundIndex, callerSlot } = body;
  if (typeof matchId !== "string" || !UUID_RE.test(matchId)) {
    return NextResponse.json({ error: "Invalid matchId" }, { status: 400 });
  }
  if (typeof roundIndex !== "number" || !Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex > 32767) {
    return NextResponse.json({ error: "Invalid roundIndex" }, { status: 400 });
  }
  if (typeof callerSlot !== "number" || !Number.isInteger(callerSlot) || callerSlot < 0 || callerSlot > 7) {
    return NextResponse.json({ error: "Invalid callerSlot" }, { status: 400 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: callerRow, error: callerError } = await admin
    .from("live_match_players")
    .select("slot")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (callerError) return NextResponse.json({ error: callerError.message }, { status: 500 });
  if (!callerRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin.rpc("start_draw_round", {
    p_match_id: matchId,
    p_round_index: roundIndex,
    p_caller_slot: callerSlot,
  });

  if (error) {
    const msg = error.message ?? "";
    if (
      msg.includes("caller slot does not match") ||
      msg.includes("only host or drawer may start")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // 57014 = statement_timeout. On round start every client POSTs the same
    // round and they serialise on the RPC's pg_advisory_xact_lock; queued
    // callers can hit the timeout. That is transient contention, not a real
    // failure, so surface it as retryable rather than a hard 500.
    if (error.code === "57014" || msg.includes("statement timeout")) {
      return NextResponse.json({ error: "Round start busy, retry" }, { status: 503 });
    }
    console.error("[draw/round] start_draw_round RPC error", { matchId, roundIndex, callerSlot, error });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = (Array.isArray(data) ? data[0] : data) as RoundRow | null | undefined;
  if (!row) {
    console.error("[draw/round] RPC returned no row", { matchId, roundIndex, callerSlot });
    return NextResponse.json({ error: "Round start failed" }, { status: 500 });
  }

  const isDrawer = callerRow.slot === row.drawer_slot;
  return NextResponse.json({
    drawerSlot: row.drawer_slot,
    word: isDrawer ? row.word : null,
  });
}
