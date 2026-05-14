"use client";

import { TurnBasedShell } from "@/components/multiplayer/TurnBasedShell";
import { drawMyThingAdapter } from "@/lib/multiplayer/draw-types";

export function DrawClient() {
  return <TurnBasedShell adapter={drawMyThingAdapter} />;
}
