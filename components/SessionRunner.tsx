"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { SessionItem } from "@/lib/session";
import type { Quality } from "@/lib/srs";
import type { PandaMood } from "@/components/Panda";
import { useGameStore } from "@/lib/store";
import { globalStore } from "@/lib/globalStore";
import { heartsStore, useHeartsStore } from "@/lib/heartsStore";
import { hintTracker } from "@/lib/hintTracker";
import { awardQuestProgress } from "@/lib/questsStore";
import { pushLeagueXp } from "@/lib/leagues";
import { playCorrect, playWrong, playHeartLoss, playStreakSave } from "@/lib/sound";
import { success as hapticSuccess, fail as hapticFail, tapMedium, streak as hapticStreak } from "@/lib/haptics";
import type { Language } from "@/lib/content";
import { CardShell } from "@/components/cards/CardShell";
import { OutOfHearts } from "@/components/OutOfHearts";
import { MultipleChoice } from "@/components/cards/MultipleChoice";
import { BuildPhrase } from "@/components/cards/BuildPhrase";
import { TypeAnswer } from "@/components/cards/TypeAnswer";
import { MatchPairs } from "@/components/cards/MatchPairs";
import { GenderPick } from "@/components/cards/GenderPick";
import { CasePick } from "@/components/cards/CasePick";
import { PluralDrill } from "@/components/cards/PluralDrill";
import { Conjugate } from "@/components/cards/Conjugate";
import { TonePick } from "@/components/cards/TonePick";
import { MeasureWordPick } from "@/components/cards/MeasureWordPick";
import { CharacterFromPinyin } from "@/components/cards/CharacterFromPinyin";
import { LessonCompleteScreen } from "@/components/LessonCompleteScreen";

type Props = {
  items: SessionItem[];
  unitId?: string;
  exitHref?: string;
  reviewHref?: string;
  character?: "panda" | "bear" | "bull";
  lang?: Language;
};

