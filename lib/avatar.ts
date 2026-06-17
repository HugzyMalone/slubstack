// Avatars are rendered as <img src> to every other user, so any avatar URL must
// be allow-listed to our own Supabase storage host. This blocks arbitrary
// external image URLs (tracking pixels / SSRF-via-image) reaching other players,
// whether set via /api/profile or smuggled in through Supabase auth metadata.
export function isAllowedAvatarUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;
  return url.host === new URL(supabaseUrl).host;
}
