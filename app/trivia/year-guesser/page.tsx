"use client";

import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { yearGuesserAdapter } from "@/lib/games/year-guesser/adapter";

export default function YearGuesserPage() {
  return <MultiplayerShell adapter={yearGuesserAdapter} />;
}
