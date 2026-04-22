# German Learning: Structural Grammar + Content Expansion

**Branch:** `claude/plan-german-learning-Kc8a7`
**Status as of this snapshot:** ~65% complete — all code/structural changes done, content generation pending.

---

## Progress snapshot

| Phase | Task | Status |
|---|---|---|
| 1 | Extend `Card` / `Unit` types in `lib/content.ts` | ✅ Done |
| 1 | Extend `InteractionKind` + grammar ordering in `lib/session.ts` | ✅ Done |
| 2 | Create `lib/german.ts` (gender colors, umlaut fold, noun parser) | ✅ Done |
| 2 | Create `components/cards/GenderPick.tsx` | ✅ Done |
| 2 | Create `components/cards/CasePick.tsx` | ✅ Done |
| 2 | Create `components/cards/PluralDrill.tsx` | ✅ Done |
| 2 | Create `components/cards/Conjugate.tsx` | ✅ Done |
| 2 | Wire new kinds into `components/SessionRunner.tsx` | ✅ Done |
| 4 | Lenient umlaut matching in `TypeAnswer.tsx` | ✅ Done |
| 4 | Onscreen ä/ö/ü/ß key bar in `TypeAnswer.tsx` | ✅ Done |
| 4 | Gender color accent + speaker in `MultipleChoice.tsx` | ✅ Done |
| 1–4 | Type check (no new errors introduced) | ✅ Done |
| 3 | Tag existing German cards with `gender` / `plural` / `conjugations` | ⏳ **Next** |
| 3 | Add 6 new units (`de-articles`, `de-cases`, `de-plurals`, `de-conjugation`, `de-places`, `de-separable`) | ⏳ Pending |
| 3 | Backfill existing 7 units toward ~18 cards each | ⏳ Pending |
| 5 | Dev smoke test (`pnpm dev` + `/german`) | ⏳ Pending |
| 5 | Commit + push to `claude/plan-german-learning-Kc8a7` | ⏳ Pending |

---

## Context

Slubstack's German section is the weakest of the three language tracks: **7 units / 101 cards** (vs Spanish 8 / ~120, Mandarin 8 / 160), only **3 interaction types** (multiple-choice, type, match — no "build"), no handling of **German-specific grammar** (gender/articles, case inflection, plurals, verb conjugation, separable verbs), no **umlaut input help**, and no audio differentiation.

This round of work closes those gaps in one coordinated pass:

- Adds **four new German-specific card types**: gender picker, case picker, plural drill, verb conjugation.
- Introduces **four new dedicated grammar units** that drill those types.
- Extends the vocab card shape with optional grammar metadata so existing vocab can be tagged (gender, plural, case examples, conjugations) and so a future "Places" unit + backfilled cards get grammar-aware out of the box.
- Adds content: **Places** unit, **separable verbs** set, **backfill** of existing 7 units toward ~18 cards each, and optional **example sentences** on cards.
- Polishes input UX: **lenient umlaut matching** (`schoen` ↔ `schön`, `strasse` ↔ `straße`) and an **onscreen ä/ö/ü/ß key bar** on the type input for German only.
- Adds **audio pronunciation** via browser TTS on card reveal for German vocab (reuses existing `lib/speech.ts`).
- Adds **gender color coding** (der = blue, die = red, das = green) on noun displays in MC and review cards.

Outcome: German reaches content parity with Spanish/Mandarin and gains targeted drills for the grammar that actually makes German hard.

---

## Phase 1 — Data model extensions

**File:** `lib/content.ts`

1. Extend the shared `Card` type with optional German-specific fields. All optional, so other languages are unaffected:
   ```ts
   export type Gender = "der" | "die" | "das";
   export type GermanCase = "nom" | "acc" | "dat" | "gen";

   export type Card = {
     id: string;
     category: Category;
     hanzi: string;
     pinyin: string;
     english: string;
     note?: string;
     example?: { de: string; en: string };     // NEW — optional example sentence
     gender?: Gender;                           // NEW — for nouns only
     plural?: string;                           // NEW — plural form, e.g. "Frauen"
     cases?: Partial<Record<GermanCase, string>>; // NEW — inflected article+noun per case
     conjugations?: {                           // NEW — for verbs only
       ich: string; du: string; er: string;
       wir: string; ihr: string; sie: string;
     };
     separable?: { prefix: string; root: string }; // NEW — e.g. {prefix:"an", root:"rufen"}
   };
   ```
2. Extend the `allowedInteractions` union with the four new kinds:
   ```ts
   allowedInteractions: (
     | "multiple-choice" | "build" | "type" | "match"
     | "gender-pick" | "case-pick" | "plural-drill" | "conjugate"
   )[];
   ```
3. Update `GERMAN_CONTENT` to include the four new kinds; leave Mandarin/Spanish/Vibe Coding unchanged.

