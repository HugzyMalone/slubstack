import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

function fallbackUsername(userId: string) {
  return `learner-${userId.slice(0, 8)}`;
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("username, email, avatar_url, status, native_language")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    profile: data
      ? {
          username: data.username,
          email: data.email,
          avatar: data.avatar_url,
          status: data.status ?? null,
          nativeLanguage: data.native_language === "de" ? "de" : "en",
        }
      : {
          username: fallbackUsername(user.id),
          email: user.email ?? null,
          avatar: null,
          status: null,
          nativeLanguage: "en",
        },
  });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    username?: string;
    avatar?: string;
    status?: string;
    nativeLanguage?: string;
  };
  const username = body.username?.trim();
  const avatar = body.avatar?.trim() ?? null;
  const status = (body.status ?? "").trim().slice(0, 100) || null;
  const nativeLanguage = body.nativeLanguage === "de" ? "de" : "en";

  if (!username || !USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3–20 characters: letters, numbers, dashes, or underscores." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
      email: user.email ?? null,
      avatar_url: avatar,
      status,
      native_language: nativeLanguage,
    },
    { onConflict: "id" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
