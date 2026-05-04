"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import type { Card, Language } from "@/lib/content";
import { lookupGloss } from "@/lib/glossary";
import { hintTracker } from "@/lib/hintTracker";

type Props = {
  text: string;
  card: Card | null;
  lang: Language;
  className?: string;
};

type Token = { kind: "word"; value: string } | { kind: "delim"; value: string };

const CJK = /[㐀-鿿豈-﫿]/;

function tokenise(text: string, lang: Language): Token[] {
  if (lang === "mandarin") {
    return Array.from(text).map<Token>((ch) =>
      CJK.test(ch) ? { kind: "word", value: ch } : { kind: "delim", value: ch },
    );
  }
  const out: Token[] = [];
  const re = /([\p{L}\p{M}'’\-]+)|([^\p{L}\p{M}'’\-]+)/gu;
  for (const match of text.matchAll(re)) {
    if (match[1]) out.push({ kind: "word", value: match[1] });
    else if (match[2]) out.push({ kind: "delim", value: match[2] });
  }
  return out;
}

export function Tappable({ text, card, lang, className }: Props) {
  const tokens = useMemo(() => tokenise(text, lang), [text, lang]);
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);

  function handleTap(word: string, e: React.MouseEvent<HTMLButtonElement>) {
    setAnchor(e.currentTarget.getBoundingClientRect());
    setOpenWord(word);
    hintTracker.getState().markUsed();
  }

  function close() {
    setOpenWord(null);
    setAnchor(null);
  }

  return (
    <span ref={wrapRef} className={className}>
      {tokens.map((t, i) =>
        t.kind === "delim" ? (
          <span key={i}>{t.value}</span>
        ) : (
          <button
            key={i}
            type="button"
            onClick={(e) => handleTap(t.value, e)}
            className="cursor-pointer border-b border-dotted border-fg/30 hover:border-fg/60 transition-colors"
            style={{ font: "inherit", color: "inherit", padding: 0, background: "transparent", lineHeight: "inherit" }}
          >
            {t.value}
          </button>
        ),
      )}
      {openWord && anchor && (
        <HintPopover
          word={openWord}
          card={card}
          lang={lang}
          anchor={anchor}
          onClose={close}
        />
      )}
    </span>
  );
}

type PopoverProps = {
  word: string;
  card: Card | null;
  lang: Language;
  anchor: DOMRect;
  onClose: () => void;
};

function HintPopover({ word, card, lang, anchor, onClose }: PopoverProps) {
  const gloss = useMemo(() => lookupGloss(word, card, lang), [word, card, lang]);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; flipped: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!popRef.current) return;
    const popRect = popRef.current.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const wantTop = anchor.top - popRect.height - 10;
    const flipped = wantTop < margin;
    const top = flipped ? anchor.bottom + 10 : wantTop;
    let left = anchor.left + anchor.width / 2 - popRect.width / 2;
    left = Math.max(margin, Math.min(vw - popRect.width - margin, left));
    const clampedTop = Math.max(margin, Math.min(vh - popRect.height - margin, top));
    setPos({ top: clampedTop, left, flipped });
  }, [anchor, mounted, gloss]);

  useEffect(() => {
    function onDoc(e: Event) {
      if (popRef.current?.contains(e.target as Node)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("touchstart", onDoc);
    }, 0);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={popRef}
        data-testid="hint-popover"
        initial={{ opacity: 0, scale: 0.9, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 4 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="fixed z-[60] max-w-[260px] rounded-2xl border border-border bg-surface px-3 py-2 shadow-panel-hi"
        style={{
          top: pos?.top ?? anchor.top - 60,
          left: pos?.left ?? anchor.left,
          visibility: pos ? "visible" : "hidden",
        }}
      >
        {gloss ? (
          <>
            <div className="font-display text-sm font-extrabold text-fg">{gloss.word}</div>
            {gloss.pinyin && (
              <div className="text-[12px] text-muted">{gloss.pinyin}</div>
            )}
            <div className="mt-0.5 text-[13px] text-fg/80">{gloss.meaning}</div>
          </>
        ) : (
          <div className="text-[13px] text-muted">No hint available</div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
