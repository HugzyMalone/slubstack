import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Body = { amount?: number };

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Body;
  const amount = Math.max(0, Math.floor(body.amount ?? 0));
  if (amount === 0) return NextResponse.json({ ok: true, skipped: true });

  const { error } = await supabase.rpc("award_league_xp", { uid: user.id, amount });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
