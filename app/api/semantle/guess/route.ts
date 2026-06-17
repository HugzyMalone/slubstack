import { NextResponse } from "next/server";
import { scoreGuess } from "@/lib/games/semantle/data";
import { getUtcTodayStr } from "@/lib/wordle-words";

export async function POST(req: Request) {
  const { guess } = (await req.json()) as { guess?: string };
  if (typeof guess !== "string" || !guess.trim()) {
    return NextResponse.json({ error: "Missing guess" }, { status: 400 });
  }
  const result = await scoreGuess(getUtcTodayStr(), guess);
  return NextResponse.json(result);
}
