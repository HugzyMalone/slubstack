import type { ImageMCQuestion } from "@/components/games/image-mc/PlayBoard";
import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

type PosterEntry = {
  id: string;
  title: string;
  year: number;
  imageSrc: string;
  decoys: string[];
};

const POSTERS: PosterEntry[] = [
  { id: "godfather", title: "The Godfather", year: 1972, imageSrc: "https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg", decoys: ["Chinatown", "The French Connection", "Dirty Harry", "Serpico", "Mean Streets", "Patton"] },
  { id: "jaws", title: "Jaws", year: 1975, imageSrc: "https://upload.wikimedia.org/wikipedia/commons/4/40/Jaws_movie_poster.jpg", decoys: ["Star Wars", "Rocky", "Taxi Driver", "All the President's Men", "Carrie", "The Omen"] },
  { id: "star-wars", title: "Star Wars", year: 1977, imageSrc: "https://upload.wikimedia.org/wikipedia/en/8/87/StarWarsMoviePoster1977.jpg", decoys: ["Close Encounters of the Third Kind", "Alien", "Saturday Night Fever", "Annie Hall", "Superman", "The Black Hole"] },
  { id: "alien", title: "Alien", year: 1979, imageSrc: "https://upload.wikimedia.org/wikipedia/en/c/c3/Alien_movie_poster.jpg", decoys: ["Star Wars", "The Thing", "Blade Runner", "Mad Max", "Apocalypse Now", "Outland"] },
  { id: "blade-runner", title: "Blade Runner", year: 1982, imageSrc: "https://upload.wikimedia.org/wikipedia/en/9/9f/Blade_Runner_%281982_poster%29.png", decoys: ["E.T.", "Tron", "The Thing", "Star Trek II", "Conan the Barbarian", "Total Recall"] },
  { id: "back-to-the-future", title: "Back to the Future", year: 1985, imageSrc: "https://upload.wikimedia.org/wikipedia/en/d/d2/Back_to_the_Future.jpg", decoys: ["The Goonies", "Ferris Bueller's Day Off", "Weird Science", "Top Gun", "Rocky IV", "Commando"] },
  { id: "die-hard", title: "Die Hard", year: 1988, imageSrc: "https://upload.wikimedia.org/wikipedia/en/c/ca/Die_Hard_%281988_film%29_poster.jpg", decoys: ["Lethal Weapon", "Predator", "RoboCop", "Rambo III", "Beverly Hills Cop II", "The Running Man"] },
  { id: "goodfellas", title: "Goodfellas", year: 1990, imageSrc: "https://upload.wikimedia.org/wikipedia/en/7/7b/Goodfellas.jpg", decoys: ["Casino", "The Untouchables", "Carlito's Way", "Donnie Brasco", "A Bronx Tale", "Once Upon a Time in America"] },
  { id: "silence-of-the-lambs", title: "The Silence of the Lambs", year: 1991, imageSrc: "https://upload.wikimedia.org/wikipedia/en/8/86/The_Silence_of_the_Lambs_poster.jpg", decoys: ["Cape Fear", "Basic Instinct", "Sleeping with the Enemy", "Misery", "Seven", "The Fugitive"] },
  { id: "pulp-fiction", title: "Pulp Fiction", year: 1994, imageSrc: "https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg", decoys: ["Reservoir Dogs", "True Romance", "Heat", "The Usual Suspects", "Natural Born Killers", "Jackie Brown"] },
  { id: "shawshank", title: "The Shawshank Redemption", year: 1994, imageSrc: "https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg", decoys: ["Forrest Gump", "Pulp Fiction", "The Green Mile", "Quiz Show", "Legends of the Fall", "Nobody's Fool"] },
  { id: "titanic", title: "Titanic", year: 1997, imageSrc: "https://upload.wikimedia.org/wikipedia/en/1/18/Titanic_%281997_film%29_poster.png", decoys: ["Saving Private Ryan", "Good Will Hunting", "L.A. Confidential", "The English Patient", "As Good as It Gets", "Air Force One"] },
  { id: "matrix", title: "The Matrix", year: 1999, imageSrc: "https://upload.wikimedia.org/wikipedia/en/d/db/The_Matrix.png", decoys: ["Fight Club", "The Sixth Sense", "American Beauty", "Eyes Wide Shut", "Existenz", "Dark City"] },
  { id: "gladiator", title: "Gladiator", year: 2000, imageSrc: "https://upload.wikimedia.org/wikipedia/en/f/fb/Gladiator_%282000_film_poster%29.png", decoys: ["Troy", "Braveheart", "Kingdom of Heaven", "300", "The Last Samurai", "Alexander"] },
  { id: "lotr-fellowship", title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, imageSrc: "https://upload.wikimedia.org/wikipedia/en/f/fb/Lord_Rings_Fellowship_Ring.jpg", decoys: ["Harry Potter and the Philosopher's Stone", "Shrek", "The Mummy Returns", "A Beautiful Mind", "Black Hawk Down", "Monsters, Inc."] },
  { id: "dark-knight", title: "The Dark Knight", year: 2008, imageSrc: "https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg", decoys: ["Iron Man", "Watchmen", "The Wrestler", "Wall-E", "Tropic Thunder", "Quantum of Solace"] },
  { id: "inception", title: "Inception", year: 2010, imageSrc: "https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg", decoys: ["Shutter Island", "The Social Network", "Black Swan", "Toy Story 3", "True Grit", "Source Code"] },
  { id: "mad-max-fury-road", title: "Mad Max: Fury Road", year: 2015, imageSrc: "https://upload.wikimedia.org/wikipedia/en/6/6e/Mad_Max_Fury_Road.jpg", decoys: ["The Revenant", "Sicario", "Spectre", "Jurassic World", "Ex Machina", "The Martian"] },
  { id: "parasite", title: "Parasite", year: 2019, imageSrc: "https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png", decoys: ["Joker", "Once Upon a Time in Hollywood", "Knives Out", "1917", "The Irishman", "Marriage Story"] },
  { id: "everything-everywhere", title: "Everything Everywhere All at Once", year: 2022, imageSrc: "https://upload.wikimedia.org/wikipedia/en/1/1e/Everything_Everywhere_All_at_Once.jpg", decoys: ["The Banshees of Inisherin", "Tár", "The Whale", "Top Gun: Maverick", "Triangle of Sadness", "Avatar: The Way of Water"] },
];

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
      imageSrc: movie.imageSrc,
      imageAlt: "Which movie?",
      caption: "Which movie?",
      options,
      answerIndex,
    };
  });
}
