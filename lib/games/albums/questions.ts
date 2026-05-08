import type { ImageMCQuestion } from "@/components/games/image-mc/PlayBoard";
import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

type AlbumEntry = {
  id: string;
  title: string;
  artist: string;
  imageSrc: string;
  decoys: string[];
};

const ALBUMS: AlbumEntry[] = [
  { id: "dark-side-of-the-moon", title: "The Dark Side of the Moon", artist: "Pink Floyd", imageSrc: "https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/The_Dark_Side_of_the_Moon_cover.svg/1920px-The_Dark_Side_of_the_Moon_cover.svg.png", decoys: ["Led Zeppelin", "The Who", "Deep Purple", "Yes", "Genesis", "King Crimson"] },
  { id: "abbey-road", title: "Abbey Road", artist: "The Beatles", imageSrc: "https://upload.wikimedia.org/wikipedia/commons/a/a4/The_Beatles_Abbey_Road_album_cover.jpg", decoys: ["The Rolling Stones", "The Kinks", "The Who", "The Beach Boys", "Cream", "The Doors"] },
  { id: "rumours", title: "Rumours", artist: "Fleetwood Mac", imageSrc: "https://upload.wikimedia.org/wikipedia/en/f/fb/FMacRumours.PNG", decoys: ["The Eagles", "Steely Dan", "Carole King", "Linda Ronstadt", "Joni Mitchell", "James Taylor"] },
  { id: "lemonade", title: "Lemonade", artist: "Beyoncé", imageSrc: "https://upload.wikimedia.org/wikipedia/en/5/53/Beyonce_-_Lemonade_%28Official_Album_Cover%29.png", decoys: ["Rihanna", "Alicia Keys", "Solange", "SZA", "Janelle Monáe", "Mariah Carey"] },
];

function shuffleInPlace<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROUND_QUESTIONS = 30;

export function generateAlbumsQuestions(_level: number, seed: string): ImageMCQuestion[] {
  const rng = mulberry32(`${seed}::albums`);
  const pool = shuffleInPlace([...ALBUMS], rng);
  const picked: AlbumEntry[] = [];
  for (let i = 0; i < ROUND_QUESTIONS; i++) {
    picked.push(pool[i % pool.length]);
  }

  return picked.map((album) => {
    const decoyPool = shuffleInPlace([...album.decoys], rng).slice(0, 3);
    const options = shuffleInPlace([album.artist, ...decoyPool], rng);
    const answerIndex = options.indexOf(album.artist);
    return {
      imageSrc: album.imageSrc,
      imageAlt: "Whose album?",
      caption: "Whose album?",
      options,
      answerIndex,
    };
  });
}
