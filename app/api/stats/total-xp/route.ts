import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function fallbackUsername(userId: string) {
  return `learner-${userId.slice(0, 8)}`;
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { totalXp?: number };
  const totalXp = Math.max(0, Math.floor(body.totalXp ?? 0));

  await supabase.from("profiles").upsert(
    { id: user.id, username: fallbackUsername(user.id), email: user.email ?? null },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const { error } = await supabase.from("user_stats").upsert(
    { user_id: user.id, xp: totalXp, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
