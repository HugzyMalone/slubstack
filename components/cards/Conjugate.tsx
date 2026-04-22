"use client";

import { useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Card } from "@/lib/content";
import type { Quality } from "@/lib/srs";
import { speak, cardLang } from "@/lib/speech";
import { germanFold } from "@/lib/german";
import { CardFooter } from "./CardShell";

type Person = "ich" | "du" | "er" | "wir" | "ihr" | "sie";
const PERSONS: Person[] = ["ich", "du", "er", "wir", "ihr", "sie"];
const PERSON_LABEL: Record<Person, string> = {
  ich: "ich (I)",
  du: "du (you)",
  er: "er/sie/es (he/she/it)",
  wir: "wir (we)",
  ihr: "ihr (you all)",
  sie: "sie (they)",
};

type Props = {
  card: Card;
  onResult: (r: { quality: Quality; correct: boolean; firstTry: boolean }) => void;
  onFeedback?: (correct: boolean) => void;
  umlautBar?: boolean;
};

function normDE(s: string) {
  return germanFold(s.trim().toLowerCase()).replace(/[^\p{L}\s]/gu, "").replace(/\s+/g, " ");
}

function pickPerson(conj: NonNullable<Card["conjugations"]>, cardId: string): Person {
  const available = PERSONS.filter((p) => conj[p]);
  if (available.length === 0) return "ich";
  // Deterministic per-card selection so it stays stable within a session
  let h = 0;
  for (let i = 0; i < cardId.length; i++) h = (h * 31 + cardId.charCodeAt(i)) >>> 0;
  return available[h % available.length];
}

const UMLAUT_KEYS = ["ä", "ö", "ü", "ß"] as const;

export function Conjugate({ card, onResult, onFeedback, umlautBar = true }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [firstTryFailed, setFirstTryFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const conj = card.conjugations;
  const person = useMemo(() => (conj ? pickPerson(conj, card.id) : "ich"), [conj, card.id]);
  const answer = conj ? conj[person] : "";
  const correct = normDE(value) === normDE(answer);

  function insertChar(ch: string) {
    const el = inputRef.current;
    if (!el) { setValue((v) => v + ch); return; }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    setValue(value.slice(0, start) + ch + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + ch.length;
      el.setSelectionRange(caret, caret);
    });
  }

  function submit() {
    if (submitted) {
      onResult({ quality: correct ? (firstTryFailed ? 2 : 4) : 0, correct, firstTry: !firstTryFailed });
      return;
    }
    if (correct) { setSubmitted(true); onFeedback?.(true); return; }
    if (firstTryFailed) { setSubmitted(true); onFeedback?.(false); }
    else { setFirstTryFailed(true); onFeedback?.(false); }
  }

  if (!conj || !answer) {
    return (
      <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-border bg-surface px-5 py-4 text-center text-sm text-muted">
        This card is missing conjugation data.
      </div>
    );
  }

  return (
    <>
      <div className="pt-2 text-center text-xs uppercase tracking-widest text-muted">
        Conjugate the verb
      </div>

      <div className="mx-auto mt-2 max-w-sm rounded-3xl border border-border bg-surface px-5 py-4 text-center relative">
        <div className="text-4xl font-semibold leading-tight text-fg">{card.hanzi}</div>
        <div className="mt-1 text-xs text-muted">{card.english}</div>
        <div className="mt-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-base font-semibold text-[var(--accent)]">
          {PERSON_LABEL[person]}
        </div>
        <button
          onClick={() => speak(`${person} ${answer}`, cardLang(card.id))}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted hover:text-fg hover:bg-border/50 transition-colors"
          aria-label="Listen"
        >
          <Volume2 size={15} />
        </button>
      </div>

      {!submitted && (
        <div className="mx-auto mt-4 max-w-sm space-y-2">
          {umlautBar && (
            <div className="flex gap-1.5 justify-center">
              {UMLAUT_KEYS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertChar(ch)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-base font-medium text-fg transition-colors hover:bg-border/40 active:scale-95"
                  aria-label={`Insert ${ch}`}
                >
                  {ch}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && value.trim().length > 0) submit(); }}
              placeholder={`${person} …`}
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
                Correct — {person} {answer}
              </span>
            ) : (
              <span className="font-medium text-rose-800 dark:text-rose-200">
                Answer: {person} {answer}
              </span>
            )
          }
          primary={{ label: "Continue", onClick: submit }}
        />
      )}
    </>
  );
}
