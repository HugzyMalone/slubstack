import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let body: { level?: unknown };
  try {
    body = (await request.json()) as { level?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { level } = body;
  if (level !== 1 && level !== 2 && level !== 3) {
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

  const { data, error } = await admin.rpc("find_or_create_waiting_live_math_match", {
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
