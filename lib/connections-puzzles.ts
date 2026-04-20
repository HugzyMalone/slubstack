export type DifficultyColor = "yellow" | "green" | "blue" | "purple";

export interface ConnectionsCategory {
  name: string;
  color: DifficultyColor;
  words: [string, string, string, string];
}

export interface ConnectionsPuzzle {
  number: number;
  categories: [ConnectionsCategory, ConnectionsCategory, ConnectionsCategory, ConnectionsCategory];
}

// Seeded by day index from 2026-04-19
const EPOCH = "2026-04-19";

export function getDayIndex(): number {
  const now = new Date();
  const epoch = new Date(EPOCH);
  const diff = now.getTime() - epoch.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyPuzzle(): ConnectionsPuzzle {
  const idx = getDayIndex();
  return PUZZLES[idx % PUZZLES.length];
}

export function getPuzzleNumber(): number {
  return getDayIndex() + 1;
}

const PUZZLES: ConnectionsPuzzle[] = [
  {
    number: 1,
    categories: [
      { color: "yellow", name: "Things that can be 'rolling'", words: ["THUNDER", "HILLS", "STONE", "EYES"] },
      { color: "green", name: "Words before 'stone'", words: ["SAND", "KEY", "LIME", "COBBLE"] },
      { color: "blue", name: "Mick ___ (famous Micks)", words: ["JAGGER", "TYSON", "MOUSE", "FLEETWOOD"] },
      { color: "purple", name: "___ Mac", words: ["FLEETWOOD", "BIG", "RAIN", "CRACKER"] },
    ],
  },
  {
    number: 2,
    categories: [
      { color: "yellow", name: "Shades of blue", words: ["COBALT", "CERULEAN", "TEAL", "INDIGO"] },
      { color: "green", name: "Things with wings", words: ["BIRD", "PLANE", "ANGEL", "BUFFALO"] },
      { color: "blue", name: "___ bar", words: ["CROW", "CANDY", "HANDLE", "MINI"] },
      { color: "purple", name: "Anagram of a US president", words: ["NOBLE", "LINGO", "MACHO", "RIANT"] },
    ],
  },
  {
    number: 3,
    categories: [
      { color: "yellow", name: "Things you do in the morning", words: ["STRETCH", "BREW", "SCROLL", "SNOOZE"] },
      { color: "green", name: "___ press", words: ["BENCH", "GRAPE", "FLOWER", "TROUSER"] },
      { color: "blue", name: "Types of market", words: ["BEAR", "BULL", "FLEA", "STOCK"] },
      { color: "purple", name: "Words hidden inside 'THURSDAY'", words: ["THUD", "DRAY", "HURT", "RUTS"] },
    ],
  },
  {
    number: 4,
    categories: [
      { color: "yellow", name: "Words meaning 'brave'", words: ["BOLD", "PLUCKY", "DARING", "GUTSY"] },
      { color: "green", name: "___ pool", words: ["CAR", "DEAD", "SWIMMING", "ROCK"] },
      { color: "blue", name: "Things you can catch", words: ["COLD", "WAVE", "TRAIN", "FEELINGS"] },
      { color: "purple", name: "Famous Johns (last name hidden in clue)", words: ["LEMON", "TRAVOLTAGE", "CENA-ry", "LEGEND-ary"] },
    ],
  },
  {
    number: 5,
    categories: [
      { color: "yellow", name: "Kitchen appliances", words: ["TOASTER", "BLENDER", "JUICER", "STEAMER"] },
      { color: "green", name: "Things that are always running", words: ["NOSE", "TAP", "RIVER", "CLOCK"] },
      { color: "blue", name: "___ drop", words: ["RAIN", "TEAR", "NAME", "BACKDROP"] },
      { color: "purple", name: "Homophones of numbers", words: ["FORE", "ATE", "TOO", "WON"] },
    ],
  },
  {
    number: 6,
    categories: [
      { color: "yellow", name: "Types of cheese", words: ["BRIE", "GOUDA", "HAVARTI", "MANCHEGO"] },
      { color: "green", name: "Things that bounce", words: ["CHECK", "BALL", "SIGNAL", "CASTLE"] },
      { color: "blue", name: "___ light", words: ["SPOT", "FLASH", "MOON", "STAR"] },
      { color: "purple", name: "Words that become new words backwards", words: ["PART", "DRAW", "STOP", "LIVE"] },
    ],
  },
  {
    number: 7,
    categories: [
      { color: "yellow", name: "Parts of a shoe", words: ["TONGUE", "HEEL", "SOLE", "LACE"] },
      { color: "green", name: "Things associated with chess", words: ["FORK", "PIN", "CASTLE", "BISHOP"] },
      { color: "blue", name: "Things that can be 'broken'", words: ["RECORD", "GROUND", "HEART", "SILENCE"] },
      { color: "purple", name: "___ + 'fish' = new word", words: ["SWORD", "STAR", "BLOW", "CAT"] },
    ],
  },
  {
    number: 8,
    categories: [
      { color: "yellow", name: "Things in a doctor's office", words: ["CHART", "GOWN", "SCALE", "STETHOSCOPE"] },
      { color: "green", name: "Famous Leonardos", words: ["DICAPRIO", "DAVINCI", "FIBONACCI", "NIMOY"] },
      { color: "blue", name: "Things that can be 'golden'", words: ["GATE", "AGE", "RATIO", "RETRIEVER"] },
      { color: "purple", name: "Collective nouns for animals", words: ["MURDER", "PARLIAMENT", "BLOAT", "CRASH"] },
    ],
  },
  {
    number: 9,
    categories: [
      { color: "yellow", name: "Things with a dial", words: ["SAFE", "RADIO", "THERMOSTAT", "COMBINATION"] },
      { color: "green", name: "___ story", words: ["LOVE", "GHOST", "TOY", "BEDTIME"] },
      { color: "blue", name: "Things that can be 'raw'", words: ["DEAL", "NERVE", "POWER", "TALENT"] },
      { color: "purple", name: "Words that follow 'egg'", words: ["SHELL", "NOG", "HEAD", "PLANT"] },
    ],
  },
  {
    number: 10,
    categories: [
      { color: "yellow", name: "Famous Amys", words: ["WINEHOUSE", "ADAMS", "SCHUMER", "GRANT"] },
      { color: "green", name: "Things you find at a wedding", words: ["VEIL", "TOAST", "USHER", "RING"] },
      { color: "blue", name: "___ band", words: ["ARM", "JAZZ", "ROCK", "RUBBER"] },
      { color: "purple", name: "Words meaning 'to deceive'", words: ["CON", "FLEECE", "BILK", "BAMBOOZLE"] },
    ],
  },
  {
    number: 11,
    categories: [
      { color: "yellow", name: "Types of pasta", words: ["RIGATONI", "ORZO", "FARFALLE", "GEMELLI"] },
      { color: "green", name: "Things that can be 'wild'", words: ["CARD", "LIFE", "FIRE", "GUESS"] },
      { color: "blue", name: "Words before 'board'", words: ["SKATE", "CARD", "DART", "BROAD"] },
      { color: "purple", name: "Things that get harder with age", words: ["CHEESE", "WOOD", "WINE", "ARTERIES"] },
    ],
  },
  {
    number: 12,
    categories: [
      { color: "yellow", name: "Things in space", words: ["NEBULA", "PULSAR", "QUASAR", "COMET"] },
      { color: "green", name: "Words after 'sun'", words: ["BURN", "FLOWER", "GLASS", "ROOF"] },
      { color: "blue", name: "Things that can be 'loaded'", words: ["QUESTION", "DICE", "POTATO", "GUN"] },
      { color: "purple", name: "Anagram of a planet", words: ["RUHMS", "RESULT", "URANUS", "NAPTUNE"] },
    ],
  },
  {
    number: 13,
    categories: [
      { color: "yellow", name: "Cocktail ingredients", words: ["BITTERS", "GRENADINE", "VERMOUTH", "TRIPLE SEC"] },
      { color: "green", name: "Things associated with cats", words: ["PURR", "CLAW", "NUZZLE", "SCRATCH"] },
      { color: "blue", name: "___ power", words: ["BRAIN", "FLOWER", "SUPER", "WILL"] },
      { color: "purple", name: "Words that are their own antonyms (contronyms)", words: ["SANCTION", "CLEAVE", "DUST", "BUCKLE"] },
    ],
  },
  {
    number: 14,
    categories: [
      { color: "yellow", name: "Things with keys", words: ["PIANO", "LAPTOP", "PRISON", "FLORIDA"] },
      { color: "green", name: "Words meaning 'small amount'", words: ["SMIDGE", "DASH", "TRACE", "HINT"] },
      { color: "blue", name: "Things that can be 'twisted'", words: ["ANKLE", "METAL", "LOGIC", "PLOT"] },
      { color: "purple", name: "Hidden animals: one word contains an animal", words: ["SHRIMP", "CANOPY", "BADMINTON", "SPARSE"] },
    ],
  },
  {
    number: 15,
    categories: [
      { color: "yellow", name: "Things associated with sleep", words: ["PILLOW", "MELATONIN", "SNORE", "DROOL"] },
      { color: "green", name: "___ cup", words: ["BUTTER", "HICCUP", "WORLD", "EGGCUP"] },
      { color: "blue", name: "Things that can be 'dirty'", words: ["DOZEN", "LAUNDRY", "LOOK", "TRICK"] },
      { color: "purple", name: "Words before 'fish' that make a new word", words: ["ANGEL", "SWORD", "CUTTLE", "JELLY"] },
    ],
  },
  {
    number: 16,
    categories: [
      { color: "yellow", name: "Things in a toolbox", words: ["LEVEL", "CHISEL", "CLAMP", "AWL"] },
      { color: "green", name: "Words after 'over'", words: ["HAUL", "WHELM", "COME", "BEARING"] },
      { color: "blue", name: "Things that can be 'perfect'", words: ["PITCH", "STORM", "CRIME", "SCORE"] },
      { color: "purple", name: "Palindromes", words: ["RACECAR", "KAYAK", "CIVIC", "LEVEL"] },
    ],
  },
  {
    number: 17,
    categories: [
      { color: "yellow", name: "Types of bridge", words: ["SUSPENSION", "DRAWBRIDGE", "COVERED", "ARCH"] },
      { color: "green", name: "Things that can be 'flat'", words: ["TIRE", "IRON", "BROKE", "CAP"] },
      { color: "blue", name: "Words associated with anger", words: ["FUME", "SEETHE", "BRISTLE", "SIMMER"] },
      { color: "purple", name: "Things named after people (eponyms)", words: ["CARDIGAN", "WELLINGTONS", "SANDWICH", "JACUZZI"] },
    ],
  },
  {
    number: 18,
    categories: [
      { color: "yellow", name: "Things you can scroll", words: ["FEED", "MAP", "PARCHMENT", "CREDITS"] },
      { color: "green", name: "___ line", words: ["BASE", "PUNCH", "HAIR", "FINISH"] },
      { color: "blue", name: "Things that can be 'cold'", words: ["FEET", "SNAP", "SHOULDER", "FRONT"] },
      { color: "purple", name: "Words that sound like letters", words: ["ARE", "SEA", "WHY", "JAY"] },
    ],
  },
  {
    number: 19,
    categories: [
      { color: "yellow", name: "Words meaning 'to walk slowly'", words: ["AMBLE", "SAUNTER", "MOSEY", "TODDLE"] },
      { color: "green", name: "Things associated with pirates", words: ["PLANK", "PARROT", "DOUBLOON", "CROW'S NEST"] },
      { color: "blue", name: "___ note", words: ["FOOT", "BANK", "POST", "QUARTER"] },
      { color: "purple", name: "Words where adding 'S' to the front makes a new word", words: ["PARK", "TRAIN", "TRIKE", "LAUGHTER"] },
    ],
  },
  {
    number: 20,
    categories: [
      { color: "yellow", name: "Types of cloud", words: ["CIRRUS", "NIMBUS", "STRATUS", "CUMULUS"] },
      { color: "green", name: "Things that can be 'broken'", words: ["PROMISE", "BONE", "WAVE", "CODE"] },
      { color: "blue", name: "Words before 'dog'", words: ["HOT", "CORN", "SHEEP", "THUNDER"] },
      { color: "purple", name: "Things that have faces but no eyes", words: ["CLOCK", "COIN", "CLIFF", "CARD"] },
    ],
  },
  {
    number: 21,
    categories: [
      { color: "yellow", name: "Words meaning 'to talk a lot'", words: ["PRATTLE", "JABBER", "RABBIT", "BLATHER"] },
      { color: "green", name: "Things associated with yoga", words: ["COBRA", "WARRIOR", "PLANK", "LOTUS"] },
      { color: "blue", name: "___ gate", words: ["WATER", "FLOOD", "TAIL", "IRON"] },
      { color: "purple", name: "Famous people named after places (or vice versa)", words: ["HOUSTON", "FLORENCE", "INDIANA", "KENT"] },
    ],
  },
  {
    number: 22,
    categories: [
      { color: "yellow", name: "Things in a gym", words: ["BARBELL", "TREADMILL", "KETTLEBELL", "CABLE"] },
      { color: "green", name: "Words after 'arm'", words: ["CHAIR", "PIT", "BAND", "HOLE"] },
      { color: "blue", name: "Things that can be 'sharp'", words: ["TONGUE", "MIND", "CORNER", "DRESSED"] },
      { color: "purple", name: "Words that are both nouns and verbs meaning opposite things", words: ["TRIM", "WEATHER", "SCREEN", "RESIGN"] },
    ],
  },
  {
    number: 23,
    categories: [
      { color: "yellow", name: "Parts of an egg", words: ["YOLK", "WHITE", "SHELL", "MEMBRANE"] },
      { color: "green", name: "Things that can be 'mixed'", words: ["SIGNAL", "BAG", "MARTIAL ARTS", "BLESSING"] },
      { color: "blue", name: "___ tree", words: ["PALM", "GUM", "BOOT", "FAMILY"] },
      { color: "purple", name: "Words hidden inside 'CHAMPIONSHIPS'", words: ["SHIP", "CHAMP", "ONION", "PION"] },
    ],
  },
  {
    number: 24,
    categories: [
      { color: "yellow", name: "Things associated with autumn", words: ["AMBER", "HARVEST", "CIDER", "FROST"] },
      { color: "green", name: "Words before 'work'", words: ["FRAME", "TEAM", "NET", "OVER"] },
      { color: "blue", name: "Things that can be 'grand'", words: ["PIANO", "SLAM", "TOUR", "THEFT"] },
      { color: "purple", name: "Words where rearranging letters spells a country", words: ["NAILER", "GRAPES", "SHRINE", "MERICA"] },
    ],
  },
  {
    number: 25,
    categories: [
      { color: "yellow", name: "Types of hat", words: ["FEDORA", "TRILBY", "BERET", "CLOCHE"] },
      { color: "green", name: "Things that can be 'fast'", words: ["TRACK", "LANE", "FOOD", "HARD"] },
      { color: "blue", name: "Words after 'eye'", words: ["LASH", "BROW", "LID", "WITNESS"] },
      { color: "purple", name: "Things with a spine but no brain", words: ["BOOK", "STARFISH", "CACTUS", "URCHIN"] },
    ],
  },
  {
    number: 26,
    categories: [
      { color: "yellow", name: "Things associated with magic", words: ["WAND", "SPELL", "CAULDRON", "FAMILIAR"] },
      { color: "green", name: "___ house", words: ["OPEN", "POWER", "FULL", "STORE"] },
      { color: "blue", name: "Things that can be 'tight'", words: ["ROPE", "BUDGET", "LIP", "SHIP"] },
      { color: "purple", name: "Words that become opposites with a prefix (not un-)", words: ["CONTENT", "MORAL", "PATIENT", "MATURE"] },
    ],
  },
  {
    number: 27,
    categories: [
      { color: "yellow", name: "Things associated with a courtroom", words: ["GAVEL", "BENCH", "RECESS", "SIDEBAR"] },
      { color: "green", name: "Words before 'room'", words: ["SHOW", "BALL", "ELBOW", "STORE"] },
      { color: "blue", name: "Things that can be 'dead'", words: ["HEAT", "LOCK", "WOOD", "PAN"] },
      { color: "purple", name: "Words with silent letters", words: ["KNIGHT", "GNOME", "WRECK", "PSALM"] },
    ],
  },
  {
    number: 28,
    categories: [
      { color: "yellow", name: "Things associated with bees", words: ["DRONE", "HIVE", "POLLEN", "WAX"] },
      { color: "green", name: "___ bee", words: ["SPELLING", "BUMBLE", "QUEEN", "HUMBLE"] },
      { color: "blue", name: "Things that can be 'honey'", words: ["MOON", "BEE", "DEW", "TRAP"] },
      { color: "purple", name: "Words with exactly 3 consecutive vowels", words: ["QUEUE", "AUDIO", "CHAOS", "AIDED"] },
    ],
  },
  {
    number: 29,
    categories: [
      { color: "yellow", name: "Things you find at a carnival", words: ["FERRIS WHEEL", "FUNNEL CAKE", "TILT-A-WHIRL", "CORN DOG"] },
      { color: "green", name: "Things that can be 'popped'", words: ["COLLAR", "QUESTION", "CHERRY", "CORN"] },
      { color: "blue", name: "Words before 'top'", words: ["LAPTOP", "FLAT", "OVER", "TANK"] },
      { color: "purple", name: "Words that rhyme with a number", words: ["HEAVEN", "PINE", "GATE", "FLOOR"] },
    ],
  },
  {
    number: 30,
    categories: [
      { color: "yellow", name: "Things associated with winter", words: ["SLEET", "SOLSTICE", "HIBERNATE", "FROST"] },
      { color: "green", name: "___ ring", words: ["BOX", "ENGAGE", "EAR", "BOXING"] },
      { color: "blue", name: "Things that can be 'open'", words: ["BOOK", "MINDED", "SOURCE", "HEART"] },
      { color: "purple", name: "Words that contain a musical note", words: ["DOMINO", "REFACE", "MISSILE", "LASER"] },
    ],
  },
];
