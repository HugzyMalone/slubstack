"use client";

import { useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { speak, cardLang } from "@/lib/speech";
import { germanFold } from "@/lib/german";
import { meaningOf, useNativeLanguage } from "@/lib/native";
import { CardFooter } from "./CardShell";

type Props = {
  card: Card;
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
};

const PRONOUNS = ["ich", "du", "er", "wir", "ihr", "sie"] as const;
type Pronoun = (typeof PRONOUNS)[number];

const PRONOUN_LABEL: Record<Pronoun, string> = {
  ich: "ich (I)",
  du: "du (you)",
  er: "er/sie/es (he/she/it)",
  wir: "wir (we)",
  ihr: "ihr (you all)",
  sie: "sie (they)",
};

const UMLAUTS = ["ä", "ö", "ü", "ß"];

function normalise(s: string) {
  return germanFold(s.trim()).replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ");
}

export function Conjugate({ card, onResult, onFeedback }: Props) {
  const native = useNativeLanguage();
  const conj = card.conjugations;

  const pronoun: Pronoun = useMemo(() => {
    if (!conj) return "ich";
    const keys = PRONOUNS.filter((p) => conj[p]);
    return keys[Math.floor(Math.random() * keys.length)] ?? "ich";
  }, [conj]);

  const expected = conj?.[pronoun] ?? "";
  const infinitive = card.hanzi;

  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [firstTryFailed, setFirstTryFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const correct = normalise(value) === normalise(expected);

  function insertChar(ch: string) {
    const el = inputRef.current;
    if (!el) { setValue((v) => v + ch); return; }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + ch + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + ch.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function submit() {
    if (submitted) {
      onResult({ quality: correct ? (firstTryFailed ? 2 : 4) : 0, correct, firstTry: !firstTryFailed });
      return;
    }
    if (correct) {
      setSubmitted(true);
      onFeedback?.(true);
      return;
    }
    if (firstTryFailed) {
      setSubmitted(true);
      onFeedback?.(false);
    } else {
      setFirstTryFailed(true);
      onFeedback?.(false);
    }
  }

  return (
    <>
      <div className="pt-2 text-center text-xs uppercase tracking-widest text-muted">
        Conjugate the verb
      </div>

      <div className="mx-auto mt-2 max-w-sm rounded-3xl border border-border bg-surface px-5 py-4 text-center relative">
        <div className="text-xs uppercase tracking-widest text-muted">infinitive</div>
        <div className="hanzi text-3xl w-full break-words leading-tight text-fg">{infinitive}</div>
        <div className="mt-1 text-sm text-muted">{meaningOf(card, native)}</div>
        <div className="mt-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 py-2 text-base font-semibold text-fg">
          {PRONOUN_LABEL[pronoun]} ___
        </div>
        <button
          onClick={() => speak(infinitive, cardLang(card.id))}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:text-fg hover:bg-border/50 transition-colors"
          aria-label="Listen"
        >
          <Volume2 size={15} />
        </button>
      </div>

      {!submitted && (
        <div className="mx-auto mt-4 max-w-sm space-y-2">
          <div className="flex gap-1">
            {UMLAUTS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => insertChar(ch)}
                className="flex-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm font-medium hover:bg-border/40"
              >
                {ch}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && value.trim().length > 0) submit(); }}
              placeholder={`${pronoun} …`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-[var(--accent)]"
            />
            <button
              onClick={submit}
              disabled={value.trim().length === 0}
              className="shrink-0 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-150 active:scale-[0.97] disabled:pointer-events-none"
              style={{
                background: value.trim().length === 0 ? "color-mix(in srgb, var(--fg) 10%, transparent)" : "var(--accent)",
                color: value.trim().length === 0 ? "var(--muted)" : "var(--accent-fg)",
              }}
            >
              Check
            </button>
          </div>
          {firstTryFailed && (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              Not quite — try again.
            </div>
          )}
        </div>
      )}

      {submitted && (
        <CardFooter
          variant={correct ? "correct" : "wrong"}
          feedback={
            correct ? (
              <span className="font-medium text-emerald-800 dark:text-emerald-200">
                Correct — {pronoun} {expected}
              </span>
            ) : (
              <span className="font-medium text-rose-800 dark:text-rose-200">
                Answer: {pronoun} {expected}
              </span>
            )
          }
          primary={{ label: "Continue", onClick: submit }}
        />
      )}
    </>
  );
}
