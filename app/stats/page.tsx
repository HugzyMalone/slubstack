import { ProfileClient } from "./ProfileClient";
import { getLeaderboard } from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function StatsPage() {
  const configured = isSupabaseConfigured();
  const entries = configured ? await getLeaderboard(50) : [];
  return <ProfileClient entries={entries} configured={configured} />;
}
