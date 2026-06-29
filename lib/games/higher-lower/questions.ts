import { mulberry32, randInt, type RNG } from "@/lib/multiplayer/rng";

export type HoLQuestion = {
  caption: string;
  metricLabel: string;
  left: { label: string; value: number; valueLabel: string };
  right: { label: string; value: number; valueLabel: string };
  answerIndex: 0 | 1;
};

type HoLEntry = {
  caption: string;
  metricLabel: string;
  itemA: { label: string; value: number; valueLabel: string };
  itemB: { label: string; value: number; valueLabel: string };
};

const ENTRIES: HoLEntry[] = [
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Canada", value: 40, valueLabel: "40m" },
    itemB: { label: "Argentina", value: 46, valueLabel: "46m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Germany", value: 84, valueLabel: "84m" },
    itemB: { label: "United Kingdom", value: 68, valueLabel: "68m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Japan", value: 124, valueLabel: "124m" },
    itemB: { label: "Mexico", value: 129, valueLabel: "129m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Nigeria", value: 223, valueLabel: "223m" },
    itemB: { label: "Brazil", value: 216, valueLabel: "216m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "France", value: 68, valueLabel: "68m" },
    itemB: { label: "Italy", value: 59, valueLabel: "59m" },
  },
  {
    caption: "Which country covers more land?",
    metricLabel: "Area",
    itemA: { label: "Russia", value: 17_098_242, valueLabel: "17.1m km²" },
    itemB: { label: "Canada", value: 9_984_670, valueLabel: "9.98m km²" },
  },
  {
    caption: "Which country covers more land?",
    metricLabel: "Area",
    itemA: { label: "Australia", value: 7_692_024, valueLabel: "7.69m km²" },
    itemB: { label: "India", value: 3_287_263, valueLabel: "3.29m km²" },
  },
  {
    caption: "Which country covers more land?",
    metricLabel: "Area",
    itemA: { label: "Argentina", value: 2_780_400, valueLabel: "2.78m km²" },
    itemB: { label: "Saudi Arabia", value: 2_149_690, valueLabel: "2.15m km²" },
  },
  {
    caption: "Who was born first?",
    metricLabel: "Year of birth (lower = earlier)",
    itemA: { label: "Leonardo da Vinci", value: 1452, valueLabel: "1452" },
    itemB: { label: "Galileo Galilei", value: 1564, valueLabel: "1564" },
  },
  {
    caption: "Who was born first?",
    metricLabel: "Year of birth (lower = earlier)",
    itemA: { label: "Isaac Newton", value: 1643, valueLabel: "1643" },
    itemB: { label: "Albert Einstein", value: 1879, valueLabel: "1879" },
  },
  {
    caption: "Who was born first?",
    metricLabel: "Year of birth (lower = earlier)",
    itemA: { label: "Mozart", value: 1756, valueLabel: "1756" },
    itemB: { label: "Beethoven", value: 1770, valueLabel: "1770" },
  },
  {
    caption: "Who was born first?",
    metricLabel: "Year of birth (lower = earlier)",
    itemA: { label: "Napoleon Bonaparte", value: 1769, valueLabel: "1769" },
    itemB: { label: "Abraham Lincoln", value: 1809, valueLabel: "1809" },
  },
  {
    caption: "Who was born first?",
    metricLabel: "Year of birth (lower = earlier)",
    itemA: { label: "Charles Darwin", value: 1809, valueLabel: "1809" },
    itemB: { label: "Karl Marx", value: 1818, valueLabel: "1818" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Box office",
    itemA: { label: "Avatar (2009)", value: 2923, valueLabel: "$2.92b" },
    itemB: { label: "Avengers: Endgame", value: 2799, valueLabel: "$2.80b" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Box office",
    itemA: { label: "Titanic", value: 2257, valueLabel: "$2.26b" },
    itemB: { label: "The Lion King (2019)", value: 1657, valueLabel: "$1.66b" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Box office",
    itemA: { label: "Jurassic World", value: 1672, valueLabel: "$1.67b" },
    itemB: { label: "Frozen II", value: 1453, valueLabel: "$1.45b" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Box office",
    itemA: { label: "Barbie (2023)", value: 1446, valueLabel: "$1.45b" },
    itemB: { label: "Oppenheimer", value: 976, valueLabel: "$976m" },
  },
  {
    caption: "Which film is longer?",
    metricLabel: "Runtime",
    itemA: { label: "The Godfather", value: 175, valueLabel: "175 min" },
    itemB: { label: "Pulp Fiction", value: 154, valueLabel: "154 min" },
  },
  {
    caption: "Which film is longer?",
    metricLabel: "Runtime",
    itemA: { label: "Avengers: Endgame", value: 181, valueLabel: "181 min" },
    itemB: { label: "Oppenheimer", value: 180, valueLabel: "180 min" },
  },
  {
    caption: "Which film is longer?",
    metricLabel: "Runtime",
    itemA: { label: "Lawrence of Arabia", value: 228, valueLabel: "228 min" },
    itemB: { label: "Titanic", value: 195, valueLabel: "195 min" },
  },
  {
    caption: "Which mountain is taller?",
    metricLabel: "Height",
    itemA: { label: "Mount Everest", value: 8849, valueLabel: "8,849 m" },
    itemB: { label: "K2", value: 8611, valueLabel: "8,611 m" },
  },
  {
    caption: "Which mountain is taller?",
    metricLabel: "Height",
    itemA: { label: "Denali", value: 6190, valueLabel: "6,190 m" },
    itemB: { label: "Mont Blanc", value: 4808, valueLabel: "4,808 m" },
  },
  {
    caption: "Which mountain is taller?",
    metricLabel: "Height",
    itemA: { label: "Mount Kilimanjaro", value: 5895, valueLabel: "5,895 m" },
    itemB: { label: "Matterhorn", value: 4478, valueLabel: "4,478 m" },
  },
  {
    caption: "Which mountain is taller?",
    metricLabel: "Height",
    itemA: { label: "Aconcagua", value: 6961, valueLabel: "6,961 m" },
    itemB: { label: "Mount Fuji", value: 3776, valueLabel: "3,776 m" },
  },
  {
    caption: "Which building is taller?",
    metricLabel: "Height",
    itemA: { label: "Burj Khalifa", value: 828, valueLabel: "828 m" },
    itemB: { label: "Shanghai Tower", value: 632, valueLabel: "632 m" },
  },
  {
    caption: "Which building is taller?",
    metricLabel: "Height",
    itemA: { label: "Empire State Building", value: 381, valueLabel: "381 m" },
    itemB: { label: "The Shard (London)", value: 310, valueLabel: "310 m" },
  },
  {
    caption: "Which building is taller?",
    metricLabel: "Height",
    itemA: { label: "One World Trade Center", value: 541, valueLabel: "541 m" },
    itemB: { label: "Eiffel Tower", value: 330, valueLabel: "330 m" },
  },
  {
    caption: "Which building is taller?",
    metricLabel: "Height",
    itemA: { label: "Petronas Towers", value: 452, valueLabel: "452 m" },
    itemB: { label: "Taipei 101", value: 508, valueLabel: "508 m" },
  },
  {
    caption: "Which artist has more Spotify monthly listeners?",
    metricLabel: "Monthly listeners",
    itemA: { label: "Taylor Swift", value: 100, valueLabel: "~100m" },
    itemB: { label: "The Weeknd", value: 110, valueLabel: "~110m" },
  },
  {
    caption: "Which artist has more Spotify monthly listeners?",
    metricLabel: "Monthly listeners",
    itemA: { label: "Drake", value: 78, valueLabel: "~78m" },
    itemB: { label: "Bad Bunny", value: 80, valueLabel: "~80m" },
  },
  {
    caption: "Which artist has more Spotify monthly listeners?",
    metricLabel: "Monthly listeners",
    itemA: { label: "Ariana Grande", value: 82, valueLabel: "~82m" },
    itemB: { label: "Billie Eilish", value: 75, valueLabel: "~75m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Vietnam", value: 99, valueLabel: "99m" },
    itemB: { label: "Germany", value: 84, valueLabel: "84m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Ethiopia", value: 126, valueLabel: "126m" },
    itemB: { label: "Japan", value: 124, valueLabel: "124m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Iran", value: 89, valueLabel: "89m" },
    itemB: { label: "Turkey", value: 85, valueLabel: "85m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Democratic Republic of the Congo", value: 102, valueLabel: "102m" },
    itemB: { label: "Egypt", value: 113, valueLabel: "113m" },
  },
  {
    caption: "Which country has more people?",
    metricLabel: "Population",
    itemA: { label: "Canada", value: 39, valueLabel: "39m" },
    itemB: { label: "Morocco", value: 37, valueLabel: "37m" },
  },
  {
    caption: "Which metro area has more people?",
    metricLabel: "Metro population",
    itemA: { label: "Jakarta", value: 33.4, valueLabel: "33.4m" },
    itemB: { label: "Tokyo", value: 37, valueLabel: "37.0m" },
  },
  {
    caption: "Which metro area has more people?",
    metricLabel: "Metro population",
    itemA: { label: "Lagos", value: 16.5, valueLabel: "16.5m" },
    itemB: { label: "Paris", value: 11.3, valueLabel: "11.3m" },
  },
  {
    caption: "Which country covers more land?",
    metricLabel: "Land area",
    itemA: { label: "Kazakhstan", value: 2.72, valueLabel: "2.72m km²" },
    itemB: { label: "Argentina", value: 2.78, valueLabel: "2.78m km²" },
  },
  {
    caption: "Which country covers more land?",
    metricLabel: "Land area",
    itemA: { label: "Algeria", value: 2.38, valueLabel: "2.38m km²" },
    itemB: { label: "Greenland", value: 2.17, valueLabel: "2.17m km²" },
  },
  {
    caption: "Which country covers more land?",
    metricLabel: "Land area",
    itemA: { label: "Sudan", value: 1.86, valueLabel: "1.86m km²" },
    itemB: { label: "Mongolia", value: 1.56, valueLabel: "1.56m km²" },
  },
  {
    caption: "Which country covers more land?",
    metricLabel: "Land area",
    itemA: { label: "France", value: 0.55, valueLabel: "551,000 km²" },
    itemB: { label: "Ukraine", value: 0.6, valueLabel: "604,000 km²" },
  },
  {
    caption: "Which river is longer?",
    metricLabel: "Length",
    itemA: { label: "Yangtze", value: 6300, valueLabel: "6,300 km" },
    itemB: { label: "Mississippi", value: 3766, valueLabel: "3,766 km" },
  },
  {
    caption: "Which river is longer?",
    metricLabel: "Length",
    itemA: { label: "Danube", value: 2850, valueLabel: "2,850 km" },
    itemB: { label: "Rhine", value: 1230, valueLabel: "1,230 km" },
  },
  {
    caption: "Which is deeper?",
    metricLabel: "Maximum depth",
    itemA: { label: "Mariana Trench", value: 10935, valueLabel: "10,935 m" },
    itemB: { label: "Tonga Trench", value: 10882, valueLabel: "10,882 m" },
  },
  {
    caption: "Which lake is deeper?",
    metricLabel: "Maximum depth",
    itemA: { label: "Lake Baikal", value: 1642, valueLabel: "1,642 m" },
    itemB: { label: "Lake Tanganyika", value: 1470, valueLabel: "1,470 m" },
  },
  {
    caption: "Which lake is deeper?",
    metricLabel: "Maximum depth",
    itemA: { label: "Crater Lake", value: 594, valueLabel: "594 m" },
    itemB: { label: "Loch Ness", value: 230, valueLabel: "230 m" },
  },
  {
    caption: "Which island is larger?",
    metricLabel: "Area",
    itemA: { label: "Borneo", value: 748168, valueLabel: "748,168 km²" },
    itemB: { label: "Madagascar", value: 587041, valueLabel: "587,041 km²" },
  },
  {
    caption: "Which island is larger?",
    metricLabel: "Area",
    itemA: { label: "Great Britain", value: 209331, valueLabel: "209,331 km²" },
    itemB: { label: "Honshu", value: 225800, valueLabel: "225,800 km²" },
  },
  {
    caption: "Which island is larger?",
    metricLabel: "Area",
    itemA: { label: "Sri Lanka", value: 65610, valueLabel: "65,610 km²" },
    itemB: { label: "Ireland", value: 84421, valueLabel: "84,421 km²" },
  },
  {
    caption: "Which desert is larger?",
    metricLabel: "Area",
    itemA: { label: "Sahara", value: 9200000, valueLabel: "9.2m km²" },
    itemB: { label: "Arabian Desert", value: 2330000, valueLabel: "2.33m km²" },
  },
  {
    caption: "Which desert is larger?",
    metricLabel: "Area",
    itemA: { label: "Gobi Desert", value: 1295000, valueLabel: "1.30m km²" },
    itemB: { label: "Kalahari Desert", value: 900000, valueLabel: "900,000 km²" },
  },
  {
    caption: "Which mountain is taller?",
    metricLabel: "Height above sea level",
    itemA: { label: "K2", value: 8611, valueLabel: "8,611 m" },
    itemB: { label: "Kangchenjunga", value: 8586, valueLabel: "8,586 m" },
  },
  {
    caption: "Which mountain is taller?",
    metricLabel: "Height above sea level",
    itemA: { label: "Mont Blanc", value: 4806, valueLabel: "4,806 m" },
    itemB: { label: "Matterhorn", value: 4478, valueLabel: "4,478 m" },
  },
  {
    caption: "Which waterfall is taller?",
    metricLabel: "Height",
    itemA: { label: "Angel Falls", value: 979, valueLabel: "979 m" },
    itemB: { label: "Niagara Falls", value: 51, valueLabel: "51 m" },
  },
  {
    caption: "Which country has a longer coastline?",
    metricLabel: "Coastline length",
    itemA: { label: "Norway", value: 83281, valueLabel: "83,281 km" },
    itemB: { label: "Australia", value: 25760, valueLabel: "25,760 km" },
  },
  {
    caption: "Which country has a longer coastline?",
    metricLabel: "Coastline length",
    itemA: { label: "Japan", value: 29751, valueLabel: "29,751 km" },
    itemB: { label: "United States", value: 19924, valueLabel: "19,924 km" },
  },
  {
    caption: "Which animal is faster?",
    metricLabel: "Top speed",
    itemA: { label: "Peregrine falcon (dive)", value: 389, valueLabel: "389 km/h" },
    itemB: { label: "Cheetah", value: 104, valueLabel: "104 km/h" },
  },
  {
    caption: "Which animal is faster?",
    metricLabel: "Top speed",
    itemA: { label: "Sailfish", value: 110, valueLabel: "110 km/h" },
    itemB: { label: "Greyhound", value: 74, valueLabel: "74 km/h" },
  },
  {
    caption: "Which animal is faster?",
    metricLabel: "Top speed",
    itemA: { label: "Pronghorn antelope", value: 88, valueLabel: "88 km/h" },
    itemB: { label: "Lion", value: 80, valueLabel: "80 km/h" },
  },
  {
    caption: "Which animal is faster?",
    metricLabel: "Top speed",
    itemA: { label: "Black marlin", value: 105, valueLabel: "105 km/h" },
    itemB: { label: "Killer whale (orca)", value: 56, valueLabel: "56 km/h" },
  },
  {
    caption: "Which animal is heavier?",
    metricLabel: "Maximum weight",
    itemA: { label: "Blue whale", value: 150000, valueLabel: "150,000 kg" },
    itemB: { label: "African bush elephant", value: 6000, valueLabel: "6,000 kg" },
  },
  {
    caption: "Which animal is heavier?",
    metricLabel: "Maximum weight",
    itemA: { label: "Saltwater crocodile", value: 1000, valueLabel: "1,000 kg" },
    itemB: { label: "Polar bear", value: 700, valueLabel: "700 kg" },
  },
  {
    caption: "Which animal lives longer?",
    metricLabel: "Lifespan",
    itemA: { label: "Greenland shark", value: 400, valueLabel: "400 yrs" },
    itemB: { label: "Giant tortoise", value: 180, valueLabel: "180 yrs" },
  },
  {
    caption: "Which animal lives longer?",
    metricLabel: "Lifespan",
    itemA: { label: "Bowhead whale", value: 200, valueLabel: "200 yrs" },
    itemB: { label: "African elephant", value: 70, valueLabel: "70 yrs" },
  },
  {
    caption: "Which animal lives longer?",
    metricLabel: "Lifespan",
    itemA: { label: "Macaw parrot", value: 80, valueLabel: "80 yrs" },
    itemB: { label: "Domestic dog", value: 20, valueLabel: "20 yrs" },
  },
  {
    caption: "Which bird has the bigger wingspan?",
    metricLabel: "Wingspan",
    itemA: { label: "Wandering albatross", value: 350, valueLabel: "350 cm" },
    itemB: { label: "Andean condor", value: 320, valueLabel: "320 cm" },
  },
  {
    caption: "Which bird has the bigger wingspan?",
    metricLabel: "Wingspan",
    itemA: { label: "Bald eagle", value: 200, valueLabel: "200 cm" },
    itemB: { label: "Common raven", value: 130, valueLabel: "130 cm" },
  },
  {
    caption: "Which is longer?",
    metricLabel: "Maximum length",
    itemA: { label: "Whale shark", value: 1800, valueLabel: "18 m" },
    itemB: { label: "Great white shark", value: 600, valueLabel: "6 m" },
  },
  {
    caption: "Which dinosaur was longer?",
    metricLabel: "Body length",
    itemA: { label: "Argentinosaurus", value: 35, valueLabel: "35 m" },
    itemB: { label: "Diplodocus", value: 26, valueLabel: "26 m" },
  },
  {
    caption: "Which dinosaur was longer?",
    metricLabel: "Body length",
    itemA: { label: "Tyrannosaurus rex", value: 12, valueLabel: "12 m" },
    itemB: { label: "Velociraptor", value: 2, valueLabel: "2 m" },
  },
  {
    caption: "Which dinosaur was longer?",
    metricLabel: "Body length",
    itemA: { label: "Spinosaurus", value: 15, valueLabel: "15 m" },
    itemB: { label: "Brachiosaurus", value: 22, valueLabel: "22 m" },
  },
  {
    caption: "Which planet is bigger?",
    metricLabel: "Diameter",
    itemA: { label: "Jupiter", value: 139820, valueLabel: "139,820 km" },
    itemB: { label: "Saturn", value: 116460, valueLabel: "116,460 km" },
  },
  {
    caption: "Which planet is bigger?",
    metricLabel: "Diameter",
    itemA: { label: "Earth", value: 12742, valueLabel: "12,742 km" },
    itemB: { label: "Mars", value: 6779, valueLabel: "6,779 km" },
  },
  {
    caption: "Which planet is bigger?",
    metricLabel: "Diameter",
    itemA: { label: "Neptune", value: 49244, valueLabel: "49,244 km" },
    itemB: { label: "Mercury", value: 4879, valueLabel: "4,879 km" },
  },
  {
    caption: "Which planet is farther from the Sun?",
    metricLabel: "Distance from Sun",
    itemA: { label: "Neptune", value: 4495, valueLabel: "4,495 million km" },
    itemB: { label: "Saturn", value: 1434, valueLabel: "1,434 million km" },
  },
  {
    caption: "Which planet is farther from the Sun?",
    metricLabel: "Distance from Sun",
    itemA: { label: "Mars", value: 228, valueLabel: "228 million km" },
    itemB: { label: "Venus", value: 108, valueLabel: "108 million km" },
  },
  {
    caption: "Which planet has more moons?",
    metricLabel: "Number of moons",
    itemA: { label: "Saturn", value: 146, valueLabel: "146 moons" },
    itemB: { label: "Jupiter", value: 95, valueLabel: "95 moons" },
  },
  {
    caption: "Which planet has more moons?",
    metricLabel: "Number of moons",
    itemA: { label: "Mars", value: 2, valueLabel: "2 moons" },
    itemB: { label: "Earth", value: 1, valueLabel: "1 moon" },
  },
  {
    caption: "Which element has the higher atomic number?",
    metricLabel: "Atomic number",
    itemA: { label: "Gold", value: 79, valueLabel: "79" },
    itemB: { label: "Iron", value: 26, valueLabel: "26" },
  },
  {
    caption: "Which element has the higher atomic number?",
    metricLabel: "Atomic number",
    itemA: { label: "Uranium", value: 92, valueLabel: "92" },
    itemB: { label: "Lead", value: 82, valueLabel: "82" },
  },
  {
    caption: "Which metal melts at a higher temperature?",
    metricLabel: "Melting point",
    itemA: { label: "Tungsten", value: 3422, valueLabel: "3,422°C" },
    itemB: { label: "Iron", value: 1538, valueLabel: "1,538°C" },
  },
  {
    caption: "Which planet has the hotter surface?",
    metricLabel: "Surface temperature",
    itemA: { label: "Venus", value: 465, valueLabel: "465°C" },
    itemB: { label: "Mars", value: -63, valueLabel: "−63°C" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Worldwide gross",
    itemA: { label: "Avatar (2009)", value: 2923, valueLabel: "$2.92b" },
    itemB: { label: "Avengers: Endgame", value: 2799, valueLabel: "$2.80b" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Worldwide gross",
    itemA: { label: "Titanic", value: 2257, valueLabel: "$2.26b" },
    itemB: { label: "Star Wars: The Force Awakens", value: 2068, valueLabel: "$2.07b" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Worldwide gross",
    itemA: { label: "Avatar: The Way of Water", value: 2320, valueLabel: "$2.32b" },
    itemB: { label: "Inside Out 2", value: 1699, valueLabel: "$1.70b" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Worldwide gross",
    itemA: { label: "Barbie", value: 1446, valueLabel: "$1.45b" },
    itemB: { label: "Oppenheimer", value: 976, valueLabel: "$0.98b" },
  },
  {
    caption: "Which film grossed more worldwide?",
    metricLabel: "Worldwide gross",
    itemA: { label: "The Lion King (2019)", value: 1663, valueLabel: "$1.66b" },
    itemB: { label: "Frozen II", value: 1453, valueLabel: "$1.45b" },
  },
  {
    caption: "Which film has the longer runtime?",
    metricLabel: "Runtime",
    itemA: { label: "Avengers: Endgame", value: 181, valueLabel: "181 min" },
    itemB: { label: "Titanic", value: 194, valueLabel: "194 min" },
  },
  {
    caption: "Which film has the longer runtime?",
    metricLabel: "Runtime",
    itemA: { label: "The Lord of the Rings: The Return of the King", value: 201, valueLabel: "201 min" },
    itemB: { label: "The Godfather", value: 175, valueLabel: "175 min" },
  },
  {
    caption: "Which film has the longer runtime?",
    metricLabel: "Runtime",
    itemA: { label: "Oppenheimer", value: 180, valueLabel: "180 min" },
    itemB: { label: "Pulp Fiction", value: 154, valueLabel: "154 min" },
  },
  {
    caption: "Which film has the longer runtime?",
    metricLabel: "Runtime",
    itemA: { label: "Gone with the Wind", value: 238, valueLabel: "238 min" },
    itemB: { label: "Avatar: The Way of Water", value: 192, valueLabel: "192 min" },
  },
  {
    caption: "Which show has more total episodes?",
    metricLabel: "Episodes",
    itemA: { label: "The Simpsons", value: 790, valueLabel: "790+ eps" },
    itemB: { label: "Friends", value: 236, valueLabel: "236 eps" },
  },
  {
    caption: "Which show has more total episodes?",
    metricLabel: "Episodes",
    itemA: { label: "Grey's Anatomy", value: 440, valueLabel: "440+ eps" },
    itemB: { label: "Breaking Bad", value: 62, valueLabel: "62 eps" },
  },
  {
    caption: "Which show has more total episodes?",
    metricLabel: "Episodes",
    itemA: { label: "Game of Thrones", value: 73, valueLabel: "73 eps" },
    itemB: { label: "The Office (US)", value: 201, valueLabel: "201 eps" },
  },
  {
    caption: "Which show has more total episodes?",
    metricLabel: "Episodes",
    itemA: { label: "Doctor Who (since 1963)", value: 870, valueLabel: "870+ eps" },
    itemB: { label: "Law & Order: SVU", value: 550, valueLabel: "550+ eps" },
  },
  {
    caption: "Which show ran for more seasons?",
    metricLabel: "Seasons",
    itemA: { label: "The Simpsons", value: 36, valueLabel: "36 seasons" },
    itemB: { label: "Friends", value: 10, valueLabel: "10 seasons" },
  },
  {
    caption: "Which show ran for more seasons?",
    metricLabel: "Seasons",
    itemA: { label: "Grey's Anatomy", value: 21, valueLabel: "21 seasons" },
    itemB: { label: "Game of Thrones", value: 8, valueLabel: "8 seasons" },
  },
  {
    caption: "Which show ran for more seasons?",
    metricLabel: "Seasons",
    itemA: { label: "Saturday Night Live", value: 50, valueLabel: "50 seasons" },
    itemB: { label: "Survivor", value: 47, valueLabel: "47 seasons" },
  },
  {
    caption: "Who has more Spotify monthly listeners?",
    metricLabel: "Monthly listeners",
    itemA: { label: "The Weeknd", value: 115, valueLabel: "~115m listeners" },
    itemB: { label: "Ed Sheeran", value: 82, valueLabel: "~82m listeners" },
  },
  {
    caption: "Who has more Spotify monthly listeners?",
    metricLabel: "Monthly listeners",
    itemA: { label: "Taylor Swift", value: 92, valueLabel: "~92m listeners" },
    itemB: { label: "Drake", value: 78, valueLabel: "~78m listeners" },
  },
  {
    caption: "Which song has more Spotify streams?",
    metricLabel: "Streams",
    itemA: { label: "Blinding Lights — The Weeknd", value: 4600, valueLabel: "4.6b streams" },
    itemB: { label: "Shape of You — Ed Sheeran", value: 4200, valueLabel: "4.2b streams" },
  },
  {
    caption: "Which song has more Spotify streams?",
    metricLabel: "Streams",
    itemA: { label: "Someone You Loved — Lewis Capaldi", value: 3500, valueLabel: "3.5b streams" },
    itemB: { label: "Dance Monkey — Tones and I", value: 3100, valueLabel: "3.1b streams" },
  },
  {
    caption: "Which album sold more copies worldwide?",
    metricLabel: "Copies sold",
    itemA: { label: "Thriller — Michael Jackson", value: 70, valueLabel: "~70m sold" },
    itemB: { label: "Back in Black — AC/DC", value: 50, valueLabel: "~50m sold" },
  },
  {
    caption: "Which album sold more copies worldwide?",
    metricLabel: "Copies sold",
    itemA: { label: "The Dark Side of the Moon — Pink Floyd", value: 45, valueLabel: "~45m sold" },
    itemB: { label: "21 — Adele", value: 31, valueLabel: "~31m sold" },
  },
  {
    caption: "Which album sold more copies worldwide?",
    metricLabel: "Copies sold",
    itemA: { label: "Rumours — Fleetwood Mac", value: 40, valueLabel: "~40m sold" },
    itemB: { label: "Hotel California — Eagles", value: 32, valueLabel: "~32m sold" },
  },
  {
    caption: "Who has won more Grammy Awards?",
    metricLabel: "Grammys won",
    itemA: { label: "Beyoncé", value: 35, valueLabel: "35 Grammys" },
    itemB: { label: "Taylor Swift", value: 14, valueLabel: "14 Grammys" },
  },
  {
    caption: "Who has won more Academy Awards?",
    metricLabel: "Oscars won",
    itemA: { label: "Walt Disney", value: 22, valueLabel: "22 Oscars" },
    itemB: { label: "Katharine Hepburn", value: 4, valueLabel: "4 Oscars" },
  },
  {
    caption: "Which franchise grossed more at the box office?",
    metricLabel: "Franchise gross",
    itemA: { label: "Marvel Cinematic Universe", value: 31000, valueLabel: "$31b+" },
    itemB: { label: "Star Wars", value: 10300, valueLabel: "$10.3b" },
  },
  {
    caption: "Which franchise grossed more at the box office?",
    metricLabel: "Franchise gross",
    itemA: { label: "Harry Potter (Wizarding World)", value: 9600, valueLabel: "$9.6b" },
    itemB: { label: "The Lord of the Rings / Hobbit", value: 5900, valueLabel: "$5.9b" },
  },
  {
    caption: "Which franchise grossed more at the box office?",
    metricLabel: "Franchise gross",
    itemA: { label: "James Bond", value: 7800, valueLabel: "$7.8b" },
    itemB: { label: "Jurassic Park", value: 6500, valueLabel: "$6.5b" },
  },
  {
    caption: "Which game has sold more copies?",
    metricLabel: "Copies sold",
    itemA: { label: "Minecraft", value: 300, valueLabel: "300m" },
    itemB: { label: "Grand Theft Auto V", value: 205, valueLabel: "205m" },
  },
  {
    caption: "Which game has sold more copies?",
    metricLabel: "Copies sold",
    itemA: { label: "Tetris (all versions)", value: 520, valueLabel: "520m" },
    itemB: { label: "Wii Sports", value: 83, valueLabel: "83m" },
  },
  {
    caption: "Which game has sold more copies?",
    metricLabel: "Copies sold",
    itemA: { label: "PUBG: Battlegrounds", value: 75, valueLabel: "75m" },
    itemB: { label: "The Witcher 3: Wild Hunt", value: 50, valueLabel: "50m" },
  },
  {
    caption: "Which YouTube channel has more subscribers?",
    metricLabel: "Subscribers",
    itemA: { label: "MrBeast", value: 340, valueLabel: "340m subs" },
    itemB: { label: "T-Series", value: 290, valueLabel: "290m subs" },
  },
  {
    caption: "Which YouTube channel has more subscribers?",
    metricLabel: "Subscribers",
    itemA: { label: "PewDiePie", value: 111, valueLabel: "111m subs" },
    itemB: { label: "Cocomelon", value: 190, valueLabel: "190m subs" },
  },
  {
    caption: "Which YouTube channel has more subscribers?",
    metricLabel: "Subscribers",
    itemA: { label: "Mark Rober", value: 65, valueLabel: "65m subs" },
    itemB: { label: "Dude Perfect", value: 60, valueLabel: "60m subs" },
  },
  {
    caption: "Who has more Instagram followers?",
    metricLabel: "Followers",
    itemA: { label: "Cristiano Ronaldo", value: 640, valueLabel: "640m" },
    itemB: { label: "Lionel Messi", value: 505, valueLabel: "505m" },
  },
  {
    caption: "Who has more Instagram followers?",
    metricLabel: "Followers",
    itemA: { label: "Instagram (own account)", value: 690, valueLabel: "690m" },
    itemB: { label: "Selena Gomez", value: 420, valueLabel: "420m" },
  },
  {
    caption: "Which video has more YouTube views?",
    metricLabel: "Views",
    itemA: { label: "Baby Shark Dance", value: 16, valueLabel: "16b views" },
    itemB: { label: "Despacito", value: 8.7, valueLabel: "8.7b views" },
  },
  {
    caption: "Which video has more YouTube views?",
    metricLabel: "Views",
    itemA: { label: "Gangnam Style", value: 5.6, valueLabel: "5.6b views" },
    itemB: { label: "Ed Sheeran — Shape of You", value: 6.4, valueLabel: "6.4b views" },
  },
  {
    caption: "Which video has more YouTube views?",
    metricLabel: "Views",
    itemA: { label: "Wheels on the Bus (Cocomelon)", value: 5.5, valueLabel: "5.5b views" },
    itemB: { label: "Luis Fonsi — Despacito", value: 8.7, valueLabel: "8.7b views" },
  },
  {
    caption: "Which console sold more lifetime units?",
    metricLabel: "Units sold",
    itemA: { label: "PlayStation 2", value: 160, valueLabel: "160m" },
    itemB: { label: "Nintendo Switch", value: 152, valueLabel: "152m" },
  },
  {
    caption: "Which console sold more lifetime units?",
    metricLabel: "Units sold",
    itemA: { label: "Nintendo DS", value: 154, valueLabel: "154m" },
    itemB: { label: "Game Boy / Game Boy Color", value: 119, valueLabel: "119m" },
  },
  {
    caption: "Which console sold more lifetime units?",
    metricLabel: "Units sold",
    itemA: { label: "PlayStation 4", value: 117, valueLabel: "117m" },
    itemB: { label: "Xbox 360", value: 84, valueLabel: "84m" },
  },
  {
    caption: "Which console sold more lifetime units?",
    metricLabel: "Units sold",
    itemA: { label: "Nintendo Wii", value: 102, valueLabel: "102m" },
    itemB: { label: "PlayStation 3", value: 87, valueLabel: "87m" },
  },
  {
    caption: "Which company launched more recently?",
    metricLabel: "Founding year",
    itemA: { label: "Google", value: 1998, valueLabel: "1998" },
    itemB: { label: "Amazon", value: 1994, valueLabel: "1994" },
  },
  {
    caption: "Which company launched more recently?",
    metricLabel: "Founding year",
    itemA: { label: "TikTok", value: 2016, valueLabel: "2016" },
    itemB: { label: "Instagram", value: 2010, valueLabel: "2010" },
  },
  {
    caption: "Which company launched more recently?",
    metricLabel: "Founding year",
    itemA: { label: "Apple", value: 1976, valueLabel: "1976" },
    itemB: { label: "Microsoft", value: 1975, valueLabel: "1975" },
  },
  {
    caption: "Which company launched more recently?",
    metricLabel: "Founding year",
    itemA: { label: "Netflix", value: 1997, valueLabel: "1997" },
    itemB: { label: "Spotify", value: 2006, valueLabel: "2006" },
  },
  {
    caption: "Which gadget launched more recently?",
    metricLabel: "Launch year",
    itemA: { label: "Apple iPhone (1st gen)", value: 2007, valueLabel: "2007" },
    itemB: { label: "Apple iPad (1st gen)", value: 2010, valueLabel: "2010" },
  },
  {
    caption: "Which gadget launched more recently?",
    metricLabel: "Launch year",
    itemA: { label: "Nintendo Game Boy", value: 1989, valueLabel: "1989" },
    itemB: { label: "Sony PlayStation (1st)", value: 1994, valueLabel: "1994" },
  },
  {
    caption: "Which gadget launched more recently?",
    metricLabel: "Launch year",
    itemA: { label: "Apple Watch (1st gen)", value: 2015, valueLabel: "2015" },
    itemB: { label: "Amazon Echo (Alexa)", value: 2014, valueLabel: "2014" },
  },
  {
    caption: "Which platform has more monthly active users?",
    metricLabel: "Monthly users",
    itemA: { label: "Facebook", value: 3070, valueLabel: "3.07b" },
    itemB: { label: "YouTube", value: 2500, valueLabel: "2.5b" },
  },
  {
    caption: "Which platform has more monthly active users?",
    metricLabel: "Monthly users",
    itemA: { label: "Instagram", value: 2000, valueLabel: "2b" },
    itemB: { label: "TikTok", value: 1580, valueLabel: "1.58b" },
  },
  {
    caption: "Which platform has more monthly active users?",
    metricLabel: "Monthly users",
    itemA: { label: "WhatsApp", value: 2950, valueLabel: "2.95b" },
    itemB: { label: "X (Twitter)", value: 600, valueLabel: "600m" },
  },
  {
    caption: "Who has more TikTok followers?",
    metricLabel: "Followers",
    itemA: { label: "Khaby Lame", value: 162, valueLabel: "162m" },
    itemB: { label: "Charli D'Amelio", value: 156, valueLabel: "156m" },
  },
  {
    caption: "Which game has sold more copies?",
    metricLabel: "Copies sold",
    itemA: { label: "Wii Sports", value: 83, valueLabel: "83m" },
    itemB: { label: "Super Mario Bros. (NES)", value: 58, valueLabel: "58m" },
  },
  {
    caption: "Which company is worth more?",
    metricLabel: "Market value",
    itemA: { label: "Nvidia", value: 3300, valueLabel: "$3.3t" },
    itemB: { label: "Saudi Aramco", value: 1800, valueLabel: "$1.8t" },
  },
  {
    caption: "Which company is worth more?",
    metricLabel: "Market value",
    itemA: { label: "Apple", value: 3400, valueLabel: "$3.4t" },
    itemB: { label: "Tesla", value: 800, valueLabel: "$800b" },
  },
  {
    caption: "Which company is worth more?",
    metricLabel: "Market value",
    itemA: { label: "Microsoft", value: 3100, valueLabel: "$3.1t" },
    itemB: { label: "Coca-Cola", value: 270, valueLabel: "$270b" },
  },
  {
    caption: "Which company is worth more?",
    metricLabel: "Market value",
    itemA: { label: "McDonald's", value: 210, valueLabel: "$210b" },
    itemB: { label: "Netflix", value: 380, valueLabel: "$380b" },
  },
  {
    caption: "Which company is worth more?",
    metricLabel: "Market value",
    itemA: { label: "Ferrari", value: 80, valueLabel: "$80b" },
    itemB: { label: "Ford", value: 45, valueLabel: "$45b" },
  },
  {
    caption: "Who is richer?",
    metricLabel: "Net worth",
    itemA: { label: "Elon Musk", value: 240, valueLabel: "$240b" },
    itemB: { label: "Jeff Bezos", value: 200, valueLabel: "$200b" },
  },
  {
    caption: "Who is richer?",
    metricLabel: "Net worth",
    itemA: { label: "Bernard Arnault", value: 180, valueLabel: "$180b" },
    itemB: { label: "Warren Buffett", value: 140, valueLabel: "$140b" },
  },
  {
    caption: "Who is richer?",
    metricLabel: "Net worth",
    itemA: { label: "Mark Zuckerberg", value: 200, valueLabel: "$200b" },
    itemB: { label: "Bill Gates", value: 110, valueLabel: "$110b" },
  },
  {
    caption: "Who is richer?",
    metricLabel: "Net worth",
    itemA: { label: "Cristiano Ronaldo", value: 1.4, valueLabel: "$1.4b" },
    itemB: { label: "Oprah Winfrey", value: 3, valueLabel: "$3b" },
  },
  {
    caption: "Which brand is worth more?",
    metricLabel: "Brand value",
    itemA: { label: "Apple", value: 500, valueLabel: "$500b" },
    itemB: { label: "Amazon", value: 350, valueLabel: "$350b" },
  },
  {
    caption: "Which brand is worth more?",
    metricLabel: "Brand value",
    itemA: { label: "Google", value: 330, valueLabel: "$330b" },
    itemB: { label: "McDonald's", value: 200, valueLabel: "$200b" },
  },
  {
    caption: "Which brand is worth more?",
    metricLabel: "Brand value",
    itemA: { label: "Coca-Cola", value: 100, valueLabel: "$100b" },
    itemB: { label: "Nike", value: 50, valueLabel: "$50b" },
  },
  {
    caption: "Which sold for more?",
    metricLabel: "Sale price",
    itemA: { label: "Da Vinci's Salvator Mundi", value: 450, valueLabel: "$450m" },
    itemB: { label: "Picasso's Women of Algiers", value: 179, valueLabel: "$179m" },
  },
  {
    caption: "Which sold for more?",
    metricLabel: "Sale price",
    itemA: { label: "1962 Ferrari 250 GTO", value: 70, valueLabel: "$70m" },
    itemB: { label: "1955 Mercedes 300 SLR Uhlenhaut", value: 142, valueLabel: "$142m" },
  },
  {
    caption: "Which sold for more?",
    metricLabel: "Sale price",
    itemA: { label: "The Hope Diamond (est.)", value: 250, valueLabel: "$250m" },
    itemB: { label: "Pink Star Diamond", value: 71, valueLabel: "$71m" },
  },
  {
    caption: "Which team is worth more?",
    metricLabel: "Team value",
    itemA: { label: "Dallas Cowboys", value: 11, valueLabel: "$11b" },
    itemB: { label: "Real Madrid", value: 6.6, valueLabel: "$6.6b" },
  },
  {
    caption: "Which team is worth more?",
    metricLabel: "Team value",
    itemA: { label: "New York Yankees", value: 7.5, valueLabel: "$7.5b" },
    itemB: { label: "Manchester United", value: 6.2, valueLabel: "$6.2b" },
  },
  {
    caption: "Which team is worth more?",
    metricLabel: "Team value",
    itemA: { label: "Golden State Warriors", value: 8.8, valueLabel: "$8.8b" },
    itemB: { label: "Liverpool FC", value: 5.4, valueLabel: "$5.4b" },
  },
  {
    caption: "Which country has the bigger economy?",
    metricLabel: "GDP",
    itemA: { label: "United States", value: 27000, valueLabel: "$27t" },
    itemB: { label: "Japan", value: 4200, valueLabel: "$4.2t" },
  },
  {
    caption: "Which country has the bigger economy?",
    metricLabel: "GDP",
    itemA: { label: "Germany", value: 4500, valueLabel: "$4.5t" },
    itemB: { label: "India", value: 3900, valueLabel: "$3.9t" },
  },
  {
    caption: "Which country has the bigger economy?",
    metricLabel: "GDP",
    itemA: { label: "United Kingdom", value: 3400, valueLabel: "$3.4t" },
    itemB: { label: "Switzerland", value: 900, valueLabel: "$0.9t" },
  },
  {
    caption: "Which country has the bigger economy?",
    metricLabel: "GDP",
    itemA: { label: "Nigeria", value: 360, valueLabel: "$360b" },
    itemB: { label: "Ireland", value: 550, valueLabel: "$550b" },
  },
  {
    caption: "Which city has pricier homes?",
    metricLabel: "Average house price",
    itemA: { label: "Hong Kong", value: 1250, valueLabel: "$1.25m" },
    itemB: { label: "London", value: 700, valueLabel: "$700k" },
  },
  {
    caption: "Which city has pricier homes?",
    metricLabel: "Average house price",
    itemA: { label: "New York City", value: 750, valueLabel: "$750k" },
    itemB: { label: "Berlin", value: 500, valueLabel: "$500k" },
  },
  {
    caption: "Who earned more last year?",
    metricLabel: "Annual earnings",
    itemA: { label: "Cristiano Ronaldo", value: 260, valueLabel: "$260m" },
    itemB: { label: "Lionel Messi", value: 135, valueLabel: "$135m" },
  },
  {
    caption: "Who earned more last year?",
    metricLabel: "Annual earnings",
    itemA: { label: "LeBron James", value: 130, valueLabel: "$130m" },
    itemB: { label: "Stephen Curry", value: 100, valueLabel: "$100m" },
  },
  {
    caption: "Which transfer cost more?",
    metricLabel: "Transfer fee",
    itemA: { label: "Neymar to PSG", value: 222, valueLabel: "€222m" },
    itemB: { label: "Kylian Mbappé to PSG", value: 180, valueLabel: "€180m" },
  },
  {
    caption: "Which transfer cost more?",
    metricLabel: "Transfer fee",
    itemA: { label: "Cristiano Ronaldo to Real Madrid", value: 94, valueLabel: "€94m" },
    itemB: { label: "Philippe Coutinho to Barcelona", value: 135, valueLabel: "€135m" },
  },
  {
    caption: "Which costs more?",
    metricLabel: "Price",
    itemA: { label: "Bugatti Chiron", value: 3000000, valueLabel: "$3m" },
    itemB: { label: "Rolls-Royce Phantom", value: 500000, valueLabel: "$500k" },
  },
  {
    caption: "Which footballer scored more career goals?",
    metricLabel: "Career goals",
    itemA: { label: "Cristiano Ronaldo", value: 895, valueLabel: "895 goals" },
    itemB: { label: "Lionel Messi", value: 850, valueLabel: "850 goals" },
  },
  {
    caption: "Which footballer scored more career goals?",
    metricLabel: "Career goals",
    itemA: { label: "Pele", value: 762, valueLabel: "762 goals" },
    itemB: { label: "Romario", value: 772, valueLabel: "772 goals" },
  },
  {
    caption: "Which player has won more Grand Slam singles titles?",
    metricLabel: "Grand Slam titles",
    itemA: { label: "Novak Djokovic", value: 24, valueLabel: "24" },
    itemB: { label: "Rafael Nadal", value: 22, valueLabel: "22" },
  },
  {
    caption: "Which player has won more Grand Slam singles titles?",
    metricLabel: "Grand Slam titles",
    itemA: { label: "Serena Williams", value: 23, valueLabel: "23" },
    itemB: { label: "Steffi Graf", value: 22, valueLabel: "22" },
  },
  {
    caption: "Which player has won more Grand Slam singles titles?",
    metricLabel: "Grand Slam titles",
    itemA: { label: "Pete Sampras", value: 14, valueLabel: "14" },
    itemB: { label: "Andre Agassi", value: 8, valueLabel: "8" },
  },
  {
    caption: "Which player scored more career NBA points?",
    metricLabel: "Career points",
    itemA: { label: "LeBron James", value: 42184, valueLabel: "42,184 pts" },
    itemB: { label: "Kareem Abdul-Jabbar", value: 38387, valueLabel: "38,387 pts" },
  },
  {
    caption: "Which player scored more career NBA points?",
    metricLabel: "Career points",
    itemA: { label: "Michael Jordan", value: 32292, valueLabel: "32,292 pts" },
    itemB: { label: "Shaquille O'Neal", value: 28596, valueLabel: "28,596 pts" },
  },
  {
    caption: "Who has won more Olympic medals?",
    metricLabel: "Olympic medals",
    itemA: { label: "Michael Phelps", value: 28, valueLabel: "28 medals" },
    itemB: { label: "Usain Bolt", value: 8, valueLabel: "8 medals" },
  },
  {
    caption: "Which country has won more all-time Summer Olympic gold medals?",
    metricLabel: "Olympic golds",
    itemA: { label: "United States", value: 1105, valueLabel: "1,105 golds" },
    itemB: { label: "Great Britain", value: 298, valueLabel: "298 golds" },
  },
  {
    caption: "Which stadium has the larger capacity?",
    metricLabel: "Capacity",
    itemA: { label: "Camp Nou (Barcelona)", value: 99354, valueLabel: "99,354" },
    itemB: { label: "Wembley Stadium", value: 90000, valueLabel: "90,000" },
  },
  {
    caption: "Which stadium has the larger capacity?",
    metricLabel: "Capacity",
    itemA: { label: "Old Trafford", value: 74310, valueLabel: "74,310" },
    itemB: { label: "Anfield", value: 61276, valueLabel: "61,276" },
  },
  {
    caption: "Which stadium has the larger capacity?",
    metricLabel: "Capacity",
    itemA: { label: "Rungrado May Day Stadium (Pyongyang)", value: 114000, valueLabel: "114,000" },
    itemB: { label: "Melbourne Cricket Ground", value: 100024, valueLabel: "100,024" },
  },
  {
    caption: "Which happened more recently?",
    metricLabel: "Year",
    itemA: { label: "Fall of the Berlin Wall", value: 1989, valueLabel: "1989" },
    itemB: { label: "First Moon landing", value: 1969, valueLabel: "1969" },
  },
  {
    caption: "Which happened more recently?",
    metricLabel: "Year",
    itemA: { label: "Signing of Magna Carta", value: 1215, valueLabel: "1215" },
    itemB: { label: "Norman conquest of England", value: 1066, valueLabel: "1066" },
  },
  {
    caption: "Which happened more recently?",
    metricLabel: "Year",
    itemA: { label: "End of World War II", value: 1945, valueLabel: "1945" },
    itemB: { label: "Sinking of the Titanic", value: 1912, valueLabel: "1912" },
  },
  {
    caption: "Which happened more recently?",
    metricLabel: "Year",
    itemA: { label: "Launch of the iPhone", value: 2007, valueLabel: "2007" },
    itemB: { label: "Founding of Google", value: 1998, valueLabel: "1998" },
  },
  {
    caption: "Which British monarch reigned for longer?",
    metricLabel: "Reign length",
    itemA: { label: "Queen Elizabeth II", value: 70, valueLabel: "70 yrs" },
    itemB: { label: "Queen Victoria", value: 63, valueLabel: "63 yrs" },
  },
  {
    caption: "Which British monarch reigned for longer?",
    metricLabel: "Reign length",
    itemA: { label: "King George III", value: 59, valueLabel: "59 yrs" },
    itemB: { label: "King Henry VIII", value: 37, valueLabel: "37 yrs" },
  },
  {
    caption: "Which country has the higher life expectancy?",
    metricLabel: "Life expectancy",
    itemA: { label: "Japan", value: 84, valueLabel: "84 yrs" },
    itemB: { label: "United States", value: 77, valueLabel: "77 yrs" },
  },
  {
    caption: "Which country has the higher life expectancy?",
    metricLabel: "Life expectancy",
    itemA: { label: "Spain", value: 83, valueLabel: "83 yrs" },
    itemB: { label: "Brazil", value: 73, valueLabel: "73 yrs" },
  },
  {
    caption: "Which landmark was completed more recently?",
    metricLabel: "Year built",
    itemA: { label: "Burj Khalifa (Dubai)", value: 2010, valueLabel: "2010" },
    itemB: { label: "Eiffel Tower (Paris)", value: 1889, valueLabel: "1889" },
  },
  {
    caption: "Which landmark was completed more recently?",
    metricLabel: "Year built",
    itemA: { label: "Sydney Opera House", value: 1973, valueLabel: "1973" },
    itemB: { label: "Empire State Building", value: 1931, valueLabel: "1931" },
  },
  {
    caption: "Which book series sold more copies?",
    metricLabel: "Copies sold",
    itemA: { label: "Harry Potter series", value: 600000000, valueLabel: "600 million" },
    itemB: { label: "The Lord of the Rings", value: 150000000, valueLabel: "150 million" },
  },
  {
    caption: "Which book sold more copies?",
    metricLabel: "Copies sold",
    itemA: { label: "The Da Vinci Code", value: 80000000, valueLabel: "80 million" },
    itemB: { label: "The Hobbit", value: 100000000, valueLabel: "100 million" },
  },
  {
    caption: "Which food has more calories?",
    metricLabel: "Calories",
    itemA: { label: "Big Mac", value: 563, valueLabel: "563 kcal" },
    itemB: { label: "Glazed doughnut", value: 260, valueLabel: "260 kcal" },
  },
  {
    caption: "Which has more calories per 100g?",
    metricLabel: "Calories",
    itemA: { label: "Olive oil", value: 884, valueLabel: "884 kcal" },
    itemB: { label: "Milk chocolate", value: 535, valueLabel: "535 kcal" },
  },
  {
    caption: "Which drink has more caffeine?",
    metricLabel: "Caffeine",
    itemA: { label: "Espresso shot", value: 63, valueLabel: "63 mg" },
    itemB: { label: "Can of Coca-Cola", value: 34, valueLabel: "34 mg" },
  },
  {
    caption: "Which drink has more caffeine?",
    metricLabel: "Caffeine",
    itemA: { label: "Mug of brewed coffee", value: 95, valueLabel: "95 mg" },
    itemB: { label: "Can of Red Bull", value: 80, valueLabel: "80 mg" },
  },
  {
    caption: "Which animal is heavier on average?",
    metricLabel: "Weight",
    itemA: { label: "African elephant", value: 6000, valueLabel: "6,000 kg" },
    itemB: { label: "Hippopotamus", value: 1500, valueLabel: "1,500 kg" },
  },
];

(function assertNoEqual() {
  for (const e of ENTRIES) {
    if (e.itemA.value === e.itemB.value) {
      throw new Error(`Equal-value pair in HoL entries: ${e.itemA.label} vs ${e.itemB.label}`);
    }
  }
})();

function shuffleInPlace<T>(arr: T[], rng: RNG): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROUND_QUESTIONS = 30;

export function generateHoLQuestions(_level: number, seed: string): HoLQuestion[] {
  const rng = mulberry32(`${seed}::higher-lower`);
  const pool = shuffleInPlace([...ENTRIES], rng);
  const picked = pool.slice(0, Math.min(ROUND_QUESTIONS, pool.length));

  return picked.map((entry) => {
    const swap = rng() < 0.5;
    const left = swap ? entry.itemB : entry.itemA;
    const right = swap ? entry.itemA : entry.itemB;
    const answerIndex: 0 | 1 = right.value > left.value ? 1 : 0;
    return {
      caption: entry.caption,
      metricLabel: entry.metricLabel,
      left,
      right,
      answerIndex,
    };
  });
}
