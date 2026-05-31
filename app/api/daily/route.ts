import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDailyChallenge } from "@/lib/games/daily";

export async function GET() {
  const challenge = getDailyChallenge();

  let alreadyPlayed = false;
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("daily_results")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", challenge.date)
        .maybeSingle();
      alreadyPlayed = Boolean(data);
    }
  }

  return NextResponse.json({ ...challenge, alreadyPlayed });
}
