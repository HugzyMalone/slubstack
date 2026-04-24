"use client";

import { useMemo, useState } from "react";
import { getLanguageContent } from "@/lib/content";
import { toneOf, TONE_COLORS } from "@/lib/mandarin";

function TonePinyin({ pinyin }: { pinyin: string }) {
  const parts = pinyin.trim().split(/\s+/);
  return (
    <span className="font-mono text-[13px]">
      {parts.map((p, i) => (
        <span key={i} style={{ color: TONE_COLORS[toneOf(p)] }}>
          {p}
          {i < parts.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

const LEGEND: Array<{ label: string; tone: 1 | 2 | 3 | 4 | 5 }> = [
  { label: "1st", tone: 1 },
  { label: "2nd", tone: 2 },
  { label: "3rd", tone: 3 },
  { label: "4th", tone: 4 },
  { label: "Neutral", tone: 5 },
];

export default function MandarinVocabPage() {
  const { units, getCard } = useMemo(() => getLanguageContent("mandarin"), []);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return units
      .map((u) => {
        const seen = new Set<string>();
        const cards = u.cardIds
          .map((id) => {
            try { return getCard(id); } catch { return null; }
          })
          .filter((c): c is NonNullable<ReturnType<typeof getCard>> => !!c)
          .filter((c) => {
            const baseId = c.id.startsWith("p-") ? c.id.slice(2) : c.id;
            if (seen.has(baseId)) return false;
            seen.add(baseId);
            return true;
          })
          .filter((c) => {
            if (!q) return true;
            return (
              c.hanzi.toLowerCase().includes(q) ||
              c.pinyin.toLowerCase().includes(q) ||
              c.english.toLowerCase().includes(q)
            );
          });
        return { unit: u, cards };
      })
      .filter((g) => g.cards.length > 0);
  }, [units, getCard, query]);

  const total = groups.reduce((n, g) => n + g.cards.length, 0);

  return (
    <div className="w-full px-4 pb-24 pt-6 lg:max-w-[1200px] lg:mx-auto lg:px-8 lg:py-8">
      <div className="mb-4 lg:mb-6 lg:max-w-2xl">
        <p className="text-[11px] font-semibold tracking-widest text-muted uppercase mb-1">Mandarin vocab</p>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {total} card{total === 1 ? "" : "s"} across {groups.length} unit{groups.length === 1 ? "" : "s"}
        </h1>
        <p className="mt-2 text-sm lg:text-base text-muted">Tone-coloured pinyin, measure words, and priority flags. Search any field.</p>
      </div>

      <div
        className="sticky z-10 -mx-4 px-4 pb-3 pt-2 backdrop-blur lg:top-14 top-0 lg:-mx-8 lg:px-8"
        style={{ background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hanzi, pinyin, or English…"
          className="w-full rounded-xl px-4 py-3 text-[15px] outline-none transition-colors"
          style={{
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            color: "var(--fg)",
          }}
        />
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
          {LEGEND.map(({ label, tone }) => (
            <span key={tone} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: TONE_COLORS[tone] }}
              />
              {label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" }}>Priority</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: "color-mix(in srgb, var(--fg) 10%, transparent)", color: "var(--muted)" }}>Recog</span>
          </span>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No cards match “{query}”.</p>
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map(({ unit, cards }) => (
            <section key={unit.id}>
              <h2
                className="mb-2 pb-1 text-[11px] font-bold uppercase tracking-wider"
                style={{
                  color: "var(--accent)",
                  borderBottom: "1.5px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                }}
              >
                {unit.emoji} {unit.title} · {cards.length}
              </h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cards.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl px-3 py-2.5"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                    title={c.note ?? ""}
                  >
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-[22px] leading-tight"
                        style={{ fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif" }}
                      >
                        {c.hanzi}
                      </span>
                      <TonePinyin pinyin={c.pinyin} />
                    </div>
                    <div className="mt-0.5 text-[13px] text-muted">{c.english}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.measureWord && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{
                            background: "color-mix(in srgb, var(--game) 18%, transparent)",
                            color: "var(--game)",
                          }}
                        >
                          {c.measureWord}
                        </span>
                      )}
                      {c.priority && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{
                            background: "color-mix(in srgb, var(--accent) 18%, transparent)",
                            color: "var(--accent)",
                          }}
                        >
                          priority
                        </span>
                      )}
                      {c.recognitionOnly && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{
                            background: "color-mix(in srgb, var(--fg) 10%, transparent)",
                            color: "var(--muted)",
                          }}
                        >
                          recog
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
