import { NextResponse } from "next/server";
import { scoreGuess } from "@/lib/games/semantle/data";

export async function POST(req: Request) {
  const { date, guess } = (await req.json()) as { date?: string; guess?: string };
  if (!date || typeof guess !== "string" || !guess.trim()) {
    return NextResponse.json({ error: "Missing date or guess" }, { status: 400 });
  }
  const result = await scoreGuess(date, guess);
  return NextResponse.json(result);
}
