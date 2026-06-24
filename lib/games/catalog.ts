export type GameCatalogEntry = {
  slug: string;
  name: string;
  playHref: string;
  accent: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  how: string[];
};

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://slubstack.com";

export const GAME_CATALOG: GameCatalogEntry[] = [
  {
    slug: "wordle",
    name: "Wordle",
    playHref: "/brain-training/wordle",
    accent: "#6aaa64",
    seoTitle: "Free Wordle Alternative — Daily Word Game | Slubstack",
    seoDescription:
      "Play a free daily Wordle alternative. Six guesses to crack the five-letter word, keep your streak alive and share your grid. No sign-up needed.",
    intro:
      "A fresh five-letter word every day, six guesses to find it. Green means right spot, yellow means right letter wrong spot. Build a daily streak and share your grid with friends.",
    how: [
      "Type any five-letter word and submit your guess.",
      "Tiles flip to show how close each letter is.",
      "Solve it in six tries to keep your streak going.",
    ],
  },
  {
    slug: "connections",
    name: "Connections",
    playHref: "/brain-training/connections",
    accent: "#9b59d0",
    seoTitle: "Connections Game — Free Daily Word Grouping Puzzle | Slubstack",
    seoDescription:
      "A free daily Connections puzzle. Sort sixteen words into four hidden groups of four. Spot the link, beat the trap words and finish with four lives.",
    intro:
      "Sixteen words, four hidden groups. Work out which words belong together and clear all four sets before you run out of guesses. The overlaps are there to catch you out.",
    how: [
      "Pick four words you think share a theme.",
      "Submit the group to check if you are right.",
      "Find all four groups with no more than four mistakes.",
    ],
  },
  {
    slug: "semantle",
    name: "Semantle",
    playHref: "/brain-training/semantle",
    accent: "#8b5cf6",
    seoTitle: "Semantle — Free Daily Word Meaning Guessing Game | Slubstack",
    seoDescription:
      "Play a free daily Semantle puzzle. Guess the secret word by meaning, not spelling. Each guess scores how close you are. Warmer or colder until you crack it.",
    intro:
      "Guess the secret word by meaning rather than letters. Every guess comes back with a closeness score, so you home in on the answer one association at a time. There is no limit on guesses, only on patience.",
    how: [
      "Type any word and submit it.",
      "Read the similarity score to see how close you are.",
      "Follow the warmer guesses until you land the word.",
    ],
  },
  {
    slug: "math-blitz",
    name: "Math Blitz",
    playHref: "/brain-training/math-blitz",
    accent: "#10b981",
    seoTitle: "Math Blitz — Free Daily Mental Maths Game | Slubstack",
    seoDescription:
      "A fast free maths game: solve as many sums as you can in thirty seconds. Sharpen mental arithmetic, beat your best and climb the daily leaderboard.",
    intro:
      "Thirty seconds on the clock and a stream of quick sums. Answer as many as you can before time runs out, then try to beat your own best. Good for a daily mental warm-up.",
    how: [
      "Start the round and read the first sum.",
      "Tap or type the answer as fast as you can.",
      "Rack up correct answers before the timer hits zero.",
    ],
  },
  {
    slug: "actor-blitz",
    name: "Actor Blitz",
    playHref: "/trivia/actors",
    accent: "#a21caf",
    seoTitle: "Actor Blitz — Guess the Movie Star Trivia Game | Slubstack",
    seoDescription:
      "Guess the actor from their photo in this fast film trivia game. Play solo or live against friends, thirty seconds a round. Free, no sign-up.",
    intro:
      "A photo of a film star appears and the clock starts. Name them before the timer runs down, round after round. Play on your own or go head to head with friends live.",
    how: [
      "Look at the actor's photo on screen.",
      "Type the name before the thirty seconds are up.",
      "Score on speed and accuracy across the rounds.",
    ],
  },
  {
    slug: "wikirace",
    name: "Wikirace",
    playHref: "/games/wiki-race",
    accent: "#6366f1",
    seoTitle: "Wikirace — Wikipedia Link Racing Game | Slubstack",
    seoDescription:
      "Race from one Wikipedia article to another using only links, in the fewest clicks. A free browser game of lateral thinking. Play solo or challenge friends.",
    intro:
      "Start on one Wikipedia article and reach the target using nothing but the links on each page. Fewest clicks wins. It rewards lateral thinking and a feel for how knowledge connects.",
    how: [
      "See your start article and your target.",
      "Click through links to navigate Wikipedia.",
      "Reach the target in as few clicks as possible.",
    ],
  },
  {
    slug: "sperm-race",
    name: "Sperm Race",
    playHref: "/games/sperm-race",
    accent: "#22c55e",
    seoTitle: "Sperm Race — Multiplayer Tap Racing Party Game | Slubstack",
    seoDescription:
      "A four-player tap-racing party game. Join a private room by code and hammer A and B to reach the egg first. Free, quick and silly. Play with friends.",
    intro:
      "A daft four-player tap race. Join a private room with a short code, then alternate A and B as fast as you can to power your way to the egg. Best played with friends in the same room.",
    how: [
      "Create or join a room with a four-character code.",
      "Wait for everyone, then start the race.",
      "Alternate A and B to sprint ahead of the pack.",
    ],
  },
  {
    slug: "draw-my-thing",
    name: "Draw My Thing",
    playHref: "/games/draw",
    accent: "#ec4899",
    seoTitle: "Draw My Thing — Free Online Pictionary Game | Slubstack",
    seoDescription:
      "Free multiplayer Pictionary online. One player draws, everyone else races to guess. Invite friends with a four-character room code. No sign-up needed.",
    intro:
      "Online Pictionary with your friends. One person draws a secret word while everyone else races to guess it in the chat. Spin up a room, share the code and take turns at the canvas.",
    how: [
      "Create a room and share the four-character code.",
      "Take turns drawing the secret word.",
      "Guess what everyone else is drawing to score points.",
    ],
  },
];

export function getGameBySlug(slug: string): GameCatalogEntry | undefined {
  return GAME_CATALOG.find((g) => g.slug === slug);
}
