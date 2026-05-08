"use client";

import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { batmanShakespeareAdapter } from "@/lib/games/batman-shakespeare/adapter";

export default function BatmanOrShakespearePage() {
  return <MultiplayerShell adapter={batmanShakespeareAdapter} />;
}
