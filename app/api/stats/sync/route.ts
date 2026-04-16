import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SyncPayload = {
  xp?: number;
  streak?: number;
  wordsLearned?: number;
  unitsDone?: number;
};

function fallbackUsername(userId: string) {
  return `learner-${userId.slice(0, 8)}`;
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SyncPayload;

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      username: fallbackUsername(user.id),
      email: user.email ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const { error } = await supabase.from("user_stats").upsert(
    {
      user_id: user.id,
      xp: Math.max(0, Math.floor(body.xp ?? 0)),
      streak: Math.max(0, Math.floor(body.streak ?? 0)),
      words_learned: Math.max(0, Math.floor(body.wordsLearned ?? 0)),
      units_done: Math.max(0, Math.floor(body.unitsDone ?? 0)),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
