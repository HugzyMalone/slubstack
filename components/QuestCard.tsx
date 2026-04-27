"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, CheckCircle2 } from "lucide-react";
import { questsStore, useQuestsStore } from "@/lib/questsStore";
import { dailyQuestsFor, QUEST_KIND_LABEL, type QuestTemplate } from "@/lib/quests";
import { useHydrated } from "@/lib/hooks";
import { springy } from "@/lib/motion";

export function QuestCard() {
  const hydrated = useHydrated();
  const dateKey = useQuestsStore((s) => s.dateKey);
  const progress = useQuestsStore((s) => s.progress);
  const completed = useQuestsStore((s) => s.completed);
  const [quests, setQuests] = useState<QuestTemplate[]>([]);

  useEffect(() => {
    questsStore.getState().rollIfStale();
    setQuests(dailyQuestsFor(questsStore.getState().dateKey));
  }, [dateKey]);

  if (!hydrated || quests.length === 0) return null;

  const doneCount = quests.filter((q) => completed[q.id]).length;

  return (
    <section
      className="rounded-[var(--radius-chunk)] p-4"
      style={{
        background: "var(--surface)",
        border: "2px solid var(--border)",
        boxShadow: "var(--shadow-bouncy)",
      }}
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={16} strokeWidth={2.5} className="text-[var(--accent)]" />
          <h2 className="font-display text-[14px] font-extrabold uppercase tracking-wide">Daily quests</h2>
        </div>
        <span className="font-display text-[12px] font-extrabold tabular-nums text-muted">
          {doneCount}/{quests.length}
        </span>
      </header>

      <ul className="flex flex-col gap-3">
        {quests.map((q) => {
          const value = progress[q.id] ?? 0;
          const pct = Math.min(100, (value / q.target) * 100);
          const done = !!completed[q.id];
          return (
            <li key={q.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold leading-snug">{q.label}</span>
                <span
                  className="shrink-0 font-display text-[11px] font-extrabold tabular-nums"
                  style={{ color: done ? "var(--success)" : "var(--muted)" }}
                >
                  {done ? (
                    <span className="inline-flex items-center gap-0.5">
                      <CheckCircle2 size={12} strokeWidth={2.5} />
                      {QUEST_KIND_LABEL[q.kind]}
                    </span>
                  ) : (
                    `${value}/${q.target}`
                  )}
                </span>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full"
                style={{ background: "color-mix(in srgb, var(--accent) 10%, var(--surface))" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: done
                      ? "linear-gradient(90deg, var(--success) 0%, color-mix(in srgb, var(--success) 70%, var(--accent)) 100%)"
                      : "linear-gradient(90deg, var(--accent) 0%, var(--game) 100%)",
                  }}
                  animate={{ width: `${pct}%` }}
                  transition={springy}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
