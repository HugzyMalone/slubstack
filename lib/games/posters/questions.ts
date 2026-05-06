import type { ImageMCQuestion } from "@/components/games/image-mc/PlayBoard";
import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

type PosterEntry = {
  id: string;
  title: string;
  year: number;
  decoys: string[];
};

const POSTERS: PosterEntry[] = [
  { id: "godfather", title: "The Godfather", year: 1972, decoys: ["Chinatown", "The French Connection", "Dirty Harry", "Serpico", "Mean Streets", "Patton"] },
  { id: "jaws", title: "Jaws", year: 1975, decoys: ["Star Wars", "Rocky", "Taxi Driver", "All the President's Men", "Carrie", "The Omen"] },
  { id: "star-wars", title: "Star Wars", year: 1977, decoys: ["Close Encounters of the Third Kind", "Alien", "Saturday Night Fever", "Annie Hall", "Superman", "The Black Hole"] },
  { id: "alien", title: "Alien", year: 1979, decoys: ["Star Wars", "The Thing", "Blade Runner", "Mad Max", "Apocalypse Now", "Outland"] },
  { id: "blade-runner", title: "Blade Runner", year: 1982, decoys: ["E.T.", "Tron", "The Thing", "Star Trek II", "Conan the Barbarian", "Total Recall"] },
  { id: "back-to-the-future", title: "Back to the Future", year: 1985, decoys: ["The Goonies", "Ferris Bueller's Day Off", "Weird Science", "Top Gun", "Rocky IV", "Commando"] },
  { id: "die-hard", title: "Die Hard", year: 1988, decoys: ["Lethal Weapon", "Predator", "RoboCop", "Rambo III", "Beverly Hills Cop II", "The Running Man"] },
  { id: "goodfellas", title: "Goodfellas", year: 1990, decoys: ["Casino", "The Untouchables", "Carlito's Way", "Donnie Brasco", "A Bronx Tale", "Once Upon a Time in America"] },
  { id: "silence-of-the-lambs", title: "The Silence of the Lambs", year: 1991, decoys: ["Cape Fear", "Basic Instinct", "Sleeping with the Enemy", "Misery", "Seven", "The Fugitive"] },
  { id: "pulp-fiction", title: "Pulp Fiction", year: 1994, decoys: ["Reservoir Dogs", "True Romance", "Heat", "The Usual Suspects", "Natural Born Killers", "Jackie Brown"] },
  { id: "shawshank", title: "The Shawshank Redemption", year: 1994, decoys: ["Forrest Gump", "Pulp Fiction", "The Green Mile", "Quiz Show", "Legends of the Fall", "Nobody's Fool"] },
  { id: "titanic", title: "Titanic", year: 1997, decoys: ["Saving Private Ryan", "Good Will Hunting", "L.A. Confidential", "The English Patient", "As Good as It Gets", "Air Force One"] },
  { id: "matrix", title: "The Matrix", year: 1999, decoys: ["Fight Club", "The Sixth Sense", "American Beauty", "Eyes Wide Shut", "Existenz", "Dark City"] },
  { id: "gladiator", title: "Gladiator", year: 2000, decoys: ["Troy", "Braveheart", "Kingdom of Heaven", "300", "The Last Samurai", "Alexander"] },
  { id: "lotr-fellowship", title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, decoys: ["Harry Potter and the Philosopher's Stone", "Shrek", "The Mummy Returns", "A Beautiful Mind", "Black Hawk Down", "Monsters, Inc."] },
  { id: "dark-knight", title: "The Dark Knight", year: 2008, decoys: ["Iron Man", "Watchmen", "The Wrestler", "Wall-E", "Tropic Thunder", "Quantum of Solace"] },
  { id: "inception", title: "Inception", year: 2010, decoys: ["Shutter Island", "The Social Network", "Black Swan", "Toy Story 3", "True Grit", "Source Code"] },
  { id: "mad-max-fury-road", title: "Mad Max: Fury Road", year: 2015, decoys: ["The Revenant", "Sicario", "Spectre", "Jurassic World", "Ex Machina", "The Martian"] },
  { id: "parasite", title: "Parasite", year: 2019, decoys: ["Joker", "Once Upon a Time in Hollywood", "Knives Out", "1917", "The Irishman", "Marriage Story"] },
  { id: "everything-everywhere", title: "Everything Everywhere All at Once", year: 2022, decoys: ["The Banshees of Inisherin", "Tár", "The Whale", "Top Gun: Maverick", "Triangle of Sadness", "Avatar: The Way of Water"] },
];

function imageFor(id: string): string {
  return `/posters/${id}.svg`;
}

function shuffleInPlace<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROUND_QUESTIONS = 30;

export function generatePostersQuestions(_level: number, seed: string): ImageMCQuestion[] {
  const rng = mulberry32(`${seed}::posters`);
  const pool = shuffleInPlace([...POSTERS], rng);
  const picked: PosterEntry[] = [];
  for (let i = 0; i < ROUND_QUESTIONS; i++) {
    picked.push(pool[i % pool.length]);
  }

  return picked.map((movie) => {
    const decoyPool = shuffleInPlace([...movie.decoys], rng).slice(0, 3);
    const options = shuffleInPlace([movie.title, ...decoyPool], rng);
    const answerIndex = options.indexOf(movie.title);
    return {
      imageSrc: imageFor(movie.id),
      imageAlt: "Which movie?",
      caption: "Which movie?",
      options,
      answerIndex,
    };
  });
}
