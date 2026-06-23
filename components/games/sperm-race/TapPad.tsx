"use client";

import React, { useCallback } from "react";
import type { Button } from "@/lib/games/sperm-race/engine";

type TapPadProps = {
  onTap: (button: Button) => void;
  nextButton: Button | null;
  disabled?: boolean;
};

function PadButton({
  button,
  active,
  onTap,
  disabled,
}: {
  button: Button;
  active: boolean;
  onTap: (button: Button) => void;
  disabled: boolean;
}): React.JSX.Element {
  // pointerdown (not click) fires immediately with no 300ms synthetic-click
  // delay and lets a rapid A/B/A/B rhythm register every tap.
  const handle = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (!disabled) onTap(button);
    },
    [button, onTap, disabled],
  );

  return (
    <button
      onPointerDown={handle}
      disabled={disabled}
      aria-label={`Tap ${button}`}
      className="flex flex-1 select-none touch-none items-center justify-center rounded-3xl text-7xl font-black text-white transition-transform active:scale-[0.97] disabled:opacity-40"
      style={{
        background: active
          ? "var(--accent)"
          : "color-mix(in srgb, var(--accent) 55%, var(--surface))",
        WebkitTapHighlightColor: "transparent",
        minHeight: "11rem",
      }}
    >
      {button}
    </button>
  );
}

export function TapPad({ onTap, nextButton, disabled = false }: TapPadProps): React.JSX.Element {
  return (
    <div className="flex w-full gap-3 px-3 pb-3" style={{ touchAction: "none" }}>
      <PadButton button="A" active={nextButton === "A"} onTap={onTap} disabled={disabled} />
      <PadButton button="B" active={nextButton === "B"} onTap={onTap} disabled={disabled} />
    </div>
  );
}
