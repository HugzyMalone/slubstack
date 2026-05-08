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
  { id: "thriller", title: "Thriller", artist: "Michael Jackson", imageSrc: "https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png", decoys: ["Prince", "Lionel Richie", "Stevie Wonder", "Marvin Gaye", "Whitney Houston", "George Michael"] },
  { id: "back-in-black", title: "Back in Black", artist: "AC/DC", imageSrc: "https://upload.wikimedia.org/wikipedia/commons/9/92/ACDC_Back_in_Black.png", decoys: ["Led Zeppelin", "Aerosmith", "Guns N' Roses", "Iron Maiden", "Metallica", "Van Halen"] },
  { id: "rumours", title: "Rumours", artist: "Fleetwood Mac", imageSrc: "https://upload.wikimedia.org/wikipedia/en/f/fb/FMacRumours.PNG", decoys: ["The Eagles", "Steely Dan", "Carole King", "Linda Ronstadt", "Joni Mitchell", "James Taylor"] },
  { id: "nevermind", title: "Nevermind", artist: "Nirvana", imageSrc: "https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg", decoys: ["Pearl Jam", "Soundgarden", "Alice in Chains", "Stone Temple Pilots", "Smashing Pumpkins", "Foo Fighters"] },
  { id: "ok-computer", title: "OK Computer", artist: "Radiohead", imageSrc: "https://upload.wikimedia.org/wikipedia/en/b/ba/Radioheadokcomputer.png", decoys: ["Blur", "Oasis", "The Verve", "Pulp", "Coldplay", "Muse"] },
  { id: "the-chronic", title: "The Chronic", artist: "Dr. Dre", imageSrc: "https://upload.wikimedia.org/wikipedia/en/1/19/Dr.DreTheChronic.jpg", decoys: ["Snoop Dogg", "Ice Cube", "Tupac", "N.W.A.", "Warren G", "Eazy-E"] },
  { id: "illmatic", title: "Illmatic", artist: "Nas", imageSrc: "https://upload.wikimedia.org/wikipedia/en/2/27/IllmaticNas.jpg", decoys: ["The Notorious B.I.G.", "Jay-Z", "Mobb Deep", "Wu-Tang Clan", "Big L", "Rakim"] },
  { id: "ready-to-die", title: "Ready to Die", artist: "The Notorious B.I.G.", imageSrc: "https://upload.wikimedia.org/wikipedia/en/9/97/Ready_To_Die.jpg", decoys: ["Nas", "Jay-Z", "Tupac", "Mobb Deep", "Wu-Tang Clan", "Method Man"] },
  { id: "to-pimp-a-butterfly", title: "To Pimp a Butterfly", artist: "Kendrick Lamar", imageSrc: "https://upload.wikimedia.org/wikipedia/en/f/f6/Kendrick_Lamar_-_To_Pimp_a_Butterfly.png", decoys: ["J. Cole", "Drake", "Kanye West", "Childish Gambino", "Frank Ocean", "Tyler, The Creator"] },
  { id: "lemonade", title: "Lemonade", artist: "Beyoncé", imageSrc: "https://upload.wikimedia.org/wikipedia/en/5/53/Beyonce_-_Lemonade_%28Official_Album_Cover%29.png", decoys: ["Rihanna", "Alicia Keys", "Solange", "SZA", "Janelle Monáe", "Mariah Carey"] },
  { id: "21", title: "21", artist: "Adele", imageSrc: "https://upload.wikimedia.org/wikipedia/en/1/1b/Adele_-_21.png", decoys: ["Sam Smith", "Amy Winehouse", "Duffy", "Florence + The Machine", "Lana Del Rey", "Norah Jones"] },
  { id: "1989", title: "1989", artist: "Taylor Swift", imageSrc: "https://upload.wikimedia.org/wikipedia/en/f/f6/Taylor_Swift_-_1989.png", decoys: ["Katy Perry", "Lorde", "Lana Del Rey", "Sia", "Halsey", "Selena Gomez"] },
  { id: "discovery", title: "Discovery", artist: "Daft Punk", imageSrc: "https://upload.wikimedia.org/wikipedia/en/2/27/Daft_Punk_-_Discovery.png", decoys: ["Justice", "The Chemical Brothers", "Air", "Cassius", "Stardust", "M83"] },
  { id: "homework", title: "Homework", artist: "Daft Punk", imageSrc: "https://upload.wikimedia.org/wikipedia/en/9/9c/Daftpunk-homework.jpg", decoys: ["The Prodigy", "Underworld", "Fatboy Slim", "The Chemical Brothers", "Basement Jaxx", "Massive Attack"] },
  { id: "random-access-memories", title: "Random Access Memories", artist: "Daft Punk", imageSrc: "https://upload.wikimedia.org/wikipedia/en/2/26/Daft_Punk_-_Random_Access_Memories.png", decoys: ["Justice", "Phoenix", "M83", "LCD Soundsystem", "Air", "Hot Chip"] },
  { id: "kind-of-blue", title: "Kind of Blue", artist: "Miles Davis", imageSrc: "https://upload.wikimedia.org/wikipedia/en/1/10/Miles_Davis_-_Kind_of_Blue_album_cover.jpg", decoys: ["John Coltrane", "Charles Mingus", "Bill Evans", "Thelonious Monk", "Dave Brubeck", "Ornette Coleman"] },
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
