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

const BOT_LADDER_RATING: Record<number, number> = { 1: 1100, 2: 1250, 3: 1400 };

export function botRatingForLevel(level: number): number {
  return BOT_LADDER_RATING[level] ?? 1200;
}

// Solo ranked: rate a lone human against the replay bots so the ladder moves at
// low player counts. K is halved versus the human-vs-human path, and beating a
// bot you already out-rate yields ~0 (expected → 1) while losses still cost —
// so it self-limits without needing per-day caps or extra state.
export function updateRatingsVsBots(human: EloPlayer, bots: EloPlayer[]): EloUpdate {
  const k = (human.matches < 30 ? 32 : 16) / 2;
  let delta = 0;
  for (const b of bots) {
    const expected = 1 / (1 + 10 ** ((b.rating - human.rating) / 400));
    const actual = human.score > b.score ? 1 : human.score < b.score ? 0 : 0.5;
    delta += k * (actual - expected);
  }
  const after = Math.round(human.rating + delta);
  return { userId: human.userId, before: human.rating, after, delta: after - human.rating };
}
