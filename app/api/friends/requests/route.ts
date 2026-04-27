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
    .eq("friend_id", user.id)
    .eq("status", "pending");

  if (error) return NextResponse.json({ requests: [], error: error.message });

  const senderIds = (data ?? []).map((r) => r.user_id);
  if (senderIds.length === 0) return NextResponse.json({ requests: [] });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", senderIds);

  return NextResponse.json({
    requests: (profiles ?? []).map((p) => ({
      id: p.id,
      username: p.username ?? "learner",
      avatar: p.avatar_url ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { senderId } = (await request.json()) as { senderId: string };
  if (!senderId) return NextResponse.json({ error: "Missing senderId" }, { status: 400 });

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("user_id", senderId)
    .eq("friend_id", user.id)
    .eq("status", "pending");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = request.nextUrl.searchParams.get("senderId");
  if (!senderId) return NextResponse.json({ error: "Missing senderId" }, { status: 400 });

  await supabase
    .from("friendships")
    .delete()
    .eq("user_id", senderId)
    .eq("friend_id", user.id)
    .eq("status", "pending");

  return NextResponse.json({ ok: true });
}
