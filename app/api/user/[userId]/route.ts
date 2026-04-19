import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const [profileRes, statsRes] = await Promise.all([
    supabase.from("profiles").select("username, avatar_url, status").eq("id", userId).maybeSingle(),
    supabase.from("user_stats").select("xp, streak, words_learned, units_done").eq("user_id", userId).maybeSingle(),
  ]);

  if (profileRes.error || statsRes.error)
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  if (!profileRes.data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    userId,
    username: profileRes.data.username ?? "Learner",
    avatar: profileRes.data.avatar_url ?? null,
    status: profileRes.data.status ?? null,
    xp: statsRes.data?.xp ?? 0,
    streak: statsRes.data?.streak ?? 0,
    wordsLearned: statsRes.data?.words_learned ?? 0,
    unitsDone: statsRes.data?.units_done ?? 0,
  });
}
