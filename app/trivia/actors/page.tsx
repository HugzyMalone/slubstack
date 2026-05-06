"use client";

import { MultiplayerShell } from "@/components/multiplayer/MultiplayerShell";
import { actorBlitzAdapter } from "@/lib/games/actor-blitz/adapter";

export default function ActorBlitzPage() {
  return <MultiplayerShell adapter={actorBlitzAdapter} />;
}
