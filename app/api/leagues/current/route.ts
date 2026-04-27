import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type CohortRow = {
  id: string;
  tier_id: number;
  week_start: string;
};

type MemberRow = {
  user_id: string;
  weekly_xp: number;
};

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type TierRow = {
  id: number;
  name: string;
  rank: number;
};

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: cohortIdData, error: assignErr } = await supabase.rpc("assign_cohort", { uid: user.id });
  if (assignErr) return NextResponse.json({ error: assignErr.message }, { status: 500 });
  const cohortId = cohortIdData as string;

  const [{ data: cohort }, { data: members }, { data: tiers }] = await Promise.all([
    supabase.from("league_cohorts").select("id, tier_id, week_start").eq("id", cohortId).maybeSingle<CohortRow>(),
    supabase.from("league_members").select("user_id, weekly_xp").eq("cohort_id", cohortId).order("weekly_xp", { ascending: false }).returns<MemberRow[]>(),
    supabase.from("league_tiers").select("id, name, rank").returns<TierRow[]>(),
  ]);

  const memberRows: MemberRow[] = members ?? [];
  const userIds = memberRows.map((m) => m.user_id);
  const profileMap = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds)
      .returns<ProfileRow[]>();
    for (const p of profiles ?? []) profileMap.set(p.id, p);
  }

  const ranked = memberRows.map((m, i) => {
    const p = profileMap.get(m.user_id);
    return {
      rank: i + 1,
      userId: m.user_id,
      username: p?.username ?? `learner-${m.user_id.slice(0, 8)}`,
      avatar: p?.avatar_url ?? null,
      weeklyXp: m.weekly_xp,
      isYou: m.user_id === user.id,
    };
  });

  return NextResponse.json({
    cohort: cohort ? { id: cohort.id, tierId: cohort.tier_id, weekStart: cohort.week_start } : null,
    tiers: (tiers ?? []).sort((a, b) => a.rank - b.rank),
    members: ranked,
  });
}
