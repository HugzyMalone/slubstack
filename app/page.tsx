"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Panda } from "@/components/Panda";
import { Bear } from "@/components/Bear";

function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.5" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const SECTIONS = [
  {
    href: "/languages",
    icon: <GlobeIcon />,
    iconBg: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    title: "Languages",
    subtitle: "Spanish · Mandarin · German",
  },
  {
    href: "/brain-training",
    icon: <BrainIcon />,
    iconBg: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    title: "Brain Training",
    subtitle: "Math Blitz & memory games",
  },
  {
    href: "/trivia",
    icon: <FilmIcon />,
    iconBg: "linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)",
    title: "Trivia",
    subtitle: "Actor Blitz & more",
  },
];

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

export default function HubPage() {
  const [hero, setHero] = useState<HeroOption>(HERO_OPTIONS[0]);
  const [factIdx, setFactIdx] = useState(0);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(HERO_SESSION_KEY);
      if (saved) { setHero(JSON.parse(saved)); return; }
    } catch {}
    const picked = HERO_OPTIONS[Math.floor(Math.random() * HERO_OPTIONS.length)];
    try { sessionStorage.setItem(HERO_SESSION_KEY, JSON.stringify(picked)); } catch {}
    setHero(picked);
  }, []);

  useEffect(() => {
    // Pick fact based on current hour — changes once per hour
    setFactIdx(Math.floor(Date.now() / (1000 * 60 * 60)) % FACTS.length);
  }, []);

  // Lock scroll on home page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="flex flex-col px-4 lg:px-6"
      style={{ height: "calc(100dvh - 52px - env(safe-area-inset-top, 0px))" }}
    >
      {/* Hero animal */}
      <div className="relative flex-shrink-0" style={{ height: "28vh", maxHeight: 240 }}>
        {hero.char === "bear"
          ? <Bear mood={hero.mood} fill />
          : <Panda mood={hero.mood} fill />}
      </div>

      {/* Fact of the hour */}
      <div className="flex-shrink-0 px-1 py-3 text-center" style={{ minHeight: 56 }}>
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs text-muted leading-relaxed mx-auto"
          style={{ maxWidth: 320 }}
        >
          {FACTS[factIdx]}
        </motion.p>
      </div>

      {/* Section cards */}
      <div className="flex flex-col gap-2.5 pb-[max(calc(env(safe-area-inset-bottom,0px)+72px),88px)] lg:pb-4">
        {SECTIONS.map(({ href, icon, iconBg, title, subtitle }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-2xl px-5 py-3.5 transition-all duration-150 active:scale-[0.98]"
            style={{
              background: "var(--surface)",
              border: "1px solid color-mix(in srgb, var(--fg) 8%, transparent)",
              boxShadow: "0 2px 8px color-mix(in srgb, var(--fg) 4%, transparent)",
            }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: iconBg }}
            >
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">{title}</div>
              <div className="mt-0.5 text-sm text-muted">{subtitle}</div>
            </div>
            <span className="shrink-0 text-muted"><ChevronRight /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
