import type { ImageMCQuestion } from "@/components/games/image-mc/PlayBoard";
import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

type FlagEntry = {
  iso2: string;
  name: string;
  decoys: string[];
};

const FLAGS: FlagEntry[] = [
  { iso2: "fr", name: "France", decoys: ["Italy", "Netherlands", "Belgium", "Germany", "Spain", "Luxembourg"] },
  { iso2: "de", name: "Germany", decoys: ["Belgium", "Austria", "Netherlands", "Poland", "France", "Switzerland"] },
  { iso2: "it", name: "Italy", decoys: ["Mexico", "Ireland", "France", "Hungary", "Spain", "Bulgaria"] },
  { iso2: "es", name: "Spain", decoys: ["Portugal", "Italy", "France", "Andorra", "Colombia", "Romania"] },
  { iso2: "gb", name: "United Kingdom", decoys: ["Australia", "New Zealand", "Norway", "Iceland", "Ireland", "Fiji"] },
  { iso2: "jp", name: "Japan", decoys: ["South Korea", "Bangladesh", "Palau", "China", "Vietnam", "Laos"] },
  { iso2: "br", name: "Brazil", decoys: ["Argentina", "Uruguay", "Colombia", "Mexico", "Peru", "Venezuela"] },
  { iso2: "ar", name: "Argentina", decoys: ["Uruguay", "Honduras", "Guatemala", "Brazil", "Chile", "Greece"] },
  { iso2: "ca", name: "Canada", decoys: ["Peru", "Tonga", "Lebanon", "Latvia", "Denmark", "Austria"] },
  { iso2: "us", name: "United States", decoys: ["Liberia", "Malaysia", "Chile", "Cuba", "Puerto Rico", "Greece"] },
  { iso2: "in", name: "India", decoys: ["Niger", "Ireland", "Ivory Coast", "Italy", "Mexico", "Hungary"] },
  { iso2: "cn", name: "China", decoys: ["Vietnam", "North Korea", "Morocco", "Turkey", "Indonesia", "Singapore"] },
  { iso2: "au", name: "Australia", decoys: ["New Zealand", "Tuvalu", "Cook Islands", "Fiji", "United Kingdom", "Samoa"] },
  { iso2: "nz", name: "New Zealand", decoys: ["Australia", "Cook Islands", "Tuvalu", "Fiji", "United Kingdom", "Samoa"] },
  { iso2: "za", name: "South Africa", decoys: ["Mozambique", "Zimbabwe", "Namibia", "Lesotho", "Botswana", "Angola"] },
  { iso2: "tr", name: "Turkey", decoys: ["Tunisia", "Morocco", "Algeria", "Azerbaijan", "Kyrgyzstan", "Pakistan"] },
  { iso2: "se", name: "Sweden", decoys: ["Finland", "Norway", "Denmark", "Iceland", "Ukraine", "Estonia"] },
  { iso2: "no", name: "Norway", decoys: ["Iceland", "Denmark", "Sweden", "Finland", "Faroe Islands", "Slovakia"] },
  { iso2: "ch", name: "Switzerland", decoys: ["Austria", "Tonga", "Denmark", "Latvia", "Georgia", "Liechtenstein"] },
  { iso2: "kr", name: "South Korea", decoys: ["Japan", "North Korea", "Mongolia", "Vietnam", "Thailand", "Taiwan"] },
];

function imageFor(iso2: string): string {
  return `/flags/${iso2}.svg`;
}

function shuffleInPlace<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROUND_QUESTIONS = 30;

export function generateFlagBlitzQuestions(_level: number, seed: string): ImageMCQuestion[] {
  const rng = mulberry32(`${seed}::flags`);
  const pool = shuffleInPlace([...FLAGS], rng);
  const picked: FlagEntry[] = [];
  for (let i = 0; i < ROUND_QUESTIONS; i++) {
    picked.push(pool[i % pool.length]);
  }

  return picked.map((flag) => {
    const decoyPool = shuffleInPlace([...flag.decoys], rng).slice(0, 3);
    const options = shuffleInPlace([flag.name, ...decoyPool], rng);
    const answerIndex = options.indexOf(flag.name);
    return {
      imageSrc: imageFor(flag.iso2),
      imageAlt: "Which country?",
      caption: "Which country?",
      options,
      answerIndex,
    };
  });
}
