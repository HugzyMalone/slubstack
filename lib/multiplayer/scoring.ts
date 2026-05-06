export type ScoreResult = { correct: boolean; points: number };

export type ScoringRule<Q, A> = (answer: A, question: Q) => ScoreResult;

export function binary<Q extends { answer: unknown }, A>(
  equals: (a: A, q: Q) => boolean = (a, q) => (a as unknown) === q.answer,
  pointsPerCorrect: number = 1
): ScoringRule<Q, A> {
  return (answer, question) => {
    const correct = equals(answer, question);
    return { correct, points: correct ? pointsPerCorrect : 0 };
  };
}

export function closeness(
  actualOf: (q: unknown) => number,
  options: { maxPoints?: number; perUnit?: number; correctWithin?: number } = {}
): ScoringRule<unknown, number> {
  const { maxPoints = 100, perUnit = 5, correctWithin = 0 } = options;
  return (answer, question) => {
    const diff = Math.abs(answer - actualOf(question));
    const points = Math.max(0, maxPoints - perUnit * diff);
    return { correct: diff <= correctWithin, points };
  };
}
