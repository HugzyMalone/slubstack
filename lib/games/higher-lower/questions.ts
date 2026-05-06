import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

export type HoLQuestion = {
  caption: string;
  metricLabel: string;
  left: { label: string; value: number; valueLabel: string };
  right: { label: string; value: number; valueLabel: string };
  answerIndex: 0 | 1;
};

type HoLEntry = {
  caption: string;
  metricLabel: string;
  itemA: { label: string; value: number; valueLabel: string };
  itemB: { label: string; value: number; valueLabel: string };
};

const ENTRIES: HoLEntry[] = [
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Canada", value: 40, valueLabel: "40m" },
    itemB: { label: "Argentina", value: 46, valueLabel: "46m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Germany", value: 84, valueLabel: "84m" },
    itemB: { label: "United Kingdom", value: 68, valueLabel: "68m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Japan", value: 124, valueLabel: "124m" },
    itemB: { label: "Mexico", value: 129, valueLabel: "129m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Nigeria", value: 223, valueLabel: "223m" },
    itemB: { label: "Brazil", value: 216, valueLabel: "216m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "France", value: 68, valueLabel: "68m" },
    itemB: { label: "Italy", value: 59, valueLabel: "59m" },
  },
  {
    caption: "Which country covers more land?",
    metricLabel: "Area",
    itemA: { label: "Russia", value: 17_098_242, valueLabel: "17.1m km²" },
    itemB: { label: "Canada", value: 9_984_670, valueLabel: "9.98m km²" },
  },
  {
    caption: "Which country covers more land?",
    metricLabel: "Area",
    itemA: { label: "Australia", value: 7_692_024, valueLabel: "7.69m km²" },
    itemB: { label: "India", value: 3_287_263, valueLabel: "3.29m km²" },
  },
  {
    caption: "Which country covers more land?",
    metricLabel: "Area",
    itemA: { label: "Argentina", value: 2_780_400, valueLabel: "2.78m km²" },
    itemB: { label: "Saudi Arabia", value: 2_149_690, valueLabel: "2.15m km²" },
  },
  {
    caption: "Who was born first?",
    metricLabel: "Year of birth (lower = earlier)",
    itemA: { label: "Leonardo da Vinci", value: 1452, valueLabel: "1452" },
    itemB: { label: "Galileo Galilei", value: 1564, valueLabel: "1564" },
  },
  {
    caption: "Who was born first?",
    metricLabel: "Year of birth (lower = earlier)",
    itemA: { label: "Isaac Newton", value: 1643, valueLabel: "1643" },
    itemB: { label: "Albert Einstein", value: 1879, valueLabel: "1879" },
  },
  {
    caption: "Who was born first?",
    metricLabel: "Year of birth (lower = earlier)",
    itemA: { label: "Mozart", value: 1756, valueLabel: "1756" },
    itemB: { label: "Beethoven", value: 1770, valueLabel: "1770" },
  },
  {
    caption: "Who was born first?",
    metricLabel: "Year of birth (lower = earlier)",
    itemA: { label: "Napoleon Bonaparte", value: 1769, valueLabel: "1769" },
    itemB: { label: "Abraham Lincoln", value: 1809, valueLabel: "1809" },
  },
  {
    caption: "Who was born first?",
    metricLabel: "Year of birth (lower = earlier)",
    itemA: { label: "Charles Darwin", value: 1809, valueLabel: "1809" },
    itemB: { label: "Karl Marx", value: 1818, valueLabel: "1818" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Box office",
    itemA: { label: "Avatar (2009)", value: 2923, valueLabel: "$2.92b" },
    itemB: { label: "Avengers: Endgame", value: 2799, valueLabel: "$2.80b" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Box office",
    itemA: { label: "Titanic", value: 2257, valueLabel: "$2.26b" },
    itemB: { label: "The Lion King (2019)", value: 1657, valueLabel: "$1.66b" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Box office",
    itemA: { label: "Jurassic World", value: 1672, valueLabel: "$1.67b" },
    itemB: { label: "Frozen II", value: 1453, valueLabel: "$1.45b" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Box office",
    itemA: { label: "Barbie (2023)", value: 1446, valueLabel: "$1.45b" },
    itemB: { label: "Oppenheimer", value: 976, valueLabel: "$976m" },
  },
  {
    caption: "Which film is longer?",
    metricLabel: "Runtime",
    itemA: { label: "The Godfather", value: 175, valueLabel: "175 min" },
    itemB: { label: "Pulp Fiction", value: 154, valueLabel: "154 min" },
  },
  {
    caption: "Which film is longer?",
    metricLabel: "Runtime",
    itemA: { label: "Avengers: Endgame", value: 181, valueLabel: "181 min" },
    itemB: { label: "Oppenheimer", value: 180, valueLabel: "180 min" },
  },
  {
    caption: "Which film is longer?",
    metricLabel: "Runtime",
    itemA: { label: "Lawrence of Arabia", value: 228, valueLabel: "228 min" },
    itemB: { label: "Titanic", value: 195, valueLabel: "195 min" },
  },
  {
    caption: "Which mountain is taller?",
    metricLabel: "Height",
    itemA: { label: "Mount Everest", value: 8849, valueLabel: "8,849 m" },
    itemB: { label: "K2", value: 8611, valueLabel: "8,611 m" },
  },
  {
    caption: "Which mountain is taller?",
    metricLabel: "Height",
    itemA: { label: "Denali", value: 6190, valueLabel: "6,190 m" },
    itemB: { label: "Mont Blanc", value: 4808, valueLabel: "4,808 m" },
  },
  {
    caption: "Which mountain is taller?",
    metricLabel: "Height",
    itemA: { label: "Mount Kilimanjaro", value: 5895, valueLabel: "5,895 m" },
    itemB: { label: "Matterhorn", value: 4478, valueLabel: "4,478 m" },
  },
  {
    caption: "Which mountain is taller?",
    metricLabel: "Height",
    itemA: { label: "Aconcagua", value: 6961, valueLabel: "6,961 m" },
    itemB: { label: "Mount Fuji", value: 3776, valueLabel: "3,776 m" },
  },
  {
    caption: "Which building is taller?",
    metricLabel: "Height",
    itemA: { label: "Burj Khalifa", value: 828, valueLabel: "828 m" },
    itemB: { label: "Shanghai Tower", value: 632, valueLabel: "632 m" },
  },
  {
    caption: "Which building is taller?",
    metricLabel: "Height",
    itemA: { label: "Empire State Building", value: 381, valueLabel: "381 m" },
    itemB: { label: "The Shard (London)", value: 310, valueLabel: "310 m" },
  },
  {
    caption: "Which building is taller?",
    metricLabel: "Height",
    itemA: { label: "One World Trade Center", value: 541, valueLabel: "541 m" },
    itemB: { label: "Eiffel Tower", value: 330, valueLabel: "330 m" },
  },
  {
    caption: "Which building is taller?",
    metricLabel: "Height",
    itemA: { label: "Petronas Towers", value: 452, valueLabel: "452 m" },
    itemB: { label: "Taipei 101", value: 508, valueLabel: "508 m" },
  },
  {
    caption: "Which artist has more Spotify monthly listeners?",
    metricLabel: "Monthly listeners",
    itemA: { label: "Taylor Swift", value: 100, valueLabel: "~100m" },
    itemB: { label: "The Weeknd", value: 110, valueLabel: "~110m" },
  },
  {
    caption: "Which artist has more Spotify monthly listeners?",
    metricLabel: "Monthly listeners",
    itemA: { label: "Drake", value: 78, valueLabel: "~78m" },
    itemB: { label: "Bad Bunny", value: 80, valueLabel: "~80m" },
  },
  {
    caption: "Which artist has more Spotify monthly listeners?",
    metricLabel: "Monthly listeners",
    itemA: { label: "Ariana Grande", value: 82, valueLabel: "~82m" },
    itemB: { label: "Billie Eilish", value: 75, valueLabel: "~75m" },
  },
];

(function assertNoEqual() {
  for (const e of ENTRIES) {
    if (e.itemA.value === e.itemB.value) {
      throw new Error(`Equal-value pair in HoL entries: ${e.itemA.label} vs ${e.itemB.label}`);
    }
  }
})();

function shuffleInPlace<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROUND_QUESTIONS = 30;

export function generateHoLQuestions(_level: number, seed: string): HoLQuestion[] {
  const rng = mulberry32(`${seed}::higher-lower`);
  const pool = shuffleInPlace([...ENTRIES], rng);
  const picked = pool.slice(0, Math.min(ROUND_QUESTIONS, pool.length));

  return picked.map((entry) => {
    const swap = rng() < 0.5;
    const left = swap ? entry.itemB : entry.itemA;
    const right = swap ? entry.itemA : entry.itemB;
    const answerIndex: 0 | 1 = right.value > left.value ? 1 : 0;
    return {
      caption: entry.caption,
      metricLabel: entry.metricLabel,
      left,
      right,
      answerIndex,
    };
  });
}
