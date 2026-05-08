import type { YearQuestion } from "@/components/games/year-guesser/PlayBoard";
import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

type YearEntry = {
  id: string;
  prompt: string;
  actualYear: number;
};

const ENTRIES: YearEntry[] = [
  { id: "moon-landing", prompt: "Apollo 11 lands on the Moon", actualYear: 1969 },
  { id: "first-iphone", prompt: "Apple unveils the first iPhone", actualYear: 2007 },
  { id: "www-launch", prompt: "Tim Berners-Lee makes the World Wide Web public", actualYear: 1991 },
  { id: "berlin-wall-falls", prompt: "Fall of the Berlin Wall", actualYear: 1989 },
  { id: "titanic-sinks", prompt: "RMS Titanic sinks on her maiden voyage", actualYear: 1912 },
  { id: "ww2-ends", prompt: "End of World War II", actualYear: 1945 },
  { id: "wright-brothers", prompt: "Wright brothers' first powered flight", actualYear: 1903 },
  { id: "chernobyl", prompt: "Chernobyl nuclear disaster", actualYear: 1986 },
  { id: "9-11-attacks", prompt: "September 11 attacks on the World Trade Center", actualYear: 2001 },
  { id: "facebook-launch", prompt: "Facebook is launched at Harvard", actualYear: 2004 },
  { id: "youtube-launch", prompt: "YouTube is founded", actualYear: 2005 },
  { id: "google-founded", prompt: "Google is founded", actualYear: 1998 },
  { id: "harry-potter-1", prompt: "Harry Potter and the Philosopher's Stone is published", actualYear: 1997 },
  { id: "lotr-fellowship", prompt: "The Lord of the Rings: The Fellowship of the Ring released", actualYear: 2001 },
  { id: "star-wars-iv", prompt: "Star Wars: A New Hope premieres", actualYear: 1977 },
  { id: "jurassic-park", prompt: "Jurassic Park hits cinemas", actualYear: 1993 },
  { id: "thriller-album", prompt: "Michael Jackson releases Thriller", actualYear: 1982 },
  { id: "abbey-road", prompt: "The Beatles release Abbey Road", actualYear: 1969 },
  { id: "nevermind-nirvana", prompt: "Nirvana releases Nevermind", actualYear: 1991 },
  { id: "england-world-cup", prompt: "England wins the FIFA World Cup", actualYear: 1966 },
  { id: "maradona-hand-of-god", prompt: "Maradona's Hand of God goal vs England", actualYear: 1986 },
  { id: "spain-world-cup", prompt: "Spain wins their first FIFA World Cup", actualYear: 2010 },
  { id: "eiffel-tower", prompt: "The Eiffel Tower is completed", actualYear: 1889 },
  { id: "empire-state", prompt: "The Empire State Building opens", actualYear: 1931 },
  { id: "burj-khalifa", prompt: "Burj Khalifa opens in Dubai", actualYear: 2010 },
  { id: "sydney-opera", prompt: "Sydney Opera House officially opens", actualYear: 1973 },
  { id: "dna-structure", prompt: "Watson and Crick describe the structure of DNA", actualYear: 1953 },
  { id: "human-genome", prompt: "Completion of the Human Genome Project", actualYear: 2003 },
  { id: "first-heart-transplant", prompt: "First successful human heart transplant", actualYear: 1967 },
  { id: "covid-pandemic", prompt: "WHO declares COVID-19 a pandemic", actualYear: 2020 },
  { id: "channel-tunnel", prompt: "Channel Tunnel between UK and France opens", actualYear: 1994 },
  { id: "euro-currency", prompt: "Euro banknotes and coins enter circulation", actualYear: 2002 },
];

function shuffleInPlace<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROUND_QUESTIONS = 25;
const CURRENT_YEAR = new Date().getFullYear();

function buildOptions(actual: number, rng: RNG): { options: number[]; answerIndex: number } {
  const used = new Set<number>([actual]);
  const decoys: number[] = [];
  while (decoys.length < 3) {
    const offset = randInt(2, 8, rng) * (rng() < 0.5 ? -1 : 1);
    const candidate = actual + offset;
    if (candidate < 1800 || candidate > CURRENT_YEAR) continue;
    if (used.has(candidate)) continue;
    used.add(candidate);
    decoys.push(candidate);
  }
  const options = shuffleInPlace([actual, ...decoys], rng);
  return { options, answerIndex: options.indexOf(actual) };
}

export function generateYearQuestions(_level: number, seed: string): YearQuestion[] {
  const rng = mulberry32(`${seed}::year-guesser`);
  const pool = shuffleInPlace([...ENTRIES], rng);
  const picked = pool.slice(0, Math.min(ROUND_QUESTIONS, pool.length));

  return picked.map((entry) => {
    const { options, answerIndex } = buildOptions(entry.actualYear, rng);
    return {
      caption: "What year?",
      prompt: entry.prompt,
      actualYear: entry.actualYear,
      options,
      answerIndex,
    };
  });
}

export const YEAR_GUESSER_ENTRIES = ENTRIES;
