import { getSupabaseServerClient } from "@/lib/supabase/server";

export type LeaderboardEntry = {
  userId: string;
  username: string;
  xp: number;
  streak: number;
  wordsLearned: number;
  unitsDone: number;
  updatedAt: string;
};

type ProfileRow = {
  username: string;
  avatar_url: string | null;
};

type LeaderboardRow = {
  user_id: string;
  xp: number | null;
  streak: number | null;
  words_learned: number | null;
  units_done: number | null;
  updated_at: string | null;
  profiles: ProfileRow | ProfileRow[] | null;
};

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_stats")
    .select("user_id, xp, streak, words_learned, units_done, updated_at, profiles!inner(username, avatar_url)")
    .order("xp", { ascending: false })
    .order("streak", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as LeaderboardRow[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      userId: row.user_id,
      username: profile?.username ?? "Learner",
      xp: row.xp ?? 0,
      streak: row.streak ?? 0,
      wordsLearned: row.words_learned ?? 0,
      unitsDone: row.units_done ?? 0,
      updatedAt: row.updated_at ?? "",
    };
  });
}
