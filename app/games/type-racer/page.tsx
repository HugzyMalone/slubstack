"use client";

import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { typeRacerAdapter } from "@/lib/games/type-racer/adapter";

export default function TypeRacerPage() {
  return <MultiplayerShell adapter={typeRacerAdapter} />;
}
