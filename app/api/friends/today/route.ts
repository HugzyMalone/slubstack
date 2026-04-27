import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Game = "wordle" | "connections" | "math-blitz";

const TABLES: Record<Game, { table: string; dateCol: string; sortBy: string; ascending: boolean }> = {
  wordle: { table: "wordle_scores", dateCol: "date", sortBy: "attempts", ascending: true },
  connections: { table: "connections_scores", dateCol: "date", sortBy: "mistakes", ascending: true },
  "math-blitz": { table: "math_blitz_scores", dateCol: "created_at", sortBy: "score", ascending: false },
};

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const game = request.nextUrl.searchParams.get("game") as Game | null;
  const date = request.nextUrl.searchParams.get("date");
  if (!game || !TABLES[game]) return NextResponse.json({ error: "Invalid game" }, { status: 400 });

  const { data: edges } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq("status", "accepted");

  const friendIds = (edges ?? []).map((e) => (e.user_id === user.id ? e.friend_id : e.user_id));
  const userPool = [user.id, ...friendIds];

  const cfg = TABLES[game];
  let q = supabase.from(cfg.table).select("*").in("user_id", userPool);
  if (date && cfg.dateCol === "date") q = q.eq("date", date);
  q = q.order(cfg.sortBy, { ascending: cfg.ascending }).limit(50);

  const { data: rows, error } = await q;
  if (error) return NextResponse.json({ scores: [], error: error.message });

  const ids = [...new Set((rows ?? []).map((r) => (r as { user_id: string }).user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", ids);
  const profById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return NextResponse.json({
    scores: (rows ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      const id = row.user_id as string;
      const p = profById.get(id);
      return {
        userId: id,
        isMe: id === user.id,
        username: p?.username ?? "learner",
        avatar: p?.avatar_url ?? null,
        ...row,
      };
    }),
  });
}
