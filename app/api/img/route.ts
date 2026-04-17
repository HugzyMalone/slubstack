import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url || !url.startsWith("https://upload.wikimedia.org/")) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Slubstack/1.0)" },
    next: { revalidate: 604800 }, // cache 1 week on the server
  });

  if (!res.ok) return new NextResponse("Not found", { status: 404 });

  const body = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=2592000",
    },
  });
}
