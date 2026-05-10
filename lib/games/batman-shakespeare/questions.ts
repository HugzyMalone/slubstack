import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

export type BatShakeSource = "batman" | "shakespeare";

export type BatShakeQuestion = {
  quote: string;
  answer: BatShakeSource;
  attribution: string;
};

const BATMAN_QUOTES: { quote: string; attribution: string }[] = [
  { quote: "It's not who I am underneath, but what I do that defines me.", attribution: "Batman, Batman Begins" },
  { quote: "Why do we fall? So we can learn to pick ourselves up.", attribution: "Thomas Wayne, Batman Begins" },
  { quote: "I am vengeance. I am the night. I am Batman.", attribution: "Batman, the animated series" },
  { quote: "You either die a hero or you live long enough to see yourself become the villain.", attribution: "Harvey Dent, The Dark Knight" },
  { quote: "Some men just want to watch the world burn.", attribution: "Alfred, The Dark Knight" },
  { quote: "If you're good at something, never do it for free.", attribution: "The Joker, The Dark Knight" },
  { quote: "Sometimes the truth isn't good enough. Sometimes people deserve more.", attribution: "Batman, The Dark Knight" },
  { quote: "It's not about money. It's about sending a message.", attribution: "The Joker, The Dark Knight" },
  { quote: "Endure. Master. That is what we must do.", attribution: "Alfred, The Dark Knight Rises" },
  { quote: "A hero can be anyone. Even a man doing something as simple and reassuring as putting a coat around a young boy's shoulders.", attribution: "Batman, The Dark Knight Rises" },
  { quote: "The night is darkest just before the dawn. And I promise you, the dawn is coming.", attribution: "Harvey Dent, The Dark Knight" },
  { quote: "Criminals, by nature, are a cowardly and superstitious lot.", attribution: "Batman, comics" },
  { quote: "I have one power. I never give up.", attribution: "Batman, comics" },
  { quote: "Madness, as you know, is like gravity. All it takes is a little push.", attribution: "The Joker, The Dark Knight" },
];

const SHAKESPEARE_QUOTES: { quote: string; attribution: string }[] = [
  { quote: "All the world's a stage, and all the men and women merely players.", attribution: "As You Like It" },
  { quote: "The lady doth protest too much, methinks.", attribution: "Hamlet" },
  { quote: "To be, or not to be: that is the question.", attribution: "Hamlet" },
  { quote: "Some are born great, some achieve greatness, and some have greatness thrust upon them.", attribution: "Twelfth Night" },
  { quote: "The course of true love never did run smooth.", attribution: "A Midsummer Night's Dream" },
  { quote: "Cowards die many times before their deaths; the valiant never taste of death but once.", attribution: "Julius Caesar" },
  { quote: "Brevity is the soul of wit.", attribution: "Hamlet" },
  { quote: "There is nothing either good or bad, but thinking makes it so.", attribution: "Hamlet" },
  { quote: "We know what we are, but know not what we may be.", attribution: "Hamlet" },
  { quote: "Nothing will come of nothing.", attribution: "King Lear" },
  { quote: "Love all, trust a few, do wrong to none.", attribution: "All's Well That Ends Well" },
  { quote: "Better three hours too soon than a minute too late.", attribution: "The Merry Wives of Windsor" },
  { quote: "Though she be but little, she is fierce.", attribution: "A Midsummer Night's Dream" },
  { quote: "What's done cannot be undone.", attribution: "Macbeth" },
];

const ALL_ENTRIES: BatShakeQuestion[] = [
  ...BATMAN_QUOTES.map((q) => ({ quote: q.quote, answer: "batman" as const, attribution: q.attribution })),
  ...SHAKESPEARE_QUOTES.map((q) => ({ quote: q.quote, answer: "shakespeare" as const, attribution: q.attribution })),
];

function shuffleInPlace<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROUND_QUESTIONS = 30;

export function generateBatmanShakespeareQuestions(_level: number, seed: string): BatShakeQuestion[] {
  const rng = mulberry32(`${seed}::batman-shakespeare`);
  const pool = shuffleInPlace([...ALL_ENTRIES], rng);
  return pool.slice(0, Math.min(ROUND_QUESTIONS, pool.length));
}
