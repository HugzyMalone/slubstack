import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const serverClient = await getSupabaseServerClient();
  if (!serverClient) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Admin client not configured" }, { status: 503 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const path = `${user.id}/avatar.jpg`;

  const { data, error } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { upsert: true, contentType: "image/jpeg" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: { publicUrl } } = admin.storage.from("avatars").getPublicUrl(data.path);

  // Update profile with new avatar URL
  await admin.from("profiles").upsert(
    { id: user.id, avatar_url: publicUrl },
    { onConflict: "id" },
  );

  return NextResponse.json({ url: publicUrl });
}
