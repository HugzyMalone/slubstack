import type { ImageMCQuestion } from "@/components/games/image-mc/PlayBoard";
import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

type AlbumEntry = {
  id: string;
  title: string;
  artist: string;
  decoys: string[];
};

const ALBUMS: AlbumEntry[] = [
  { id: "dark-side-of-the-moon", title: "The Dark Side of the Moon", artist: "Pink Floyd", decoys: ["Led Zeppelin", "The Who", "Deep Purple", "Yes", "Genesis", "King Crimson"] },
  { id: "abbey-road", title: "Abbey Road", artist: "The Beatles", decoys: ["The Rolling Stones", "The Kinks", "The Who", "The Beach Boys", "Cream", "The Doors"] },
  { id: "thriller", title: "Thriller", artist: "Michael Jackson", decoys: ["Prince", "Lionel Richie", "Stevie Wonder", "Marvin Gaye", "Whitney Houston", "George Michael"] },
  { id: "back-in-black", title: "Back in Black", artist: "AC/DC", decoys: ["Led Zeppelin", "Aerosmith", "Guns N' Roses", "Iron Maiden", "Metallica", "Van Halen"] },
  { id: "rumours", title: "Rumours", artist: "Fleetwood Mac", decoys: ["The Eagles", "Steely Dan", "Carole King", "Linda Ronstadt", "Joni Mitchell", "James Taylor"] },
  { id: "nevermind", title: "Nevermind", artist: "Nirvana", decoys: ["Pearl Jam", "Soundgarden", "Alice in Chains", "Stone Temple Pilots", "Smashing Pumpkins", "Foo Fighters"] },
  { id: "ok-computer", title: "OK Computer", artist: "Radiohead", decoys: ["Blur", "Oasis", "The Verve", "Pulp", "Coldplay", "Muse"] },
  { id: "the-chronic", title: "The Chronic", artist: "Dr. Dre", decoys: ["Snoop Dogg", "Ice Cube", "Tupac", "N.W.A.", "Warren G", "Eazy-E"] },
  { id: "illmatic", title: "Illmatic", artist: "Nas", decoys: ["The Notorious B.I.G.", "Jay-Z", "Mobb Deep", "Wu-Tang Clan", "Big L", "Rakim"] },
  { id: "ready-to-die", title: "Ready to Die", artist: "The Notorious B.I.G.", decoys: ["Nas", "Jay-Z", "Tupac", "Mobb Deep", "Wu-Tang Clan", "Method Man"] },
  { id: "to-pimp-a-butterfly", title: "To Pimp a Butterfly", artist: "Kendrick Lamar", decoys: ["J. Cole", "Drake", "Kanye West", "Childish Gambino", "Frank Ocean", "Tyler, The Creator"] },
  { id: "lemonade", title: "Lemonade", artist: "Beyoncé", decoys: ["Rihanna", "Alicia Keys", "Solange", "SZA", "Janelle Monáe", "Mariah Carey"] },
  { id: "21", title: "21", artist: "Adele", decoys: ["Sam Smith", "Amy Winehouse", "Duffy", "Florence + The Machine", "Lana Del Rey", "Norah Jones"] },
  { id: "1989", title: "1989", artist: "Taylor Swift", decoys: ["Katy Perry", "Lorde", "Lana Del Rey", "Sia", "Halsey", "Selena Gomez"] },
  { id: "discovery", title: "Discovery", artist: "Daft Punk", decoys: ["Justice", "The Chemical Brothers", "Air", "Cassius", "Stardust", "M83"] },
  { id: "homework", title: "Homework", artist: "Daft Punk", decoys: ["The Prodigy", "Underworld", "Fatboy Slim", "The Chemical Brothers", "Basement Jaxx", "Massive Attack"] },
  { id: "random-access-memories", title: "Random Access Memories", artist: "Daft Punk", decoys: ["Justice", "Phoenix", "M83", "LCD Soundsystem", "Air", "Hot Chip"] },
  { id: "four-seasons", title: "The Four Seasons", artist: "Vivaldi", decoys: ["Bach", "Handel", "Mozart", "Telemann", "Corelli", "Albinoni"] },
  { id: "ninth-symphony", title: "Symphony No. 9", artist: "Beethoven", decoys: ["Mozart", "Schubert", "Brahms", "Mendelssohn", "Haydn", "Mahler"] },
  { id: "kind-of-blue", title: "Kind of Blue", artist: "Miles Davis", decoys: ["John Coltrane", "Charles Mingus", "Bill Evans", "Thelonious Monk", "Dave Brubeck", "Ornette Coleman"] },
];

function imageFor(id: string): string {
  return `/albums/${id}.svg`;
}

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
      imageSrc: imageFor(album.id),
      imageAlt: "Whose album?",
      caption: "Whose album?",
      options,
      answerIndex,
    };
  });
}
