import type { YearQuestion } from "@/components/games/year-guesser/PlayBoard";
import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

type YearEntry = {
  id: string;
  caption: string;
  actualYear: number;
  rangeMin: number;
  rangeMax: number;
};

const ENTRIES: YearEntry[] = [
  { id: "moon-landing", caption: "Apollo 11 lands on the Moon", actualYear: 1969, rangeMin: 1900, rangeMax: 2024 },
  { id: "first-iphone", caption: "Apple unveils the first iPhone", actualYear: 2007, rangeMin: 1980, rangeMax: 2024 },
  { id: "www-launch", caption: "Tim Berners-Lee makes the World Wide Web public", actualYear: 1991, rangeMin: 1960, rangeMax: 2024 },
  { id: "berlin-wall-falls", caption: "Fall of the Berlin Wall", actualYear: 1989, rangeMin: 1945, rangeMax: 2024 },
  { id: "titanic-sinks", caption: "RMS Titanic sinks on her maiden voyage", actualYear: 1912, rangeMin: 1850, rangeMax: 2000 },
  { id: "ww2-ends", caption: "End of World War II", actualYear: 1945, rangeMin: 1900, rangeMax: 2000 },
  { id: "wright-brothers", caption: "Wright brothers' first powered flight", actualYear: 1903, rangeMin: 1850, rangeMax: 2000 },
  { id: "chernobyl", caption: "Chernobyl nuclear disaster", actualYear: 1986, rangeMin: 1950, rangeMax: 2024 },
  { id: "9-11-attacks", caption: "September 11 attacks on the World Trade Center", actualYear: 2001, rangeMin: 1970, rangeMax: 2024 },
  { id: "facebook-launch", caption: "Facebook is launched at Harvard", actualYear: 2004, rangeMin: 1980, rangeMax: 2024 },
  { id: "youtube-launch", caption: "YouTube is founded", actualYear: 2005, rangeMin: 1980, rangeMax: 2024 },
  { id: "google-founded", caption: "Google is founded", actualYear: 1998, rangeMin: 1970, rangeMax: 2024 },
  { id: "harry-potter-1", caption: "Harry Potter and the Philosopher's Stone is published", actualYear: 1997, rangeMin: 1970, rangeMax: 2024 },
  { id: "lotr-fellowship", caption: "The Lord of the Rings: The Fellowship of the Ring released", actualYear: 2001, rangeMin: 1970, rangeMax: 2024 },
  { id: "star-wars-iv", caption: "Star Wars: A New Hope premieres", actualYear: 1977, rangeMin: 1950, rangeMax: 2024 },
  { id: "jurassic-park", caption: "Jurassic Park hits cinemas", actualYear: 1993, rangeMin: 1970, rangeMax: 2024 },
  { id: "thriller-album", caption: "Michael Jackson releases Thriller", actualYear: 1982, rangeMin: 1960, rangeMax: 2024 },
  { id: "abbey-road", caption: "The Beatles release Abbey Road", actualYear: 1969, rangeMin: 1950, rangeMax: 2000 },
  { id: "nevermind-nirvana", caption: "Nirvana releases Nevermind", actualYear: 1991, rangeMin: 1970, rangeMax: 2024 },
  { id: "england-world-cup", caption: "England wins the FIFA World Cup", actualYear: 1966, rangeMin: 1930, rangeMax: 2024 },
  { id: "maradona-hand-of-god", caption: "Maradona's Hand of God goal vs England", actualYear: 1986, rangeMin: 1950, rangeMax: 2024 },
  { id: "spain-world-cup", caption: "Spain wins their first FIFA World Cup", actualYear: 2010, rangeMin: 1970, rangeMax: 2024 },
  { id: "eiffel-tower", caption: "The Eiffel Tower is completed", actualYear: 1889, rangeMin: 1800, rangeMax: 1950 },
  { id: "empire-state", caption: "The Empire State Building opens", actualYear: 1931, rangeMin: 1880, rangeMax: 2000 },
  { id: "burj-khalifa", caption: "Burj Khalifa opens in Dubai", actualYear: 2010, rangeMin: 1980, rangeMax: 2024 },
  { id: "sydney-opera", caption: "Sydney Opera House officially opens", actualYear: 1973, rangeMin: 1940, rangeMax: 2024 },
  { id: "dna-structure", caption: "Watson and Crick describe the structure of DNA", actualYear: 1953, rangeMin: 1900, rangeMax: 2000 },
  { id: "human-genome", caption: "Completion of the Human Genome Project", actualYear: 2003, rangeMin: 1970, rangeMax: 2024 },
  { id: "first-heart-transplant", caption: "First successful human heart transplant", actualYear: 1967, rangeMin: 1920, rangeMax: 2000 },
  { id: "covid-pandemic", caption: "WHO declares COVID-19 a pandemic", actualYear: 2020, rangeMin: 1990, rangeMax: 2024 },
  { id: "channel-tunnel", caption: "Channel Tunnel between UK and France opens", actualYear: 1994, rangeMin: 1960, rangeMax: 2024 },
  { id: "euro-currency", caption: "Euro banknotes and coins enter circulation", actualYear: 2002, rangeMin: 1980, rangeMax: 2024 },
];

function shuffleInPlace<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROUND_QUESTIONS = 25;

export function generateYearQuestions(_level: number, seed: string): YearQuestion[] {
  const rng = mulberry32(`${seed}::year-guesser`);
  const pool = shuffleInPlace([...ENTRIES], rng);
  const picked = pool.slice(0, Math.min(ROUND_QUESTIONS, pool.length));

  return picked.map((entry) => ({
    imageSrc: `/year-guesser/${entry.id}.svg`,
    imageAlt: entry.caption,
    caption: entry.caption,
    actualYear: entry.actualYear,
    rangeMin: entry.rangeMin,
    rangeMax: entry.rangeMax,
  }));
}

export const YEAR_GUESSER_ENTRIES = ENTRIES;