export function SessionRunner({ items, unitId, exitHref = "/", reviewHref = "/review", character = "panda", lang = "mandarin" }: Props) {
  const rateCard = useGameStore((s) => s.rateCard);
  const completeSession = useGameStore((s) => s.completeSession);
  const completeUnit = useGameStore((s) => s.completeUnit);

  const [index, setIndex] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [finished, setFinished] = useState<{ gained: number; streakIncremented: boolean } | null>(null);
  const [pandaMood, setPandaMood] = useState<PandaMood>("idle");
  const [shieldUsedThisLesson, setShieldUsedThisLesson] = useState(false);
  const hearts = useHeartsStore((s) => s.hearts);

  useEffect(() => {
    heartsStore.getState().applyRegen();
  }, []);

  useEffect(() => {
    hintTracker.getState().reset();
  }, [index]);

  const handleFeedback = useCallback((correct: boolean) => {
    setPandaMood(correct ? "happy" : "wrong");
    if (correct) {
      playCorrect();
      hapticSuccess();
      return;
    }
    playWrong();
    hapticFail();
    if (!unitId) return;
    const activeStreak = globalStore.getState().streak > 0;
    if (activeStreak && !shieldUsedThisLesson) {
      setShieldUsedThisLesson(true);
      toast("Streak shield kept your heart");
      return;
    }
    heartsStore.getState().loseHeart();
    playHeartLoss();
    tapMedium();
  }, [shieldUsedThisLesson, unitId]);

  const handleResult = useCallback(
    (r: { quality: Quality; correct: boolean; firstTry: boolean }) => {
      const item = items[index];
      const hintUsed = hintTracker.getState().consume();
      const quality: Quality = hintUsed && r.quality > 2 ? 2 : r.quality;
      rateCard(item.card.id, quality);
      if (r.correct) {
        setTotalCorrect((n) => n + 1);
        if (r.firstTry) setFirstTryCorrect((n) => n + 1);
      }

      if (index + 1 >= items.length) {
        const firstTry = firstTryCorrect + (r.correct && r.firstTry ? 1 : 0);
        const total = totalCorrect + (r.correct ? 1 : 0);
        const { gained, streakIncremented, freezeUsed, freezeGranted } = completeSession(firstTry, total);
        if (unitId) completeUnit(unitId);
        const medalRatio = items.length > 0 ? firstTry / items.length : 0;
        const medalType = medalRatio === 1 ? "gold" : medalRatio >= 0.7 ? "silver" : "bronze";
        globalStore.getState().awardMedal(medalType);
        awardQuestProgress("xp", gained);
        awardQuestProgress("lessons", 1);
        awardQuestProgress("correct", total);
        pushLeagueXp(gained);
        if (freezeUsed) {
          playStreakSave();
          hapticStreak();
          toast.success("Streak shield used — you're safe");
        }
        if (freezeGranted) {
          toast.success("New streak shield earned");
        }
        setFinished({ gained, streakIncremented });
      } else {
        setIndex((i) => i + 1);
        setPandaMood("idle");
      }
    },
    [items, index, rateCard, completeSession, completeUnit, unitId, firstTryCorrect, totalCorrect],
  );

  if (hearts === 0 && !finished) {
    return <OutOfHearts exitHref={exitHref} reviewHref={reviewHref} />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-lg text-muted">Nothing due right now.</p>
        <p className="mt-2 text-sm text-muted">Come back tomorrow, or start a new unit.</p>
      </div>
    );
  }

  if (finished) {
    return (
      <LessonCompleteScreen
        gained={finished.gained}
        firstTryCorrect={firstTryCorrect}
        total={items.length}
        exitHref={exitHref}
        reviewHref={reviewHref}
        language={lang}
        streakIncremented={finished.streakIncremented}
        character={character}
      />
    );
  }

  const current = items[index];
  const progress = index / items.length;

  return (
    <CardShell
      progress={progress}
      total={items.length}
      current={index + 1}
      exitHref={exitHref}
      pandaMood={pandaMood}
      character={character}
    >
      <AnimatePresence mode="wait">
        <div key={`${index}-${current.kind}`}>
          {current.kind === "multiple-choice" && (
            <MultipleChoice
              card={current.card}
              distractors={current.distractors ?? []}
              onResult={handleResult}
              onFeedback={handleFeedback}
            />
          )}
          {current.kind === "build" && (
            <BuildPhrase card={current.card} onResult={handleResult} onFeedback={handleFeedback} />
          )}
          {current.kind === "type" && (
            <TypeAnswer
              card={current.card}
              onResult={handleResult}
              onFeedback={handleFeedback}
              umlautBar={lang === "german"}
            />
          )}
          {current.kind === "match" && (
            <MatchPairs
              card={current.card}
              distractors={current.distractors ?? []}
              onResult={handleResult}
              onFeedback={handleFeedback}
            />
          )}
          {current.kind === "gender-pick" && (
            <GenderPick card={current.card} onResult={handleResult} onFeedback={handleFeedback} />
          )}
          {current.kind === "case-pick" && (
            <CasePick card={current.card} onResult={handleResult} onFeedback={handleFeedback} />
          )}
          {current.kind === "plural-drill" && (
            <PluralDrill card={current.card} onResult={handleResult} onFeedback={handleFeedback} />
          )}
          {current.kind === "conjugate" && (
            <Conjugate card={current.card} onResult={handleResult} onFeedback={handleFeedback} />
          )}
          {current.kind === "tone-pick" && (
            <TonePick card={current.card} onResult={handleResult} onFeedback={handleFeedback} />
          )}
          {current.kind === "measure-pick" && (
            <MeasureWordPick card={current.card} onResult={handleResult} onFeedback={handleFeedback} />
          )}
          {current.kind === "char-from-pinyin" && (
            <CharacterFromPinyin
              card={current.card}
              distractors={current.distractors ?? []}
              onResult={handleResult}
              onFeedback={handleFeedback}
            />
          )}
        </div>
      </AnimatePresence>
    </CardShell>
  );
}
