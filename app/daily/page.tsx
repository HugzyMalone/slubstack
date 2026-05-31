import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDailyChallenge, getDailyAdapter } from "@/lib/games/daily";
import { DailyRunner } from "@/components/games/DailyRunner";

export default async function DailyPage() {
  const { date, gameKind, level, seed } = getDailyChallenge();
  const adapter = getDailyAdapter(gameKind);

  let alreadyPlayed = false;
  let streak = 0;

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: result } = await supabase
        .from("daily_results")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", date)
        .maybeSingle();
      alreadyPlayed = !!result;
      const { data: streakRow } = await supabase
        .from("daily_streaks")
        .select("current")
        .eq("user_id", user.id)
        .maybeSingle();
      streak = streakRow?.current ?? 0;
    }
  }

  if (!adapter) {
    return <div className="mx-auto max-w-md px-4 pt-12 text-center text-sm text-muted">Daily challenge unavailable.</div>;
  }

  return (
    <DailyRunner
      gameKind={gameKind}
      level={level}
      seed={seed}
      date={date}
      alreadyPlayed={alreadyPlayed}
      initialStreak={streak}
    />
  );
}
