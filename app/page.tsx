"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useStore } from "zustand";
import {
  BookOpen, Gamepad2, ArrowRight, Trophy, Flame, Sparkles, Library,
  Globe, Brain as BrainIcon, Clapperboard, CalendarDays, Target,
  Type, Grid3x3, Spline,
} from "lucide-react";
import { getGameBySlug } from "@/lib/games/catalog";
import { Panda } from "@/components/Panda";
import { Bear } from "@/components/Bear";
import { QuestDrawer } from "@/components/QuestDrawer";
import {
  mandarinStore, germanStore, spanishStore, italianStore, vibeCodingStore,
  useTotalXp,
} from "@/lib/store";
import { globalStore, useEffectiveStreak } from "@/lib/globalStore";
import { useQuestsStore, questsStore } from "@/lib/questsStore";
import { dailyQuestsFor } from "@/lib/quests";
import { levelFromXp } from "@/lib/xp";
import { todayKey } from "@/lib/utils";

type Member = { rank: number; userId: string; username: string; avatar: string | null; lifetimeXp: number; isYou: boolean };
type LeagueData = {
  tier: { id: number; name: string; rank: number; minXp: number };
  lifetimeXp: number;
  members: Member[];
  tiers: { id: number; name: string; rank: number; minXp: number }[];
};

const LEAGUE_TIER_COLOURS: Record<string, string> = {
  Bronze: "#cd7c54",
  Silver: "#94a3b8",
  Gold: "#f59e0b",
  Platinum: "#b0bec5",
  Diamond: "#60d5fa",
  Emerald: "#10b981",
  Obsidian: "#8b5cf6",
};

function SparkleIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="mt-0.5 shrink-0"
      style={{ color: "var(--accent)" }}
    >
      <path d="M12 1 L14.3 9.7 L23 12 L14.3 14.3 L12 23 L9.7 14.3 L1 12 L9.7 9.7 Z" />
    </svg>
  );
}

type HomeButton = {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tint: string;
  bg: string;
};

const HOME_BUTTONS: HomeButton[] = [
  {
    href: "/learning",
    title: "Learning",
    subtitle: "Languages and Skills",
    icon: <BookOpen size={32} strokeWidth={2} />,
    tint: "#6366f1",
    bg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  },
  {
    href: "/games",
    title: "Games",
    subtitle: "Brain Training, Trivia, GeoClone & more",
    icon: <Gamepad2 size={32} strokeWidth={2} />,
    tint: "#a855f7",
    bg: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
  },
];

const LEARNING_BUTTON: HomeButton = {
  href: "/learning",
  title: "Learning",
  subtitle: "Mandarin · Spanish · German · Skills",
  icon: <BookOpen size={28} strokeWidth={2} />,
  tint: "#6366f1",
  bg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
};

type GameButton = {
  href: string;
  title: string;
  tagline: string;
  icon: React.ReactNode;
  tint: string;
  bg: string;
  iconStyle?: "tile" | "raw";
};

const GAME_BUTTONS: GameButton[] = [
  {
    href: "/daily",
    title: "Daily Challenge",
    tagline: "One game a day · build your streak",
    icon: <CalendarDays size={22} strokeWidth={2} />,
    tint: "#f97316",
    bg: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
  },
  {
    href: "/trivia/geo-clone",
    title: "GeoClone",
    tagline: "Guess the city from Street View",
    icon: <Globe size={22} strokeWidth={2} />,
    tint: "#3b82f6",
    bg: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
  },
  {
    href: "/brain-training",
    title: "Brain Training",
    tagline: "Math Blitz, Wordle, Connections",
    icon: <BrainIcon size={22} strokeWidth={2} />,
    tint: "#ec4899",
    bg: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
  },
  {
    href: "/trivia",
    title: "Trivia",
    tagline: "Actors, flags, albums, years",
    icon: <Clapperboard size={22} strokeWidth={2} />,
    tint: "#a855f7",
    bg: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
  },
];

type DailyTile = { slug: string; name: string; href: string; tint: string; icon: React.ReactNode };

