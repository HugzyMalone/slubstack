"use client";

import type React from "react";
import { Undo2, Eraser } from "lucide-react";

type BrushControlsProps = {
  size: number;
  onSize: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
};

export const BRUSH_SIZES: readonly number[] = [4, 12] as const;

export function BrushControls({ size, onSize, onUndo, onClear }: BrushControlsProps): React.JSX.Element {
  return (
    <div className="flex flex-row items-center gap-2 pt-2">
      {BRUSH_SIZES.map((s) => (
        <button
          key={s}
          type="button"
          aria-label={`Brush size ${s}`}
          aria-pressed={s === size}
          onClick={() => onSize(s)}
          className={`flex h-10 w-10 items-center justify-center rounded-full border bg-surface transition ${s === size ? "border-accent ring-2 ring-accent/40" : "border-border hover:border-border-hi"}`}
        >
          <span className="block rounded-full bg-fg" style={{ width: `${s}px`, height: `${s}px` }} />
        </button>
      ))}
      <button
        type="button"
        aria-label="Undo last stroke"
        onClick={onUndo}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-fg hover:border-border-hi"
      >
        <Undo2 className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Clear canvas"
        onClick={onClear}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-fg hover:border-border-hi"
      >
        <Eraser className="h-5 w-5" />
      </button>
    </div>
  );
}
