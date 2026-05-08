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
  { id: "lemonade", title: "Lemonade", artist: "Beyoncé", imageSrc: "https://upload.wikimedia.org/wikipedia/en/5/53/Beyonce_-_Lemonade_%28Official_Album_Cover%29.png", decoys: ["Rihanna", "Alicia Keys", "Solange", "SZA", "Janelle Monáe", "Mariah Carey"] },
  { id: "the-wall", title: "The Wall", artist: "Pink Floyd", imageSrc: "https://upload.wikimedia.org/wikipedia/en/1/13/PinkFloydWallCoverOriginalNoText.jpg", decoys: ["Led Zeppelin", "The Who", "Genesis", "Yes", "Rush", "King Crimson"] },
  { id: "wish-you-were-here", title: "Wish You Were Here", artist: "Pink Floyd", imageSrc: "https://upload.wikimedia.org/wikipedia/en/a/a4/Pink_Floyd%2C_Wish_You_Were_Here_%281975%29.png", decoys: ["Yes", "Genesis", "Emerson, Lake & Palmer", "Jethro Tull", "King Crimson", "Camel"] },
  { id: "led-zeppelin-iv", title: "Led Zeppelin IV", artist: "Led Zeppelin", imageSrc: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Zeppelin_IV.jpg", decoys: ["Deep Purple", "Black Sabbath", "The Rolling Stones", "The Who", "Free", "Bad Company"] },
  { id: "houses-of-the-holy", title: "Houses of the Holy", artist: "Led Zeppelin", imageSrc: "https://upload.wikimedia.org/wikipedia/en/9/9f/Led_Zeppelin_-_Houses_of_the_Holy.jpg", decoys: ["Yes", "Pink Floyd", "Deep Purple", "Black Sabbath", "Queen", "The Doors"] },
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
