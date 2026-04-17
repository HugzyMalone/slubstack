import { ActorBlitz } from "@/components/trivia/ActorBlitz";

export interface ActorData {
  name: string;
  image: string;
  decoys: string[];
}

const ACTOR_CONFIGS: { name: string; decoys: string[] }[] = [
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
];

async function fetchActors(): Promise<ActorData[]> {
  const results = await Promise.allSettled(
    ACTOR_CONFIGS.map(async ({ name, decoys }) => {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const image: string | undefined = data.thumbnail?.source;
      if (!image) return null;
      // Use a larger size by replacing the width in the URL
      const bigImage = image.replace(/\/\d+px-/, "/400px-");
      const proxied = `/api/img?url=${encodeURIComponent(bigImage)}`;
      return { name, image: proxied, decoys } satisfies ActorData;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ActorData> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}

export default async function ActorsPage() {
  const actors = await fetchActors();
  return <ActorBlitz actors={actors} />;
}