const DAILY_TILES: DailyTile[] = [
  { slug: "wordle", icon: <Type size={20} strokeWidth={2.5} /> },
  { slug: "connections", icon: <Grid3x3 size={20} strokeWidth={2.5} /> },
  { slug: "semantle", icon: <Spline size={20} strokeWidth={2.5} /> },
].map(({ slug, icon }) => {
  const g = getGameBySlug(slug)!;
  return { slug, name: g.name, href: g.playHref, tint: g.accent, icon };
});

function DailyPuzzlesRow({ size = "mobile" }: { size?: "mobile" | "desktop" }) {
  const compact = size === "mobile";
  return (
    <div className={compact ? "flex-shrink-0 pt-1 pb-2" : ""}>
      <h2 className="mb-1.5 text-[11px] font-extrabold tracking-[0.16em] text-muted uppercase">
        Today's puzzles
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {DAILY_TILES.map(({ slug, name, href, tint, icon }) => (
          <Link
            key={slug}
            href={href}
            className="group flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 transition-transform duration-150 active:scale-[0.97] hover:-translate-y-0.5"
            style={{
              background: `color-mix(in srgb, ${tint} 12%, var(--surface))`,
              border: `1.5px solid color-mix(in srgb, ${tint} 30%, transparent)`,
            }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ background: tint }}
            >
              {icon}
            </span>
            <span className="text-[12px] font-extrabold leading-tight" style={{ color: tint }}>
              {name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const FACTS = [
  // Languages
  "Spanish is spoken natively by over 485 million people across 20+ countries.",
  "Mandarin is the most spoken native language on Earth with 920 million speakers.",
  "There are over 50,000 Chinese characters, but 3,500 cover 99% of everyday reading.",
  "German has a word for everything — 'Fingerspitzengefühl' means intuitive sensitivity.",
  "Learning a second language can delay the onset of Alzheimer's by up to 5 years.",
  "People who learn languages as adults develop denser grey matter in their brains.",
  "Japanese has three separate writing systems: Hiragana, Katakana, and Kanji.",
  "There are about 7,000 languages spoken in the world today.",
  "Around half the world's languages have fewer than 10,000 native speakers.",
  "The oldest known written language is Sumerian, dating back to around 3100 BC.",
  "Papua New Guinea has over 800 languages — the most linguistic diversity of any country.",
  "French was the official language of England for over 300 years after the Norman Conquest.",
  "The Spanish word 'esperar' means both 'to wait' and 'to hope' at the same time.",
  "In Mandarin, 'crisis' (危机) combines characters for 'danger' and 'opportunity'.",
  "The longest German word — 79 letters — refers to a beef labelling law.",
  "English borrows more words from other languages than almost any other language.",
  "Bilingual people tend to be measurably better at multitasking and switching focus.",
  "Children learn languages faster because their brains haven't pruned unused neural pathways yet.",
  "The word 'quiz' was supposedly invented in Dublin as a bet to coin a new word overnight.",
  "Every two weeks, a language somewhere in the world goes extinct.",
  "Hawaiian has only 13 letters in its entire alphabet.",
  "Russian has a separate word for dark blue and light blue — they're treated as completely different colours.",
  "The language with the most words is English, with over 170,000 words currently in use.",
  "Swahili is spoken by over 200 million people across 14 African countries.",
  "Arabic is written right to left, but numbers are written left to right.",

  // Brain & cognition
  "Your brain uses 20% of your body's energy despite being only 2% of your weight.",
  "The human brain can store about 2.5 petabytes — enough for 3 million hours of TV.",
  "Math and music activate the same brain regions — both rely on pattern recognition.",
  "You have about 86 billion neurons, each connected to thousands of others.",
  "The brain is more active during sleep than during most waking activities.",
  "Memories are not stored in one place — they're reconstructed every time you recall them.",
  "Neuroplasticity means your brain physically rewires itself every time you learn something new.",
  "The average person has about 6,200 thoughts per day.",
  "Emotions are processed faster than conscious thought — you feel before you think.",
  "Your brain generates enough electricity to power a small light bulb.",
  "The prefrontal cortex — responsible for decisions — isn't fully developed until age 25.",
  "Multitasking is a myth; your brain rapidly switches between tasks, never doing both at once.",
  "Boredom activates the brain's default mode network, sparking creativity and problem-solving.",
  "Stress physically shrinks the hippocampus — the brain's primary memory centre.",
  "Regular aerobic exercise grows the hippocampus and measurably improves memory.",
  "Reading fiction activates the same brain regions as actually experiencing the events described.",
  "Sleep consolidates memories — pulling all-nighters is the worst strategy for retention.",
  "The 'tip-of-the-tongue' feeling happens when your brain retrieves meaning but can't access the sound.",
  "Laughter activates the same brain reward pathways as chocolate and music.",
  "Your brain rewires itself just by mentally rehearsing a skill — imagination changes brain structure.",
  "The human brain has roughly 100 trillion synaptic connections.",
  "Forgetting is not failure — it's the brain's way of clearing space for more important information.",
  "Spaced repetition is scientifically the most effective method for long-term memory retention.",
  "The brain's reward system releases dopamine when you complete a task, no matter how small.",
  "People who meditate regularly show measurable increases in grey matter density.",

  // Math & numbers
  "The sum of all numbers from 1 to 100 is 5,050 — a trick attributed to 9-year-old Gauss.",
  "Zero was independently invented in India, Babylon, and the Maya civilisation.",
  "There are more possible chess games than atoms in the observable universe.",
  "A googol (10^100) is larger than the number of atoms in the observable universe.",
  "The Fibonacci sequence appears in sunflower seeds, pinecones, and nautilus shells.",
  "Pi has been calculated to over 100 trillion decimal places — and it never repeats.",
  "'Forty' is the only number in English that is spelled in alphabetical order.",
  "The number 1 is neither prime nor composite — it sits in a category of its own.",
  "A prime number is only divisible by 1 and itself — there are infinitely many of them.",
  "The symbol for infinity (∞) is called a lemniscate, first used by John Wallis in 1655.",

  // Science & nature
  "Honey never spoils — archaeologists found 3,000-year-old honey in Egyptian tombs still edible.",
  "A single bolt of lightning is five times hotter than the surface of the sun.",
  "Octopuses have three hearts, blue blood, and can edit their own RNA.",
  "There are more stars in the universe than grains of sand on all of Earth's beaches.",
  "Water is the only natural substance that expands when it freezes.",
  "Trees communicate through underground fungal networks called the 'wood wide web'.",
  "Sharks are older than trees — they've existed for over 450 million years.",
  "The human body contains about 37 trillion cells.",
  "Sound travels four times faster through water than through air.",
  "The average cloud weighs about 500,000 kilograms.",
  "Antarctica is the world's largest desert — it receives less than 200mm of precipitation yearly.",
  "Bananas are slightly radioactive due to their natural potassium content.",
  "A teaspoon of neutron star material weighs about 10 million tonnes.",
  "The sun accounts for 99.86% of all mass in our solar system.",
  "Light from the sun takes about 8 minutes and 20 seconds to reach Earth.",
  "The speed of light is about 299,792 kilometres per second.",
  "If you removed all empty space from every atom in every human, all 8 billion of us would fit in a sugar cube.",
  "DNA is so tightly packed that if you uncoiled all the DNA in a single human cell it would stretch 2 metres.",
  "A day on Venus is longer than a year on Venus — it rotates slower than it orbits the sun.",
  "The deepest point on Earth, the Mariana Trench, is deeper than Everest is tall.",

  // History & culture
  "Oxford University is older than the Aztec Empire — teaching began there around 1096 AD.",
  "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.",
  "The shortest war in history lasted 38 minutes — the Anglo-Zanzibar War of 1896.",
  "The Great Wall of China is not visible from space with the naked eye — that's a myth.",
  "Napoleon was average height for his era — the 'short Napoleon' myth was British propaganda.",
  "The first Olympic Games were held in 776 BC in Olympia, Greece.",
  "The Eiffel Tower grows about 15 centimetres taller in summer due to thermal expansion.",
  "Vikings didn't wear horned helmets — that image was invented by a 19th-century costume designer.",
  "Salt was so valuable in ancient Rome that soldiers were sometimes paid in it — origin of 'salary'.",
  "The first photograph ever taken required an 8-hour exposure time.",
  "Ancient Egyptians shaved off their eyebrows to mourn the death of a cat.",
  "Ancient Romans used crushed mouse brains as toothpaste.",
  "The Library of Alexandria wasn't destroyed in a single fire — it declined gradually over centuries.",
  "Benjamin Franklin never patented any of his inventions — he wanted them freely available to all.",
  "The Colosseum in Rome could hold up to 80,000 spectators and had a retractable awning.",

  // Technology & games
  "Wordle was built in a single weekend as a personal gift — then sold to the NYT for millions.",
  "The first video game ever sold commercially was Computer Space in 1971.",
  "The QWERTY layout was designed to prevent mechanical typewriter keys from jamming.",
  "The first computer bug was an actual moth — trapped in a Harvard Mark II relay in 1947.",
  "Google was originally called 'BackRub' before being renamed after the googol concept.",
  "The first spam email was sent in 1978 to 400 people on ARPANET — advertising a computer.",
  "The Nintendo Game Boy used less processing power than the computer that guided Apollo 11.",
  "The average person checks their phone 96 times a day — about once every 10 minutes.",
  "The first iPhone had no App Store — apps didn't arrive until a year after launch.",
  "More photos are taken every two minutes today than were taken in the entire 19th century.",

  // Animals & biology
  "Crows can recognise individual human faces and hold grudges for years.",
  "Elephants are one of the only animals known to mourn their dead.",
  "The mantis shrimp can punch with the force of a bullet and has 16 types of colour receptors.",
  "Clams can live for over 500 years — the oldest known was 507 years old when discovered.",
  "Butterflies taste with their feet.",
  "Whales evolved from land mammals about 50 million years ago and still retain vestigial hip bones.",
  "A group of flamingos is called a flamboyance.",
  "A snail can sleep for 3 years straight during dry conditions.",
  "A shrimp's heart is located in its head.",
  "Cats have 32 muscles in each ear and can rotate them independently through 180°.",

  // Miscellaneous fascinating
  "The smell of rain on dry earth is called petrichor — from Greek 'stone' and the fluid in gods' veins.",
  "There are more public libraries in the US than McDonald's restaurants.",
  "A 'jiffy' is an actual unit of time — 1/100th of a second in physics.",
  "The inventor of the Pringles can requested to be buried in one — and was.",
  "It is impossible to hum while holding your nose closed.",
  "Competitive art was an Olympic event from 1912 to 1948 — medals were given for paintings and sculptures.",
  "The longest recorded flight of a chicken is 13 seconds.",
  "A day on Mars is 24 hours and 37 minutes — almost identical to Earth.",
  "Humans share 60% of their DNA with bananas.",
  "The average person walks about 100,000 kilometres in their lifetime — roughly twice around the Earth.",
];

type HeroOption = { char: "panda" | "bear"; mood: "idle" | "happy" | "celebrating" | "sad" | "wrong" };
const HERO_OPTIONS: HeroOption[] = [
  { char: "panda", mood: "happy" },
  { char: "panda", mood: "celebrating" },
  { char: "panda", mood: "idle" },
  { char: "bear",  mood: "happy" },
  { char: "bear",  mood: "celebrating" },
  { char: "bear",  mood: "wrong" },
  { char: "bear",  mood: "sad" },
  { char: "bear",  mood: "idle" },
];

const HERO_SESSION_KEY = "slubstack_home_hero";

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  if (h >= 18 && h < 22) return "Good evening";
  return "Welcome back";
}

export default function HubPage() {
  const [hero, setHero] = useState<HeroOption>(HERO_OPTIONS[0]);
  const [factIdx, setFactIdx] = useState(0);
  const [greeting, setGreeting] = useState("");
  const prefersReducedMotion = useReducedMotion();

  const streak = useEffectiveStreak();
  const lastActiveDate = useStore(globalStore, (s) => s.lastActiveDate);
  const [mounted, setMounted] = useState(false);
  const [questsOpen, setQuestsOpen] = useState(false);
  const questDateKey = useQuestsStore((s) => s.dateKey);
  const questCompleted = useQuestsStore((s) => s.completed);

  useEffect(() => {
    setMounted(true);
    questsStore.getState().rollIfStale();
  }, []);

  const todaysQuests = mounted ? dailyQuestsFor(questDateKey) : [];
  const questsDone = todaysQuests.filter((q) => questCompleted[q.id]).length;
  const questsTotal = mounted ? todaysQuests.length : 3;

  useEffect(() => {
    const today = todayKey();
    const activeToday = lastActiveDate === today;

    if (streak >= 7) { setHero({ char: "bear", mood: "celebrating" }); return; }
    if (streak >= 3) { setHero({ char: "bear", mood: "happy" }); return; }
    if (streak === 0 && lastActiveDate && !activeToday) {
      setHero({ char: "bear", mood: "sad" }); return;
    }

    try {
      const saved = sessionStorage.getItem(HERO_SESSION_KEY);
      if (saved) { setHero(JSON.parse(saved)); return; }
    } catch {}
    const neutralOpts: HeroOption[] = [
      { char: "bear", mood: "idle" },
      { char: "bear", mood: "happy" },
      { char: "panda", mood: "idle" },
      { char: "panda", mood: "happy" },
    ];
    const picked = neutralOpts[Math.floor(Math.random() * neutralOpts.length)];
    try { sessionStorage.setItem(HERO_SESSION_KEY, JSON.stringify(picked)); } catch {}
    setHero(picked);
  }, [streak, lastActiveDate]);

  useEffect(() => {
    setFactIdx(Math.floor(Date.now() / (1000 * 60 * 60)) % FACTS.length);
    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      document.body.style.overflow = mql.matches ? "" : "hidden";
    };
    apply();
    mql.addEventListener("change", apply);
    return () => {
      mql.removeEventListener("change", apply);
      document.body.style.overflow = "";
    };
  }, []);

  const cycleFact = () => setFactIdx(prev => (prev + 6) % FACTS.length);

  return (
    <div
      className="relative overflow-hidden px-4 lg:h-auto lg:overflow-visible lg:px-8 lg:py-10 lg:max-w-[1200px] lg:mx-auto"
      style={{ height: "calc(100dvh - 52px - env(safe-area-inset-top, 0px))" }}
    >
      {/* Subtle accent glow behind hero */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: -1,
          background:
            "radial-gradient(ellipse 100% 50% at 50% -5%, color-mix(in srgb, var(--accent) 14%, transparent), transparent)",
        }}
      />

      {/* Mobile layout (no-scroll, 2x2 tiles) */}
      <div className="flex h-full flex-col lg:hidden">
        <h1 className="sr-only">Slubstack home</h1>
        <motion.p
          className="flex-shrink-0 pt-2.5 pb-0.5 text-center text-[13px] font-semibold tracking-widest text-muted uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: greeting ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {greeting || " "}
        </motion.p>

        <div className="flex flex-shrink-0 items-center justify-center gap-2 pb-1.5">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{
              background: "color-mix(in srgb, #ff8a4c 14%, var(--surface))",
              border: "1.5px solid color-mix(in srgb, #ff8a4c 30%, transparent)",
            }}
          >
            <Flame size={14} strokeWidth={2.5} className="text-[#ff6a1c]" fill="#ff8a4c" />
            <span className="text-[12px] font-extrabold tabular-nums text-[#c2410c]">{mounted ? streak : 0}</span>
            <span className="text-[12px] font-bold text-[#c2410c]">day streak</span>
          </div>
          <button
            type="button"
            onClick={() => setQuestsOpen(true)}
            className="relative flex items-center gap-1.5 rounded-full px-3 py-1 transition-transform duration-100 active:scale-95"
            style={{
              background: "color-mix(in srgb, var(--accent) 14%, var(--surface))",
              border: "1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
          >
            <Target size={13} strokeWidth={2.5} className="text-[var(--accent)]" />
            <span className="text-[12px] font-extrabold tabular-nums text-[var(--accent)]">{questsDone}/{questsTotal}</span>
            <span className="text-[12px] font-bold text-[var(--accent)]">quests</span>
            {mounted && questsDone < questsTotal && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
                style={{ background: "var(--game)", border: "1.5px solid var(--bg)" }}
              />
            )}
          </button>
        </div>

        <motion.div
          className="relative flex-shrink-0"
          style={{ height: "19vh", maxHeight: 162 }}
          animate={prefersReducedMotion ? {} : { y: [0, -7, 0] }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
        >
          {hero.char === "bear"
            ? <Bear mood={hero.mood} fill />
            : <Panda mood={hero.mood} fill />}
        </motion.div>

        <motion.div
          className="flex-shrink-0 mb-2"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <button onClick={cycleFact} className="w-full text-left" aria-label="Show another fact">
            <div
              className="flex items-start gap-2.5 rounded-2xl px-4 py-2 transition-opacity duration-150 active:opacity-70"
              style={{
                background: "color-mix(in srgb, var(--accent) 8%, var(--surface))",
                border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)",
              }}
            >
              <SparkleIcon />
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={factIdx}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="text-[12px] leading-relaxed text-muted"
                  >
                    {FACTS[factIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </button>
        </motion.div>

        <DailyPuzzlesRow size="mobile" />

        <div className="flex flex-1 min-h-0 flex-col gap-3 pb-[max(calc(env(safe-area-inset-bottom,0px)+72px),88px)]">
          {HOME_BUTTONS.map(({ href, title, subtitle, icon, tint, bg }, i) => (
            <motion.div
              key={href}
              className="flex-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Link
                href={href}
                className="group flex h-full items-center gap-4 rounded-3xl p-5 transition-transform duration-150 active:scale-[0.98]"
                style={{
                  background: `color-mix(in srgb, ${tint} 12%, var(--surface))`,
                  border: `1.5px solid color-mix(in srgb, ${tint} 28%, transparent)`,
                  boxShadow: `0 6px 24px color-mix(in srgb, ${tint} 14%, transparent)`,
                }}
              >
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                  style={{ background: bg }}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[18px] font-extrabold leading-tight">{title}</div>
                  <div className="mt-0.5 text-[12px] leading-snug text-muted">{subtitle}</div>
                </div>
                <ArrowRight size={18} style={{ color: tint }} className="shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Desktop dashboard (lg+) */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.7fr)] lg:gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[13px] font-semibold tracking-widest text-muted uppercase">
              {greeting || " "}
            </p>
            <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight">
              Welcome back to Slubstack.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Learn a language, sharpen your mind, or play a round of trivia. Pick up where you left off.
            </p>
          </div>

          <motion.div
            className="relative flex items-center justify-center"
            style={{ height: 280 }}
            animate={prefersReducedMotion ? {} : { y: [0, -7, 0] }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
          >
            {hero.char === "bear"
              ? <Bear mood={hero.mood} fill />
              : <Panda mood={hero.mood} fill />}
          </motion.div>

          <FactsFeed factIdx={factIdx} cycleFact={cycleFact} />
        </div>

        <div className="flex flex-col gap-5">
          <StatsBand />

          <DailyPuzzlesRow size="desktop" />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link
              href={LEARNING_BUTTON.href}
              className="group flex items-center gap-4 rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5"
              style={{
                background: `color-mix(in srgb, ${LEARNING_BUTTON.tint} 10%, var(--surface))`,
                border: `1.5px solid color-mix(in srgb, ${LEARNING_BUTTON.tint} 26%, transparent)`,
                boxShadow: `0 8px 24px color-mix(in srgb, ${LEARNING_BUTTON.tint} 14%, transparent)`,
              }}
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{ background: LEARNING_BUTTON.bg }}
              >
                {LEARNING_BUTTON.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-extrabold tracking-tight">{LEARNING_BUTTON.title}</div>
                <div className="mt-0.5 text-[12.5px] leading-snug text-muted">{LEARNING_BUTTON.subtitle}</div>
              </div>
              <ArrowRight size={18} style={{ color: LEARNING_BUTTON.tint }} className="shrink-0 transition-transform duration-150 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {GAME_BUTTONS.map(({ href, title, tagline, icon, tint, bg, iconStyle }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 + i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Link
                  href={href}
                  className="group flex h-full items-center gap-3 rounded-2xl p-3.5 transition-all duration-150 hover:-translate-y-0.5"
                  style={{
                    background: `color-mix(in srgb, ${tint} 9%, var(--surface))`,
                    border: `1.5px solid color-mix(in srgb, ${tint} 24%, transparent)`,
                    boxShadow: `0 6px 18px color-mix(in srgb, ${tint} 11%, transparent)`,
                  }}
                >
                  {iconStyle === "raw" ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                      {icon}
                    </div>
                  ) : (
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ background: bg }}
                    >
                      {icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-extrabold tracking-tight">{title}</div>
                    <div className="mt-0.5 truncate text-[11px] leading-snug text-muted">{tagline}</div>
                  </div>
                  <ArrowRight size={14} style={{ color: tint }} className="shrink-0 transition-transform duration-150 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            ))}
          </div>

          <LeagueWidget />

          <div className="grid grid-cols-2 gap-3">
            <EloLeaderboardWidget kind="geo_clone" title="GeoClone ELO" tint="#3b82f6" />
            <EloLeaderboardWidget kind="trivia" title="Trivia ELO" tint="#a855f7" />
          </div>
        </div>
      </div>

      <QuestDrawer open={questsOpen} onClose={() => setQuestsOpen(false)} />
    </div>
  );
}

function StatsBand() {
  const streak = useEffectiveStreak();
  const mWords = useStore(mandarinStore, (s) => s.seenCardIds.length);
  const gWords = useStore(germanStore, (s) => s.seenCardIds.length);
  const sWords = useStore(spanishStore, (s) => s.seenCardIds.length);
  const iWords = useStore(italianStore, (s) => s.seenCardIds.length);
  const vWords = useStore(vibeCodingStore, (s) => s.seenCardIds.length);

  const totalXp = useTotalXp();
  const level = levelFromXp(totalXp);
  const words = mWords + gWords + sWords + iWords + vWords;

  const chips = [
    { icon: <Flame size={14} />, label: "Streak", value: streak === 0 ? "—" : `${streak}d`, tint: "#f97316" },
    { icon: <Trophy size={14} />, label: "Level", value: `Lv. ${level}`, tint: "var(--accent)" },
    { icon: <Sparkles size={14} />, label: "Total XP", value: totalXp.toLocaleString(), tint: "#8b5cf6" },
    { icon: <Library size={14} />, label: "Words", value: words.toLocaleString(), tint: "#10b981" },
  ];

  return (
    <motion.div
      className="grid grid-cols-4 gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {chips.map((c) => (
        <div
          key={c.label}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{
              color: c.tint,
              background: `color-mix(in srgb, ${c.tint} 12%, transparent)`,
            }}
          >
            {c.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-muted">{c.label}</div>
            <div className="truncate text-[14px] font-extrabold tabular-nums leading-tight">{c.value}</div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function LeagueWidget() {
  const [data, setData] = useState<LeagueData | null>(null);
  const [unauthed, setUnauthed] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leagues/current")
      .then((r) => {
        if (r.status === 401) { if (!cancelled) setUnauthed(true); return null; }
        if (!r.ok) return Promise.reject(r.status);
        return r.json();
      })
      .then((d: LeagueData | null) => { if (d && !cancelled) setData(d); })
      .catch(() => { if (!cancelled) setErrored(true); });
    return () => { cancelled = true; };
  }, []);

  if (unauthed) {
    return (
      <Link
        href="/stats"
        className="group flex items-center gap-4 rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5"
        style={{
          background: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
          border: "1.5px dashed color-mix(in srgb, var(--accent) 32%, transparent)",
        }}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)" }}
        >
          <Trophy size={22} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-extrabold tracking-[0.18em] text-muted uppercase">Your league</div>
          <div className="mt-0.5 text-[14px] font-extrabold tracking-tight">Sign in to join the league</div>
          <div className="mt-0.5 text-[11.5px] leading-snug text-muted">Climb the all-time XP ladder against other learners.</div>
        </div>
        <ArrowRight size={16} style={{ color: "var(--accent)" }} className="shrink-0 transition-transform duration-150 group-hover:translate-x-1" />
      </Link>
    );
  }

  if (errored || !data) return null;

  const newUser = data.lifetimeXp === 0 || data.members.length === 0;
  if (newUser) {
    return (
      <Link
        href="/leaderboard/league"
        className="group flex items-center gap-4 rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5"
        style={{
          background: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
          border: "1.5px dashed color-mix(in srgb, var(--accent) 32%, transparent)",
        }}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)" }}
        >
          <Trophy size={22} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-extrabold tracking-[0.18em] text-muted uppercase">Your league</div>
          <div className="mt-0.5 text-[14px] font-extrabold tracking-tight">Earn XP to climb into {data.tier.name}</div>
          <div className="mt-0.5 text-[11.5px] leading-snug text-muted">Complete a lesson or game to claim your spot on the ladder.</div>
        </div>
        <ArrowRight size={16} style={{ color: "var(--accent)" }} className="shrink-0 transition-transform duration-150 group-hover:translate-x-1" />
      </Link>
    );
  }

  const tierName = data.tier.name;
  const me = data.members.find((m) => m.isYou);
  const top = data.members.slice(0, 3);
  const tierColor = LEAGUE_TIER_COLOURS[tierName] ?? "var(--accent)";

  return (
    <Link
      href="/leaderboard/league"
      className="group rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5"
      style={{
        background: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
        border: "1.5px solid color-mix(in srgb, var(--accent) 22%, transparent)",
        boxShadow: "0 6px 20px color-mix(in srgb, var(--accent) 8%, transparent)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: tierColor }} />
          <span className="text-[10px] font-extrabold tracking-[0.18em] text-muted uppercase">Your league</span>
        </div>
        {me && (
          <span className="text-[12px] font-bold tabular-nums text-muted">
            #{me.rank} · {me.lifetimeXp} XP
          </span>
        )}
      </div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tracking-tight" style={{ color: tierColor }}>
          {tierName}
        </span>
        <span className="text-[12px] text-muted">{data.lifetimeXp} XP all-time</span>
      </div>
      <div className="space-y-1.5">
        {top.map((m) => (
          <div key={m.userId} className="flex items-center gap-2.5 text-[12.5px]">
            <span className="w-5 tabular-nums" style={{ color: m.rank === 1 ? "#f59e0b" : m.rank === 2 ? "#94a3b8" : "#b45309" }}>#{m.rank}</span>
            <span className={`flex-1 truncate ${m.isYou ? "font-bold" : "font-medium"}`}>{m.username}{m.isYou ? " (you)" : ""}</span>
            <span className="font-bold tabular-nums text-muted">{m.lifetimeXp}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold opacity-0 transition-opacity duration-150 group-hover:opacity-100" style={{ color: "var(--accent)" }}>
        View full standings <ArrowRight size={12} />
      </div>
    </Link>
  );
}

type EloEntry = {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  rating: number;
  matches: number;
};

function EloLeaderboardWidget({ kind, title, tint }: { kind: "geo_clone" | "trivia"; title: string; tint: string }) {
  const [entries, setEntries] = useState<EloEntry[] | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/live/leaderboard?kind=${kind}&level=1&limit=5`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { entries: EloEntry[] }) => { if (!cancelled) setEntries(d.entries ?? []); })
      .catch(() => { if (!cancelled) setErrored(true); });
    return () => { cancelled = true; };
  }, [kind]);

  if (errored) return null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: `color-mix(in srgb, ${tint} 5%, var(--surface))`,
        border: `1.5px solid color-mix(in srgb, ${tint} 22%, transparent)`,
      }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <Trophy size={14} style={{ color: tint }} />
        <span className="text-[10px] font-extrabold tracking-[0.18em] text-muted uppercase">{title}</span>
      </div>
      {entries === null ? (
        <div className="flex h-[120px] items-center justify-center text-[11px] text-muted">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="flex h-[120px] flex-col items-center justify-center gap-1 text-center">
          <div className="text-[12px] font-bold">No rated matches yet</div>
          <div className="text-[10.5px] leading-snug text-muted">Play a live human match to claim a slot.</div>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {entries.map((e) => (
            <li key={e.userId} className="flex items-center gap-2 text-[12px]">
              <span className="w-4 shrink-0 text-right tabular-nums" style={{ color: e.rank === 1 ? "#f59e0b" : e.rank === 2 ? "#94a3b8" : e.rank === 3 ? "#b45309" : "var(--muted)" }}>{e.rank}</span>
              <span className="flex-1 truncate font-medium">{e.username}</span>
              <span className="font-bold tabular-nums" style={{ color: tint }}>{e.rating}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FactsFeed({ factIdx, cycleFact }: { factIdx: number; cycleFact: () => void }) {
  const visibleFacts = Array.from({ length: 6 }, (_, i) => FACTS[(factIdx + i) % FACTS.length]);
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparkleIcon />
          <span className="text-[10px] font-extrabold tracking-[0.18em] text-muted uppercase">Did you know?</span>
        </div>
        <button onClick={cycleFact} className="text-[11px] font-semibold text-muted hover:text-fg">Shuffle</button>
      </div>
      <ul className="space-y-2.5">
        {visibleFacts.map((fact, i) => (
          <li key={`${factIdx}-${i}`} className="flex gap-2.5 text-[12.5px] leading-relaxed">
            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
            <span className="text-fg/85">{fact}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
