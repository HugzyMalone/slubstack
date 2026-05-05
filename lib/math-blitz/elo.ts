export type EloPlayer = {
  userId: string;
  rating: number;
  matches: number;
  score: number;
  isBot: boolean;
};

export type EloUpdate = {
  userId: string;
  before: number;
  after: number;
  delta: number;
};

export function updateRatings(players: EloPlayer[]): EloUpdate[] {
  const humans = players.filter((p) => !p.isBot);
  if (humans.length < 2) return [];

  return humans.map((p) => {
    const k = p.matches < 30 ? 32 : 16;
    let delta = 0;
    for (const q of humans) {
      if (q.userId === p.userId) continue;
      const expected = 1 / (1 + 10 ** ((q.rating - p.rating) / 400));
      const actual = p.score > q.score ? 1 : p.score < q.score ? 0 : 0.5;
      delta += k * (actual - expected);
    }
    const after = Math.round(p.rating + delta);
    return { userId: p.userId, before: p.rating, after, delta: after - p.rating };
  });
}