**File:** `lib/session.ts`

4. Extend `InteractionKind`, `LESSON_ORDER`, `REVIEW_ORDER` to include the new kinds. New grammar units use a **grammar-specific order** filtered by the unit's grammar flag — see Phase 3.
5. Add a `cardSupportsKind(card, kind)` helper that short-circuits cards lacking the required metadata (e.g. skip gender-pick if `card.gender` is undefined), falling back to multiple-choice.

---

## Phase 2 — Four new card components

**New files** under `components/cards/`:

| File | Kind | UI |
|---|---|---|
| `GenderPick.tsx` | `gender-pick` | Shows noun (no article). Three big buttons: **der / die / das**. Correct → green; wrong → red, reveal. Uses `card.gender`. |
| `CasePick.tsx` | `case-pick` | Shows a sentence with a blank article (e.g. "Ich sehe ___ Mann"). Four options (der/den/dem/des). Uses `card.cases` to know correct form for the indicated case; case is indicated with a chip label ("Accusative"). |
| `PluralDrill.tsx` | `plural-drill` | Shows singular (`die Frau`) → user types plural. Uses `card.plural`. Accepts via same `germanFold()` as TypeAnswer. |
| `Conjugate.tsx` | `conjugate` | Shows infinitive + subject pronoun (e.g. "sein" + "du"). User types conjugated form ("bist"). Uses `card.conjugations`. |

- All four follow the existing `onResult / onFeedback` contract used by `MultipleChoice`, `TypeAnswer`, etc.
- All four render inside `CardShell` via `SessionRunner` — no new chrome.
- Reuse `pickDistractors()` from `lib/session.ts` for MC-style variants.

**File:** `components/SessionRunner.tsx`

- Extend the dispatch block with four new branches importing the new components.
- Pass `umlautBar={lang === "german"}` to `TypeAnswer`, `PluralDrill`, `Conjugate`.

---

## Phase 3 — Four new grammar units + content  **(IN PROGRESS)**

**Content files** in `content/german/`:

1. **`content/german/vocab.json`** — extend existing cards with new optional fields and add new cards.
2. **`content/german/units.json`** — add six new units:

| Unit ID | Title | Emoji | Uses card type | Cards |
|---|---|---|---|---|
| `de-articles` | Articles & Gender | 🎯 | gender-pick (primary) + MC | ~18 |
| `de-cases` | Noun Cases | 📐 | case-pick (primary) + MC | ~20 |
| `de-plurals` | Plurals | 🔢 | plural-drill (primary) + MC | ~16 |
| `de-conjugation` | Verb Conjugation | ⚙️ | conjugate (primary) + MC | ~18 |
| `de-places` | Places | 🏙️ | vocab (MC/type/match) | ~15 |
| `de-separable` | Separable Verbs | ✂️ | vocab + conjugate | ~14 |

3. **Backfill** Greetings → Days & Time toward ~18 cards each. Tag all existing nouns with `gender`, `plural`. Tag verbs with `conjugations`. Add `example` sentences where they teach usage clearly.

4. Grammar units get a new `primaryInteraction` field on `Unit` (optional). `buildUnitSession` uses it to bias the interaction order for that unit — e.g. `de-articles` interleaves gender-pick heavily, MC lightly. Existing vocab units keep today's behavior.

**Design note:** Grammar units **reuse** existing noun/verb cards by listing their IDs in `cardIds`. A single noun card (e.g. `de-food-01 "das Wasser"`) can be drilled in the Food unit (MC/type), in Articles (gender-pick), in Plurals (plural-drill), and in Cases (case-pick). Same SRS state, different angles of practice.

**File:** `lib/content.ts`
- Add `primaryInteraction?: InteractionKind` to the `Unit` type. ✅ Done.

**File:** `lib/session.ts`
- `buildUnitSession` reads `unit.primaryInteraction` via `content.getUnit(unitId)`. If set, use `GRAMMAR_ORDER_TEMPLATE` = `[P, P, MC, P, P, MC, P, MC, P, P]` filtered by `allowedInteractions`. Otherwise fall back to `LESSON_ORDER`. ✅ Done.

---

## Phase 4 — Polish: umlaut input, audio, gender colors  **(✅ DONE)**

