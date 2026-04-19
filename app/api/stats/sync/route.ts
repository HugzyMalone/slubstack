import { NextRequest, NextResponse } from "next/server";
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
  totalXp?: number;
};

function fallbackUsername(userId: string) {
  return `learner-${userId.slice(0, 8)}`;
}

function stateJson(body: SyncPayload) {
  return {
    xp: body.xp ?? 0,
    streak: body.streak ?? 0,
    lastActiveDate: body.lastActiveDate ?? null,
    completedUnits: body.completedUnits ?? [],
    seenCardIds: body.seenCardIds ?? [],
    srs: body.srs ?? {},
  };
}

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lang = request.nextUrl.searchParams.get("lang");

  const { data } = await supabase
    .from("user_stats")
    .select("xp, streak, state_json, german_state_json, spanish_state_json, vibe_state_json")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return NextResponse.json({ state: null });

  if (lang === "german")      return NextResponse.json({ state: data.german_state_json ?? null });
  if (lang === "spanish")     return NextResponse.json({ state: data.spanish_state_json ?? null });
  if (lang === "vibe-coding") return NextResponse.json({ state: data.vibe_state_json ?? null });

  return NextResponse.json({
    state: data.state_json ?? { xp: data.xp ?? 0, streak: data.streak ?? 0 },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as SyncPayload;
  const lang = request.nextUrl.searchParams.get("lang");

  await supabase.from("profiles").upsert(
    { id: user.id, username: fallbackUsername(user.id), email: user.email ?? null },
    { onConflict: "id", ignoreDuplicates: true },
  );

  let upsertData: Record<string, unknown>;

  const totalXp = body.totalXp !== undefined ? Math.max(0, Math.floor(body.totalXp)) : undefined;

  if (lang === "german") {
    upsertData = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      german_state_json: stateJson(body),
      ...(totalXp !== undefined && { xp: totalXp }),
    };
  } else if (lang === "spanish") {
    upsertData = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      spanish_state_json: stateJson(body),
      ...(totalXp !== undefined && { xp: totalXp }),
    };
  } else if (lang === "vibe-coding") {
    upsertData = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      vibe_state_json: stateJson(body),
      ...(totalXp !== undefined && { xp: totalXp }),
    };
  } else {
    upsertData = {
      user_id: user.id,
      xp: totalXp ?? Math.max(0, Math.floor(body.xp ?? 0)),
      streak: Math.max(0, Math.floor(body.streak ?? 0)),
      words_learned: Math.max(0, Math.floor(body.wordsLearned ?? 0)),
      units_done: Math.max(0, Math.floor(body.unitsDone ?? 0)),
      updated_at: new Date().toISOString(),
      state_json: stateJson(body),
    };
  }

  const { error } = await supabase.from("user_stats").upsert(upsertData, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
