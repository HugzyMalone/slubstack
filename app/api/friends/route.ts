import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("friendships")
    .select("user_id, friend_id, status, created_at")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    .eq("status", "accepted");

  if (error) return NextResponse.json({ friends: [], error: error.message });

  const friendIds = (data ?? []).map((edge) =>
    edge.user_id === user.id ? edge.friend_id : edge.user_id
  );

  if (friendIds.length === 0) return NextResponse.json({ friends: [] });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", friendIds);

  const { data: stats } = await supabase
    .from("user_stats")
    .select("user_id, xp, streak")
    .in("user_id", friendIds);

  const statsById = new Map((stats ?? []).map((s) => [s.user_id, s]));

  const friends = (profiles ?? []).map((p) => ({
    id: p.id,
    username: p.username ?? "learner",
    avatar: p.avatar_url ?? null,
    xp: statsById.get(p.id)?.xp ?? 0,
    streak: statsById.get(p.id)?.streak ?? 0,
  }));

  return NextResponse.json({ friends });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = (await request.json()) as { username: string };
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username.trim())
    .maybeSingle();

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === user.id) {
    return NextResponse.json({ error: "Can't friend yourself" }, { status: 400 });
  }

  // If they already sent a request to me, accept it instead of creating a new one
  const { data: incoming } = await supabase
    .from("friendships")
    .select("user_id, friend_id, status")
    .eq("user_id", target.id)
    .eq("friend_id", user.id)
    .maybeSingle();

  if (incoming && incoming.status === "pending") {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("user_id", target.id)
      .eq("friend_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, accepted: true });
  }

  const { error } = await supabase
    .from("friendships")
    .upsert(
      { user_id: user.id, friend_id: target.id, status: "pending" },
      { onConflict: "user_id,friend_id", ignoreDuplicates: true },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, sent: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friendId = request.nextUrl.searchParams.get("id");
  if (!friendId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await supabase
    .from("friendships")
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

  return NextResponse.json({ ok: true });
}
