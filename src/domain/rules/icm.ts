/**
 * Malmuth-Harville ICM: expected equity of each stack given a payout
 * schedule. Probability of finishing in the next paid position is
 * proportional to remaining chip share; recursion continues for each
 * subsequent position. Memoized on (position, remaining-indices) since the
 * remaining-indices array is always in ascending original-index order
 * regardless of elimination path, making it a valid cache key for the set.
 */
export function calculateICM(stacks: number[], payouts: number[]): number[] {
  const n = stacks.length;
  if (n === 0) return [];

  const paidPositions = Math.min(payouts.length, n);
  const memo = new Map<string, number[]>();

  function equityForRemaining(
    remaining: number[],
    position: number,
  ): number[] {
    if (position >= paidPositions || remaining.length === 0) {
      return remaining.map(() => 0);
    }

    const key = `${position}:${remaining.join(',')}`;
    const cached = memo.get(key);
    if (cached) return cached;

    const remainingTotal = remaining.reduce((sum, i) => sum + stacks[i], 0);
    const result = remaining.map(() => 0);

    for (let idx = 0; idx < remaining.length; idx++) {
      const playerIndex = remaining[idx];
      const probFinishesHere =
        remainingTotal > 0 ? stacks[playerIndex] / remainingTotal : 0;
      if (probFinishesHere <= 0) continue;

      result[idx] += probFinishesHere * payouts[position];

      const rest = remaining.filter((_, j) => j !== idx);
      const subEquity = equityForRemaining(rest, position + 1);
      rest.forEach((_, restIdx) => {
        const originalIdx = restIdx < idx ? restIdx : restIdx + 1;
        result[originalIdx] += probFinishesHere * subEquity[restIdx];
      });
    }

    memo.set(key, result);
    return result;
  }

  const allIndices = stacks.map((_, i) => i);
  return equityForRemaining(allIndices, 0);
}
