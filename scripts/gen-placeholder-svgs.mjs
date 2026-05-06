import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(process.cwd());

function hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function colours(seed) {
  const hue = hash(seed) % 360;
  return { bg: `hsl(${hue} 65% 45%)`, fg: `hsl(${hue} 65% 95%)` };
}

function escape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function flagSvg(iso2, name) {
  const { bg, fg } = colours(iso2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
  <rect width="200" height="120" fill="${bg}"/>
  <text x="100" y="68" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="${fg}">${escape(name)}</text>
</svg>
`;
}

function posterSvg(id, title, year) {
  const { bg, fg } = colours(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
  <rect width="200" height="300" fill="${bg}"/>
  <text x="100" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="800" fill="${fg}" letter-spacing="2">POSTER</text>
  <text x="100" y="160" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="${fg}">${escape(title)}</text>
  <text x="100" y="200" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="${fg}" opacity="0.85">${year}</text>
</svg>
`;
}

function albumSvg(id, title) {
  const { bg, fg } = colours(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
  <rect width="200" height="200" fill="${bg}"/>
  <text x="100" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="${fg}" letter-spacing="2">ALBUM</text>
  <text x="100" y="120" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="${fg}">${escape(title)}</text>
</svg>
`;
}

function logoSvg(id, brand) {
  const { bg, fg } = colours(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
  <rect width="200" height="120" fill="${bg}"/>
  <text x="100" y="50" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="${fg}" letter-spacing="2" opacity="0.8">LOGO</text>
  <text x="100" y="80" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="800" fill="${fg}">${escape(brand)}</text>
</svg>
`;
}

function write(path, content) {
  const full = resolve(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

const FLAGS = [
  ["fr", "France"], ["de", "Germany"], ["it", "Italy"], ["es", "Spain"], ["gb", "United Kingdom"],
  ["jp", "Japan"], ["br", "Brazil"], ["ar", "Argentina"], ["ca", "Canada"], ["us", "United States"],
  ["in", "India"], ["cn", "China"], ["au", "Australia"], ["nz", "New Zealand"], ["za", "South Africa"],
  ["tr", "Turkey"], ["se", "Sweden"], ["no", "Norway"], ["ch", "Switzerland"], ["kr", "South Korea"],
];
for (const [iso2, name] of FLAGS) write(`public/flags/${iso2}.svg`, flagSvg(iso2, name));

const POSTERS = [
  ["godfather", "The Godfather", 1972],
  ["jaws", "Jaws", 1975],
  ["star-wars", "Star Wars", 1977],
  ["alien", "Alien", 1979],
  ["blade-runner", "Blade Runner", 1982],
  ["back-to-the-future", "Back to the Future", 1985],
  ["die-hard", "Die Hard", 1988],
  ["goodfellas", "Goodfellas", 1990],
  ["silence-of-the-lambs", "Silence of the Lambs", 1991],
  ["pulp-fiction", "Pulp Fiction", 1994],
  ["shawshank", "Shawshank Redemption", 1994],
  ["titanic", "Titanic", 1997],
  ["matrix", "The Matrix", 1999],
  ["gladiator", "Gladiator", 2000],
  ["lotr-fellowship", "LOTR Fellowship", 2001],
  ["dark-knight", "The Dark Knight", 2008],
  ["inception", "Inception", 2010],
  ["mad-max-fury-road", "Mad Max Fury Road", 2015],
  ["parasite", "Parasite", 2019],
  ["everything-everywhere", "Everything Everywhere", 2022],
];
for (const [id, title, year] of POSTERS) write(`public/posters/${id}.svg`, posterSvg(id, title, year));

const ALBUMS = [
  ["dark-side-of-the-moon", "Dark Side of the Moon"],
  ["abbey-road", "Abbey Road"],
  ["thriller", "Thriller"],
  ["back-in-black", "Back in Black"],
  ["rumours", "Rumours"],
  ["nevermind", "Nevermind"],
  ["ok-computer", "OK Computer"],
  ["the-chronic", "The Chronic"],
  ["illmatic", "Illmatic"],
  ["ready-to-die", "Ready to Die"],
  ["to-pimp-a-butterfly", "To Pimp a Butterfly"],
  ["lemonade", "Lemonade"],
  ["21", "21"],
  ["1989", "1989"],
  ["discovery", "Discovery"],
  ["homework", "Homework"],
  ["random-access-memories", "Random Access Memories"],
  ["four-seasons", "The Four Seasons"],
  ["ninth-symphony", "Symphony No. 9"],
  ["kind-of-blue", "Kind of Blue"],
];
for (const [id, title] of ALBUMS) write(`public/albums/${id}.svg`, albumSvg(id, title));

const LOGOS = [
  ["apple", "Apple"], ["google", "Google"], ["microsoft", "Microsoft"], ["amazon", "Amazon"],
  ["meta", "Meta"], ["netflix", "Netflix"], ["spotify", "Spotify"], ["nike", "Nike"],
  ["adidas", "Adidas"], ["coca-cola", "Coca-Cola"], ["pepsi", "Pepsi"], ["mcdonalds", "McDonald's"],
  ["starbucks", "Starbucks"], ["ferrari", "Ferrari"], ["lamborghini", "Lamborghini"], ["bmw", "BMW"],
  ["tesla", "Tesla"], ["louis-vuitton", "Louis Vuitton"], ["gucci", "Gucci"], ["chanel", "Chanel"],
];
for (const [id, brand] of LOGOS) write(`public/logos/${id}.svg`, logoSvg(id, brand));

console.log("flags:", FLAGS.length);
console.log("posters:", POSTERS.length);
console.log("albums:", ALBUMS.length);
console.log("logos:", LOGOS.length);
