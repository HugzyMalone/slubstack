import { ActorBlitz } from "@/components/trivia/ActorBlitz";

export interface ActorData {
  name: string;
  image: string;
  decoys: string[];
}

const ACTOR_CONFIGS: { name: string; decoys: string[] }[] = [
  // — existing actors (images in /public/actors/) —
  { name: "Tom Hanks", decoys: ["Kevin Costner", "Bill Murray", "Jeff Bridges"] },
  { name: "Morgan Freeman", decoys: ["Denzel Washington", "Samuel L. Jackson", "Laurence Fishburne"] },
  { name: "Denzel Washington", decoys: ["Morgan Freeman", "Samuel L. Jackson", "Forest Whitaker"] },
  { name: "Samuel L. Jackson", decoys: ["Morgan Freeman", "Denzel Washington", "Laurence Fishburne"] },
  { name: "Brad Pitt", decoys: ["Johnny Depp", "Matt Damon", "Leonardo DiCaprio"] },
  { name: "Leonardo DiCaprio", decoys: ["Brad Pitt", "Matt Damon", "Tobey Maguire"] },
  { name: "Matt Damon", decoys: ["Leonardo DiCaprio", "Ben Affleck", "Brad Pitt"] },
  { name: "Johnny Depp", decoys: ["Brad Pitt", "Keanu Reeves", "Nicolas Cage"] },
  { name: "Keanu Reeves", decoys: ["Johnny Depp", "Brad Pitt", "Nicolas Cage"] },
  { name: "Will Smith", decoys: ["Denzel Washington", "Eddie Murphy", "Jamie Foxx"] },
  { name: "Tom Cruise", decoys: ["Brad Pitt", "Will Smith", "Mel Gibson"] },
  { name: "Harrison Ford", decoys: ["Clint Eastwood", "Tommy Lee Jones", "Jeff Bridges"] },
  { name: "Robert De Niro", decoys: ["Al Pacino", "Jack Nicholson", "Harvey Keitel"] },
  { name: "Al Pacino", decoys: ["Robert De Niro", "Jack Nicholson", "Harvey Keitel"] },
  { name: "Jack Nicholson", decoys: ["Al Pacino", "Robert De Niro", "Gene Hackman"] },
  { name: "Jim Carrey", decoys: ["Robin Williams", "Steve Martin", "Bill Murray"] },
  { name: "Robin Williams", decoys: ["Jim Carrey", "Billy Crystal", "Steve Martin"] },
  { name: "Eddie Murphy", decoys: ["Will Smith", "Chris Rock", "Martin Lawrence"] },
  { name: "Meryl Streep", decoys: ["Glenn Close", "Helen Mirren", "Cate Blanchett"] },
  { name: "Julia Roberts", decoys: ["Sandra Bullock", "Jennifer Aniston", "Reese Witherspoon"] },
  { name: "Sandra Bullock", decoys: ["Julia Roberts", "Jennifer Aniston", "Reese Witherspoon"] },
  { name: "Cate Blanchett", decoys: ["Meryl Streep", "Nicole Kidman", "Julianne Moore"] },
  { name: "Nicole Kidman", decoys: ["Cate Blanchett", "Naomi Watts", "Julianne Moore"] },
  { name: "Charlize Theron", decoys: ["Cameron Diaz", "Nicole Kidman", "Halle Berry"] },
  { name: "Halle Berry", decoys: ["Angelina Jolie", "Charlize Theron", "Thandiwe Newton"] },
  { name: "Angelina Jolie", decoys: ["Charlize Theron", "Megan Fox", "Halle Berry"] },
  { name: "Natalie Portman", decoys: ["Keira Knightley", "Scarlett Johansson", "Emma Watson"] },
  { name: "Scarlett Johansson", decoys: ["Natalie Portman", "Emma Stone", "Jennifer Lawrence"] },
  { name: "Jennifer Lawrence", decoys: ["Emma Stone", "Scarlett Johansson", "Amy Adams"] },
  { name: "Emma Stone", decoys: ["Jennifer Lawrence", "Scarlett Johansson", "Emma Roberts"] },
  { name: "Reese Witherspoon", decoys: ["Jennifer Aniston", "Julia Roberts", "Cameron Diaz"] },
  { name: "Viola Davis", decoys: ["Octavia Spencer", "Taraji P. Henson", "Angela Bassett"] },

  // — additional actors (add matching JPGs to /public/actors/) —
  { name: "Chris Evans", decoys: ["Chris Hemsworth", "Chris Pratt", "Ryan Reynolds"] },
  { name: "Chris Hemsworth", decoys: ["Chris Evans", "Chris Pratt", "Hugh Jackman"] },
  { name: "Chris Pratt", decoys: ["Ryan Reynolds", "Chris Evans", "Chris Hemsworth"] },
  { name: "Ryan Reynolds", decoys: ["Chris Pratt", "Ryan Gosling", "Chris Evans"] },
  { name: "Ryan Gosling", decoys: ["Ryan Reynolds", "Jake Gyllenhaal", "Timothée Chalamet"] },
  { name: "Robert Downey Jr.", decoys: ["Chris Evans", "Mark Ruffalo", "Benedict Cumberbatch"] },
  { name: "Hugh Jackman", decoys: ["Chris Hemsworth", "Ryan Reynolds", "Russell Crowe"] },
  { name: "Dwayne Johnson", decoys: ["Vin Diesel", "John Cena", "Jason Statham"] },
  { name: "Ben Affleck", decoys: ["Matt Damon", "Bradley Cooper", "Jake Gyllenhaal"] },
  { name: "Bradley Cooper", decoys: ["Ben Affleck", "Jake Gyllenhaal", "Ryan Gosling"] },
  { name: "Jake Gyllenhaal", decoys: ["Ryan Gosling", "Tobey Maguire", "Matt Damon"] },
  { name: "Joaquin Phoenix", decoys: ["Jake Gyllenhaal", "Jared Leto", "Casey Affleck"] },
  { name: "Benedict Cumberbatch", decoys: ["Tom Hiddleston", "Daniel Craig", "Hugh Grant"] },
  { name: "Timothée Chalamet", decoys: ["Ryan Gosling", "Finn Wolfhard", "Ansel Elgort"] },
  { name: "Margot Robbie", decoys: ["Charlize Theron", "Emma Stone", "Amy Adams"] },
  { name: "Emily Blunt", decoys: ["Cate Blanchett", "Rachel Weisz", "Keira Knightley"] },
  { name: "Amy Adams", decoys: ["Isla Fisher", "Emma Stone", "Bryce Dallas Howard"] },
  { name: "Keira Knightley", decoys: ["Natalie Portman", "Carey Mulligan", "Felicity Jones"] },
  { name: "Rachel McAdams", decoys: ["Isla Fisher", "Emma Stone", "Blake Lively"] },
  { name: "Megan Fox", decoys: ["Mila Kunis", "Zoe Saldana", "Olivia Wilde"] },
  { name: "Mila Kunis", decoys: ["Megan Fox", "Natalie Portman", "Anne Hathaway"] },
  { name: "Anne Hathaway", decoys: ["Emily Blunt", "Amanda Seyfried", "Mila Kunis"] },
  { name: "Kate Winslet", decoys: ["Cate Blanchett", "Meryl Streep", "Rachel Weisz"] },
  { name: "Zoe Saldana", decoys: ["Halle Berry", "Thandiwe Newton", "Megan Fox"] },
  { name: "Jennifer Aniston", decoys: ["Courteney Cox", "Reese Witherspoon", "Sandra Bullock"] },
  { name: "Clint Eastwood", decoys: ["Harrison Ford", "Tommy Lee Jones", "Gene Hackman"] },
  { name: "Mel Gibson", decoys: ["Russell Crowe", "Tom Cruise", "Kevin Costner"] },
  { name: "Russell Crowe", decoys: ["Mel Gibson", "Hugh Jackman", "Gerard Butler"] },
  { name: "Arnold Schwarzenegger", decoys: ["Sylvester Stallone", "Dwayne Johnson", "Bruce Willis"] },
  { name: "Sylvester Stallone", decoys: ["Arnold Schwarzenegger", "Bruce Willis", "Vin Diesel"] },
  { name: "Bruce Willis", decoys: ["Sylvester Stallone", "Arnold Schwarzenegger", "Samuel L. Jackson"] },
  { name: "Nicolas Cage", decoys: ["Johnny Depp", "John Travolta", "Gary Oldman"] },
  { name: "Gary Oldman", decoys: ["Nicolas Cage", "Anthony Hopkins", "Michael Caine"] },
  { name: "Anthony Hopkins", decoys: ["Gary Oldman", "Michael Caine", "Ian McKellen"] },
  { name: "Michael Caine", decoys: ["Anthony Hopkins", "Gary Oldman", "Ian McKellen"] },
  { name: "Judi Dench", decoys: ["Helen Mirren", "Meryl Streep", "Maggie Smith"] },
  { name: "Helen Mirren", decoys: ["Judi Dench", "Maggie Smith", "Glenn Close"] },
];

function buildActors(): ActorData[] {
  return ACTOR_CONFIGS.map(({ name, decoys }) => {
    const filename = name.replace(/ /g, "_").toLowerCase() + ".jpg";
    return { name, image: `/actors/${filename}`, decoys };
  });
}

export default function ActorsPage() {
  const actors = buildActors();
  return <ActorBlitz actors={actors} />;
}
