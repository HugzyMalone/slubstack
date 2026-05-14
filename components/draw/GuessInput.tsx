"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";

type GuessInputProps = {
  disabled: boolean;
  onGuess: (text: string) => void;
};

export function GuessInput({ disabled, onGuess }: GuessInputProps): React.JSX.Element {
  const [value, setValue] = useState("");

  const submit = (): void => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onGuess(trimmed);
    setValue("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2"
    >
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={40}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        placeholder={disabled ? "You're drawing…" : "Type your guess…"}
        className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-fg placeholder:text-muted focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 disabled:opacity-50"
      />
      <button
        type="submit"
        aria-label="Send guess"
        disabled={disabled || value.trim().length === 0}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white transition-all active:scale-[0.96] disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  );
}
