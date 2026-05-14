"use client";

import type React from "react";

type ColorPaletteProps = {
  selected: string;
  onSelect: (color: string) => void;
};

export const DRAW_COLORS: readonly string[] = [
  "#0f0e17",
  "#7c5cff",
  "#e879a3",
  "#5cc8d6",
  "#f59e0b",
  "#10b981",
] as const;

export function ColorPalette({ selected, onSelect }: ColorPaletteProps): React.JSX.Element {
  return (
    <div className="flex flex-row items-center gap-2">
      {DRAW_COLORS.map((c) => {
        const isSelected = c.toLowerCase() === selected.toLowerCase();
        return (
          <button
            key={c}
            type="button"
            aria-label={`Colour ${c}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(c)}
            className={`h-10 w-10 rounded-full border transition-transform ${isSelected ? "scale-110 border-fg ring-2 ring-fg/40" : "border-border hover:scale-105"}`}
            style={{ backgroundColor: c }}
          />
        );
      })}
    </div>
  );
}
