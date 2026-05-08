import type { ImageMCQuestion } from "@/components/games/image-mc/PlayBoard";
import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

type LogoEntry = {
  id: string;
  brand: string;
  decoys: string[];
};

const LOGOS: LogoEntry[] = [
  { id: "apple", brand: "Apple", decoys: ["Microsoft", "Samsung", "Google", "IBM", "Sony", "Dell"] },
  { id: "google", brand: "Google", decoys: ["Microsoft", "Apple", "Yahoo", "Bing", "Meta", "Amazon"] },
  { id: "meta", brand: "Meta", decoys: ["Twitter", "Snapchat", "Pinterest", "TikTok", "LinkedIn", "Reddit"] },
  { id: "netflix", brand: "Netflix", decoys: ["Hulu", "Disney+", "HBO Max", "Prime Video", "Apple TV+", "Paramount+"] },
  { id: "spotify", brand: "Spotify", decoys: ["Apple Music", "SoundCloud", "Tidal", "Deezer", "Pandora", "YouTube Music"] },
  { id: "nike", brand: "Nike", decoys: ["Adidas", "Puma", "Reebok", "Under Armour", "New Balance", "Asics"] },
  { id: "adidas", brand: "Adidas", decoys: ["Nike", "Puma", "Reebok", "Fila", "Champion", "Lacoste"] },
  { id: "coca-cola", brand: "Coca-Cola", decoys: ["Pepsi", "Dr Pepper", "Fanta", "Sprite", "Mountain Dew", "7 Up"] },
  { id: "mcdonalds", brand: "McDonald's", decoys: ["Burger King", "Wendy's", "KFC", "Taco Bell", "Subway", "Five Guys"] },
  { id: "starbucks", brand: "Starbucks", decoys: ["Costa Coffee", "Dunkin'", "Pret a Manger", "Caffè Nero", "Tim Hortons", "Peet's Coffee"] },
  { id: "ferrari", brand: "Ferrari", decoys: ["Lamborghini", "Maserati", "Porsche", "Aston Martin", "McLaren", "Bugatti"] },
  { id: "lamborghini", brand: "Lamborghini", decoys: ["Ferrari", "Maserati", "Porsche", "Bugatti", "McLaren", "Pagani"] },
  { id: "bmw", brand: "BMW", decoys: ["Mercedes-Benz", "Audi", "Volkswagen", "Porsche", "Lexus", "Volvo"] },
  { id: "tesla", brand: "Tesla", decoys: ["Rivian", "Lucid", "Polestar", "BMW", "Mercedes-Benz", "Toyota"] },
];

function imageFor(id: string): string {
  return `/logos/${id}.svg`;
}

function shuffleInPlace<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROUND_QUESTIONS = 30;

export function generateLogosQuestions(_level: number, seed: string): ImageMCQuestion[] {
  const rng = mulberry32(`${seed}::logos`);
  const pool = shuffleInPlace([...LOGOS], rng);
  const picked: LogoEntry[] = [];
  for (let i = 0; i < ROUND_QUESTIONS; i++) {
    picked.push(pool[i % pool.length]);
  }

  return picked.map((logo) => {
    const decoyPool = shuffleInPlace([...logo.decoys], rng).slice(0, 3);
    const options = shuffleInPlace([logo.brand, ...decoyPool], rng);
    const answerIndex = options.indexOf(logo.brand);
    return {
      imageSrc: imageFor(logo.id),
      imageAlt: "Which brand?",
      caption: "Which brand?",
      options,
      answerIndex,
    };
  });
}
