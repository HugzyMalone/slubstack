import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // launch default = Cloudflare quick tunnel to the WSL-hosted ws server.
  // Override with BLOCKYARD_WS_URL once a stable tunnel/host exists; local dev
  // sets it to ws://localhost:8080 in .env.local.
  const wsUrl =
    process.env.BLOCKYARD_WS_URL ?? "wss://approx-thomas-iii-testing.trycloudflare.com";

  return NextResponse.json({ supabaseUrl, supabaseAnonKey, wsUrl });
}
