"use client";

import { RoundShell } from "@/components/multiplayer/RoundShell";
import { geoCloneAdapter } from "@/lib/games/geo-clone/adapter";
import { PlayBoard } from "@/components/games/geo-clone/PlayBoard";
import { RevealBoard } from "@/components/games/geo-clone/RevealBoard";

export default function GeoClonePage() {
  return (
    <RoundShell
      adapter={geoCloneAdapter}
      level={1}
      PlayBoard={PlayBoard}
      RevealBoard={RevealBoard}
    />
  );
}
