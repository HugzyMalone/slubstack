import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ entries: [] });
  }
  const entries = await getLeaderboard(50);
  return NextResponse.json({ entries });
}
