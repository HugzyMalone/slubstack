import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SrsState } from "@/lib/srs";

type SyncPayload = {
  xp?: number;
  streak?: number;
  lastActiveDate?: string | null;
  wordsLearned?: number;
  unitsDone?: number;
  completedUnits?: string[];
  seenCardIds?: string[];
  srs?: Record<string, SrsState>;
};

function fallbackUsername(userId: string) {
  return `learner-${userId.slice(0, 8)}`;
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_stats")
    .select("xp, streak, state_json")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return NextResponse.json({ state: null });

  return NextResponse.json({
    state: data.state_json ?? { xp: data.xp ?? 0, streak: data.streak ?? 0 },
  });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as SyncPayload;

  await supabase.from("profiles").upsert(
    { id: user.id, username: fallbackUsername(user.id), email: user.email ?? null },
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
      state_json: {
        xp: body.xp ?? 0,
        streak: body.streak ?? 0,
        lastActiveDate: body.lastActiveDate ?? null,
        completedUnits: body.completedUnits ?? [],
        seenCardIds: body.seenCardIds ?? [],
        srs: body.srs ?? {},
      },
    },
    { onConflict: "user_id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
