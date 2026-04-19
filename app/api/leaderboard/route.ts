import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard, getLanguageLeaderboard } from "@/lib/supabase/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const VALID_LANGS = ["mandarin", "german", "spanish"] as const;
type Lang = typeof VALID_LANGS[number];

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ entries: [] });
  }
  const lang = request.nextUrl.searchParams.get("lang");
  if (lang && (VALID_LANGS as readonly string[]).includes(lang)) {
    const entries = await getLanguageLeaderboard(lang as Lang, 50);
    return NextResponse.json({ entries });
  }
  const entries = await getLeaderboard(50);
  return NextResponse.json({ entries });
}
