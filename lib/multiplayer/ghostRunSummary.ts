import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSprintAdapter } from "@/lib/games/registry";

export type GhostRunSummary = {
  id: string;
  gameKind: string;
  gameName: string;
  score: number;
  scoreLabel: string;
  displayName: string;
};

export async function getGhostRunSummary(runId: string): Promise<GhostRunSummary | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data: run } = await admin
    .from("ghost_runs")
    .select("id, user_id, game_kind, score")
    .eq("id", runId)
    .maybeSingle();

  if (!run) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("username")
    .eq("id", run.user_id)
    .maybeSingle();

  const adapter = getSprintAdapter(run.game_kind);

  return {
    id: run.id,
    gameKind: run.game_kind,
    gameName: adapter?.displayName ?? "Slubstack",
    score: run.score,
    scoreLabel: adapter?.scoreLabel ?? "pts",
    displayName: profile?.username ?? "A friend",
  };
}
