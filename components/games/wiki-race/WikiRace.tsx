"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Flag, MousePointerClick, Timer, Shuffle, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { getDailyPair, getRandomPair, type WikiPair } from "@/lib/games/wiki-race/pairs";
import { getTodayStr, getDayIndex } from "@/lib/wordle-words";
import { buildShareCard } from "@/lib/share";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { brainTrainingStore } from "@/lib/store";
import { awardQuestProgress } from "@/lib/questsStore";
import { pushLeagueXp } from "@/lib/leagues";

const STORAGE_KEY = "slubstack_wiki_race";
const XP_WIN = 70;
const REST = "https://en.wikipedia.org/api/rest_v1/page";

type Mode = "daily" | "random";

type Best = { mode: Mode; key: string; clicks: number; seconds: number };

function titleFromHref(href: string): string | null {
  const m = href.match(/\/wiki\/([^#?]+)/) ?? href.match(/^\.\/([^#?]+)/);
  if (!m) return null;
  const raw = decodeURIComponent(m[1]);
  if (/^(Special|File|Help|Category|Template|Portal|Wikipedia|Talk|User|Module|Draft):/i.test(raw)) return null;
  if (raw.includes(":")) return null;
  return raw.replace(/_/g, " ");
}

function normalise(t: string): string {
  return t.replace(/_/g, " ").trim().toLowerCase();
}

function loadBest(): Best[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Best[]) : [];
  } catch {
    return [];
  }
}

function saveBest(all: Best[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export function WikiRace() {
  const [mode, setMode] = useState<Mode>("daily");
  const [pair, setPair] = useState<WikiPair>(() => getDailyPair());
  const [current, setCurrent] = useState<string>(pair.start);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState<string[]>([pair.start]);
  const [clicks, setClicks] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [won, setWon] = useState(false);
  const [best, setBest] = useState<Best | null>(null);
  const [isPb, setIsPb] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const awardedRef = useRef(false);

  const todayStr = getTodayStr();
  const dayNumber = getDayIndex(todayStr) + 1;
  const bestKey = mode === "daily" ? todayStr : `${pair.start}->${pair.target}`;

  const fetchArticle = useCallback(async (title: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${REST}/html/${encodeURIComponent(title.replace(/ /g, "_"))}`);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      doc.querySelectorAll("script, style, link, meta").forEach((el) => el.remove());
      const body = doc.querySelector("body");
      setHtml(body ? body.innerHTML : text);
    } catch {
      setHtml("<p>Could not load this article. Try again.</p>");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticle(pair.start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.start]);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (startedAt === null || won) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt, won]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [current]);

  const startGame = useCallback(
    (next: WikiPair, nextMode: Mode) => {
      setMode(nextMode);
      setPair(next);
      setCurrent(next.start);
      setPath([next.start]);
      setClicks(0);
      setElapsed(0);
      setStartedAt(null);
      setWon(false);
      setIsPb(false);
      awardedRef.current = false;
      const k = nextMode === "daily" ? todayStr : `${next.start}->${next.target}`;
      setBest(loadBest().find((b) => b.mode === nextMode && b.key === k) ?? null);
    },
    [todayStr],
  );

  useEffect(() => {
    setBest(loadBest().find((b) => b.mode === mode && b.key === bestKey) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigate = useCallback(
    (title: string) => {
      if (won) return;
      if (startedAt === null) setStartedAt(Date.now());
      setCurrent(title);
      setPath((p) => [...p, title]);
      setClicks((c) => c + 1);
      fetchArticle(title);
      if (normalise(title) === normalise(pair.target)) {
        const secs = startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000);
        finish(clicks + 1, secs);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [won, startedAt, pair.target, clicks, fetchArticle],
  );

  function finish(finalClicks: number, secs: number) {
    setWon(true);
    setElapsed(secs);
    if (awardedRef.current) return;
    awardedRef.current = true;

    const all = loadBest();
    const existingIdx = all.findIndex((b) => b.mode === mode && b.key === bestKey);
    const existing = existingIdx >= 0 ? all[existingIdx] : null;
    const better = !existing || finalClicks < existing.clicks || (finalClicks === existing.clicks && secs < existing.seconds);
    if (better) {
      const entry: Best = { mode, key: bestKey, clicks: finalClicks, seconds: secs };
      if (existingIdx >= 0) all[existingIdx] = entry;
      else all.push(entry);
      saveBest(all);
      setBest(entry);
      setIsPb(true);
    }

    brainTrainingStore.getState().addXp(XP_WIN);
    awardQuestProgress("xp", XP_WIN);
    awardQuestProgress("correct", 1);
    pushLeagueXp(XP_WIN);

    if (mode === "daily") {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          supabase
            .from("wiki_race_scores")
            .upsert({ user_id: user.id, date: todayStr, clicks: finalClicks, seconds: secs }, { onConflict: "user_id,date" })
            .then(() => {});
        });
      }
    }
  }

  function onContentClick(e: React.MouseEvent<HTMLDivElement>) {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    e.preventDefault();
    const href = anchor.getAttribute("href") ?? "";
    const title = titleFromHref(href);
    if (!title) {
      toast.message("Only blue article links count");
      return;
    }
    navigate(title);
  }

  function handleShare() {
    const card = buildShareCard({
      title: `Slubstack Wikirace${mode === "daily" ? ` #${dayNumber}` : ""}`,
      footerTag: `${pair.start} → ${pair.target} · ${clicks} clicks · ${fmtTime(elapsed)}`,
    });
    navigator.clipboard?.writeText(card).then(
      () => toast.success("Result copied"),
      () => toast.error("Could not copy"),
    );
  }

  if (!hydrated) return null;

  return (
    <div className="flex h-[100svh] flex-col bg-bg">
      <header className="shrink-0 border-b border-border px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-3 lg:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Compass size={20} className="text-[var(--game)]" />
              <span className="text-sm font-bold tracking-tight">Wikirace</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-surface p-0.5 text-[11px] font-semibold">
              <button
                onClick={() => startGame(getDailyPair(), "daily")}
                className={`rounded-full px-3 py-1 transition-colors ${mode === "daily" ? "bg-[var(--game)] text-white" : "text-muted"}`}
              >
                Daily
              </button>
              <button
                onClick={() => startGame(getRandomPair(), "random")}
                className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${mode === "random" ? "bg-[var(--game)] text-white" : "text-muted"}`}
              >
                <Shuffle size={12} /> Random
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[13px]">
            <span className="truncate rounded-lg bg-surface px-2.5 py-1 font-semibold">{pair.start}</span>
            <span className="text-muted">→</span>
            <span className="flex items-center gap-1 truncate rounded-lg px-2.5 py-1 font-semibold text-white" style={{ background: "var(--game)" }}>
              <Flag size={12} /> {pair.target}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[12px] text-muted">
            <span className="flex items-center gap-1"><MousePointerClick size={13} /> {clicks} clicks</span>
            <span className="flex items-center gap-1"><Timer size={13} /> {fmtTime(elapsed)}</span>
            {best && <span className="flex items-center gap-1"><Trophy size={13} /> best {best.clicks}</span>}
          </div>

          <div className="break-words text-[11px] text-muted">
            {path.map((t, i) => (
              <span key={i}>
                {i > 0 && " › "}
                {t}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        onClick={onContentClick}
        className="wiki-race-body flex-1 overflow-y-auto px-4 py-4 lg:px-6"
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-3 text-2xl font-bold">{current}</h1>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : (
            <div className="wiki-race-html" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full max-w-sm rounded-3xl bg-surface p-6 text-center"
            >
              <div className="mb-1 text-4xl">🏁</div>
              <div className="text-lg font-bold">You reached {pair.target}!</div>
              {isPb && <div className="mt-1 text-sm font-semibold text-[var(--game)]">New best 🏆</div>}
              <div className="mt-3 flex justify-center gap-6 text-sm">
                <div>
                  <div className="text-2xl font-bold">{clicks}</div>
                  <div className="text-[11px] text-muted">clicks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{fmtTime(elapsed)}</div>
                  <div className="text-[11px] text-muted">time</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-muted">+{XP_WIN} XP</div>
              <div className="mt-2 max-h-32 overflow-y-auto break-words text-[11px] text-muted">{path.join(" › ")}</div>

              <button
                onClick={handleShare}
                className="mt-4 w-full rounded-2xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: "var(--game)" }}
              >
                Share result
              </button>
              <button
                onClick={() => startGame(getRandomPair(), "random")}
                className="mt-2 w-full rounded-2xl border border-border py-3 text-sm font-semibold text-muted transition-all active:scale-[0.98]"
              >
                New random race
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