### 4a — Lenient umlaut matching
- `germanFold()` in `lib/german.ts`: folds ä→ae, ö→oe, ü→ue, ß→ss.
- Applied in `TypeAnswer.norm()`, `PluralDrill.normDE()`, `Conjugate.normDE()`.
- Safe for all languages (English words don't contain umlauts).

### 4b — Onscreen ä/ö/ü/ß key bar
- `TypeAnswer.tsx` accepts optional `umlautBar?: boolean` prop (default false).
- When true, renders four inline buttons above the input. Click inserts at cursor position (via `ref` + `selectionStart`) and restores focus.
- `SessionRunner` passes `umlautBar={lang === "german"}` to `TypeAnswer`, `PluralDrill`, `Conjugate`.

### 4c — Audio pronunciation
- `cardLang("de-…")` already returns `de-DE` — no change needed.
- Speaker button present on `MultipleChoice`, `TypeAnswer`, `GenderPick`, `CasePick`, `PluralDrill`, `Conjugate`.

### 4d — Gender color coding
- `lib/german.ts` exports `GENDER_COLORS = { der: "#60a5fa" (blue), die: "#f87171" (red), das: "#4ade80" (green) }`.
- `cardGender(card)` uses `card.gender` if present, else parses leading `der/die/das` from `card.hanzi`.
- `MultipleChoice.tsx` renders a 3px colored left border on the prompt card for German nouns.
- `GenderPick.tsx` uses tinted borders and text for the three article buttons until selection.

---

## Phase 5 — Skill tree & store

**File:** `app/german/page.tsx`
- Skill tree grows from 7 → 13 units. Existing `components/SkillTree.tsx` handles arbitrary unit counts via `findIndex`. No structural change needed — new units appear automatically when `content/german/units.json` is extended.

**File:** `lib/store.ts`
- `germanStore` (key `slubstack-german-v1`) is unchanged — SRS state is keyed by card ID. New cards slot in seamlessly. No migration needed.

**File:** `components/CloudSync.tsx`
- Already syncs `germanXp` into `totalXp`. No change.

---

## Files — Modified / Created

### Modified
- `lib/content.ts` — extended `Card` / `Unit` / `allowedInteractions` types; updated `GERMAN_CONTENT`.
- `lib/session.ts` — exports `InteractionKind` from content, added grammar-unit interaction ordering, extended `buildUnitSession` to read `unit.primaryInteraction`.
- `components/SessionRunner.tsx` — dispatches four new card kinds, passes `umlautBar` for German.
- `components/cards/TypeAnswer.tsx` — lenient umlaut matching; optional umlaut key bar.
- `components/cards/MultipleChoice.tsx` — gender color accent on prompt card.
- `content/german/vocab.json` — (pending) tag existing cards with grammar metadata + add new cards.
- `content/german/units.json` — (pending) add 6 new units.

### Created
- `lib/german.ts` — gender colors, umlaut fold, noun parser, case labels.
- `components/cards/GenderPick.tsx`
- `components/cards/CasePick.tsx`
- `components/cards/PluralDrill.tsx`
- `components/cards/Conjugate.tsx`

### Reused (no duplication)
- `pickDistractors()` in `lib/session.ts` — used for MC-style German variants.
- `norm()` / `acceptedAnswers()` in `TypeAnswer.tsx` — extended with `germanFold()`, not forked.
- `speak()` / `cardLang()` in `lib/speech.ts` — reused by all new German cards.
- `CardShell` + `CardFooter` in `components/cards/CardShell.tsx` — all new cards render inside.
- `SkillTree`, `germanStore`, `CloudSync` — no changes needed.

---

## Verification checklist

1. **Type check**: `pnpm exec tsc --noEmit` — confirmed: no new errors introduced. Only pre-existing unrelated error in `app/learn/[unitId]/page.tsx` (Next.js 16 `PageProps` name change, not in scope).
2. **Dev run** (pending): `pnpm dev` → visit `/german`:
   - Skill tree shows 13 units, active state lands on first incomplete unit.
   - `de-articles` → gender-pick cards render, three article buttons work, feedback fires.
   - `de-cases` → case-pick shows sentence with blank + four options, case label chip shows.
   - `de-plurals` → typing `schoen` for a `schön`-containing plural works (lenient fold).
   - `de-conjugation` → conjugate card shows infinitive + pronoun and accepts conjugated form.
   - Vocab unit → umlaut bar renders above type input on German only (not Spanish).
   - Speaker button on German MC card → plays `de-DE` TTS.
   - Noun cards show gender-colored left border.
3. **Other languages unaffected**: `/spanish` and `/mandarin` lessons still work, no umlaut bar, no gender colors.
4. **Playwright smoke**: `pnpm exec playwright test tests/e2e/smoke.spec.ts` still passes.
5. **Persistence**: complete a unit in `de-articles`, reload — level badge increments, unit shows completed, SRS cards queue for review.
6. **XP sync**: Sign in, complete a German lesson, check `user_stats.xp` reflects bumped cross-language total.

## Out of scope

- Head-to-head multiplayer for grammar drills.
- External TTS providers (browser `speechSynthesis` only).
- SRS weighting changes — first-try correctness logic unchanged.
- Migrating Spanish or Mandarin to the new grammar card types.
