"use client";

import { useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { StrokeDelta, StrokeEnd } from "@/lib/multiplayer/draw-types";

type UseStrokeBroadcastArgs = {
  channel: RealtimeChannel | null;
  slot: number;
  enabled: boolean;
};

type UseStrokeBroadcastReturn = {
  sendStrokeDelta: (seg: StrokeDelta) => void;
  sendStrokeEnd: (end: StrokeEnd) => void;
};

export function useStrokeBroadcast({ channel, enabled }: UseStrokeBroadcastArgs): UseStrokeBroadcastReturn {
  const sendStrokeDelta = useCallback(
    (seg: StrokeDelta) => {
      if (!enabled || !channel) return;
      channel.send({ type: "broadcast", event: "stroke_delta", payload: seg });
    },
    [channel, enabled],
  );

  const sendStrokeEnd = useCallback(
    (end: StrokeEnd) => {
      if (!enabled || !channel) return;
      channel.send({ type: "broadcast", event: "stroke_end", payload: end });
    },
    [channel, enabled],
  );

  return { sendStrokeDelta, sendStrokeEnd };
}
