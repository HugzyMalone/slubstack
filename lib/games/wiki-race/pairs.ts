import { getDayIndex, getTodayStr } from "@/lib/wordle-words";

export type WikiPair = { start: string; target: string };

export const WIKI_PAIRS: WikiPair[] = [
  { start: "Banana", target: "Quantum mechanics" },
  { start: "Coffee", target: "French Revolution" },
  { start: "Pizza", target: "Albert Einstein" },
  { start: "Chess", target: "Pacific Ocean" },
  { start: "Volcano", target: "William Shakespeare" },
  { start: "Bicycle", target: "DNA" },
  { start: "Chocolate", target: "Moon landing" },
  { start: "Football", target: "Periodic table" },
  { start: "Lighthouse", target: "Internet" },
  { start: "Penguin", target: "Roman Empire" },
  { start: "Guitar", target: "Black hole" },
  { start: "Sushi", target: "Leonardo da Vinci" },
  { start: "Tornado", target: "Photosynthesis" },
  { start: "Dinosaur", target: "Olympic Games" },
  { start: "Whisky", target: "Great Wall of China" },
  { start: "Telescope", target: "Mona Lisa" },
  { start: "Octopus", target: "Mount Everest" },
  { start: "Vaccine", target: "Jazz" },
  { start: "Pyramid", target: "Electric guitar" },
  { start: "Honeybee", target: "Theory of relativity" },
  { start: "Skateboard", target: "Renaissance" },
  { start: "Avocado", target: "Industrial Revolution" },
  { start: "Lightning", target: "Beethoven" },
  { start: "Submarine", target: "Sahara" },
  { start: "Coral reef", target: "Cold War" },
  { start: "Marathon", target: "Solar System" },
  { start: "Origami", target: "Aristotle" },
  { start: "Glacier", target: "Beatles" },
  { start: "Espresso", target: "Galileo Galilei" },
  { start: "Kangaroo", target: "Big Bang" },
];

export function getDailyPair(dateStr = getTodayStr()): WikiPair {
  return WIKI_PAIRS[getDayIndex(dateStr) % WIKI_PAIRS.length];
}

export function getRandomPair(): WikiPair {
  return WIKI_PAIRS[Math.floor(Math.random() * WIKI_PAIRS.length)];
}
