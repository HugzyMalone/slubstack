import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUtcTodayStr } from "@/lib/wordle-words";

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const date = request.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("connections_scores")
    .select("user_id, solved, mistakes")
    .eq("date", date)
    .order("solved", { ascending: false })
    .order("mistakes", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // connections_scores.user_id is FK'd to auth.users, not profiles, so PostgREST
  // can't embed the profiles relationship — join it in app code instead.
  const rows = data ?? [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", [...new Set(rows.map((row) => row.user_id))]);
  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const leaderboard = rows.map((row) => {
    const profile = byId.get(row.user_id);
    return {
      username: profile?.username ?? "Learner",
      avatar: profile?.avatar_url ?? null,
      solved: row.solved,
      mistakes: row.mistakes,
    };
  });

  return NextResponse.json({ leaderboard });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { solved, mistakes } = (await request.json()) as {
    solved: boolean; mistakes: number;
  };

  const date = getUtcTodayStr();

  if (!Number.isInteger(mistakes) || mistakes < 0 || mistakes > 4) {
    return NextResponse.json({ error: "Invalid mistakes" }, { status: 400 });
  }
  if (typeof solved !== "boolean") {
    return NextResponse.json({ error: "Invalid solved" }, { status: 400 });
  }

  await supabase.from("profiles").upsert(
    { id: user.id, username: `learner-${user.id.slice(0, 8)}`, email: user.email ?? null },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const { error } = await supabase.from("connections_scores").insert(
    { user_id: user.id, date, solved, mistakes },
  );

  // 23505 = unique_violation: score already recorded for this user+date — treat as success.
  if (error && error.code !== "23505") {
    // Payload is validated above, so a failure here is a server/DB fault (transient
    // or RLS), not a bad request. Log it and return 500 so a recurrence is
    // diagnosable rather than a silent, unlogged 400 that leaks the raw DB message.
    console.error("[scores/connections] insert failed", { userId: user.id, date, code: error.code, message: error.message });
    return NextResponse.json({ error: "Could not record score" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
