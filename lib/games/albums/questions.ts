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
  { id: "atom-heart-mother", title: "Atom Heart Mother", artist: "Pink Floyd", imageSrc: "https://upload.wikimedia.org/wikipedia/en/2/2e/AtomHeartMotherCover.jpeg", decoys: ["Led Zeppelin", "The Who", "Yes", "King Crimson", "Genesis", "The Beatles"] },
  { id: "animals", title: "Animals", artist: "Pink Floyd", imageSrc: "https://upload.wikimedia.org/wikipedia/en/7/74/Pink_Floyd-Animals-Frontal.jpg", decoys: ["Led Zeppelin", "Yes", "Genesis", "Rush", "Black Sabbath", "Queen"] },
  { id: "meddle", title: "Meddle", artist: "Pink Floyd", imageSrc: "https://upload.wikimedia.org/wikipedia/en/d/d4/MeddleCover.jpeg", decoys: ["Led Zeppelin", "The Doors", "Cream", "Jefferson Airplane", "Deep Purple", "King Crimson"] },
  { id: "obscured-by-clouds", title: "Obscured by Clouds", artist: "Pink Floyd", imageSrc: "https://upload.wikimedia.org/wikipedia/en/e/ef/Pink_Floyd_-_Obscured_by_Clouds.jpg", decoys: ["Led Zeppelin", "King Crimson", "Yes", "Genesis", "Soft Machine", "Caravan"] },
  { id: "power-corruption-and-lies", title: "Power, Corruption & Lies", artist: "New Order", imageSrc: "https://upload.wikimedia.org/wikipedia/commons/4/4f/New_Order_-_Power%2C_Corruption_%26_Lies.png", decoys: ["The Cure", "Joy Division", "Depeche Mode", "The Smiths", "Echo & the Bunnymen", "Talking Heads"] },
  { id: "endtroducing", title: "Endtroducing.....", artist: "DJ Shadow", imageSrc: "https://upload.wikimedia.org/wikipedia/en/c/c1/Endtroducingcover.jpg", decoys: ["Massive Attack", "Portishead", "RJD2", "Cut Chemist", "Madlib", "J Dilla"] },
  { id: "wild-life", title: "Wild Life", artist: "Wings", imageSrc: "https://upload.wikimedia.org/wikipedia/en/e/e9/Wings%2C_Wild_Life_%281971%29.png", decoys: ["The Beatles", "The Rolling Stones", "The Kinks", "The Who", "Crosby, Stills & Nash", "Fleetwood Mac"] },
  { id: "larks-tongues-in-aspic", title: "Larks' Tongues in Aspic", artist: "King Crimson", imageSrc: "https://upload.wikimedia.org/wikipedia/en/4/4f/Larks_tongues_in_aspic_album_cover.jpg", decoys: ["Yes", "Genesis", "Pink Floyd", "Emerson, Lake & Palmer", "Van der Graaf Generator", "Gentle Giant"] },
  { id: "in-the-court-of-the-crimson-king", title: "In the Court of the Crimson King", artist: "King Crimson", imageSrc: "https://upload.wikimedia.org/wikipedia/en/8/84/In_the_Court_of_the_Crimson_King_-_40th_Anniversary_Box_Set_-_Front_cover.jpeg", decoys: ["Yes", "Genesis", "Pink Floyd", "Emerson, Lake & Palmer", "Jethro Tull", "The Moody Blues"] },
  { id: "unknown-pleasures", title: "Unknown Pleasures", artist: "Joy Division", imageSrc: "https://upload.wikimedia.org/wikipedia/en/5/5a/UnknownPleasuresVinyl.jpg", decoys: ["The Cure", "New Order", "Bauhaus", "Echo & the Bunnymen", "Siouxsie and the Banshees", "Public Image Ltd"] },
  { id: "blonde-on-blonde", title: "Blonde on Blonde", artist: "Bob Dylan", imageSrc: "https://upload.wikimedia.org/wikipedia/en/3/38/Bob_Dylan_-_Blonde_on_Blonde.jpg", decoys: ["Joni Mitchell", "Leonard Cohen", "Neil Young", "Van Morrison", "Donovan", "Simon & Garfunkel"] },
  { id: "raw-power", title: "Raw Power", artist: "Iggy and the Stooges", imageSrc: "https://upload.wikimedia.org/wikipedia/en/2/27/StoogesRawPower.jpg", decoys: ["MC5", "New York Dolls", "The Velvet Underground", "Television", "The Modern Lovers", "Patti Smith"] },
  { id: "agaetis-byrjun", title: "Ágætis byrjun", artist: "Sigur Rós", imageSrc: "https://upload.wikimedia.org/wikipedia/en/9/92/%C3%81g%C3%A6tisByrjunCover.JPG", decoys: ["Mogwai", "Explosions in the Sky", "Godspeed You! Black Emperor", "Múm", "Stars of the Lid", "This Will Destroy You"] },
  { id: "spiderland", title: "Spiderland", artist: "Slint", imageSrc: "https://upload.wikimedia.org/wikipedia/en/a/af/Slint_-_Spiderland_album_cover.png", decoys: ["Tortoise", "Mogwai", "Godspeed You! Black Emperor", "Don Caballero", "June of 44", "Shellac"] },
  { id: "neon-bible", title: "Neon Bible", artist: "Arcade Fire", imageSrc: "https://upload.wikimedia.org/wikipedia/en/d/de/Neon_Bible_%28Front_Cover%29.jpg", decoys: ["The National", "Vampire Weekend", "Modest Mouse", "Bon Iver", "The Decemberists", "Spoon"] },
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
