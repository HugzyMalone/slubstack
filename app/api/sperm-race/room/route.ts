import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const ROOM_CODE_RE = /^[A-Z2-9]{4}$/i;

type CreateRow = {
  match_id: string;
  seed: string;
  join_code: string;
  slot_index: number;
};

type JoinRow = {
  match_id: string;
  seed: string;
  slot_index: number;
};

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

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

  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    if (!ROOM_CODE_RE.test(code)) {
      return NextResponse.json({ error: "Invalid room code" }, { status: 400 });
    }

    const { data, error } = await admin.rpc("join_live_match_by_code", {
      p_user_id: user.id,
      p_join_code: code.toUpperCase(),
      p_display_name: displayName,
      p_avatar_url: avatarUrl,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const row = (Array.isArray(data) ? data[0] : data) as JoinRow | null | undefined;
    if (!row) return NextResponse.json({ error: "Join failed" }, { status: 500 });

    return NextResponse.json({
      matchId: row.match_id,
      seed: row.seed,
      slotIndex: row.slot_index,
    });
  }

  let body: { track?: unknown } = {};
  try {
    const text = await request.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const level =
    typeof body.track === "number" && Number.isInteger(body.track) && body.track >= 1 && body.track <= 3
      ? body.track
      : 1;

  const { data, error } = await admin.rpc("create_private_live_match", {
    p_user_id: user.id,
    p_game_kind: "sperm_race",
    p_level: level,
    p_display_name: displayName,
    p_avatar_url: avatarUrl,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const row = (Array.isArray(data) ? data[0] : data) as CreateRow | null | undefined;
  if (!row) return NextResponse.json({ error: "Room allocation failed" }, { status: 500 });

  return NextResponse.json({
    matchId: row.match_id,
    joinCode: row.join_code,
    seed: row.seed,
    slotIndex: row.slot_index,
    level,
  });
}
