import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const date = request.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("wordle_scores")
    .select("user_id, attempts, solved, profiles!inner(username, avatar_url)")
    .eq("date", date)
    .order("solved", { ascending: false })
    .order("attempts", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const leaderboard = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      username: profile?.username ?? "Learner",
      avatar: profile?.avatar_url ?? null,
      attempts: row.attempts,
      solved: row.solved,
    };
  });

  return NextResponse.json({ leaderboard });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, attempts, solved } = (await request.json()) as {
    date: string; attempts: number; solved: boolean;
  };

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 6) {
    return NextResponse.json({ error: "Invalid attempts" }, { status: 400 });
  }
  if (typeof solved !== "boolean") {
    return NextResponse.json({ error: "Invalid solved" }, { status: 400 });
  }

  await supabase.from("profiles").upsert(
    { id: user.id, username: `learner-${user.id.slice(0, 8)}`, email: user.email ?? null },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const { error } = await supabase.from("wordle_scores").upsert(
    { user_id: user.id, date, attempts, solved },
    { onConflict: "user_id,date", ignoreDuplicates: true },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
