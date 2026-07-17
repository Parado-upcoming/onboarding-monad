export type DebatePosition = "BULLISH" | "BEARISH" | "NEUTRAL";
export type DebateOutcome = "PENDING" | "CREATOR_WON" | "CHALLENGER_WON" | "DRAW";

/** Moves smaller than this are considered "flat" -- a NEUTRAL call, not noise favoring either side. */
const FLAT_THRESHOLD = 0.005;

export function marketDirection(startPrice: number, resolutionPrice: number): DebatePosition {
  const change = (resolutionPrice - startPrice) / startPrice;
  if (change > FLAT_THRESHOLD) return "BULLISH";
  if (change < -FLAT_THRESHOLD) return "BEARISH";
  return "NEUTRAL";
}

export function resolveDebateOutcome(
  startPrice: number,
  resolutionPrice: number,
  creatorPosition: DebatePosition,
  challengerPosition: DebatePosition,
): DebateOutcome {
  const direction = marketDirection(startPrice, resolutionPrice);
  const creatorCorrect = creatorPosition === direction;
  const challengerCorrect = challengerPosition === direction;

  if (creatorCorrect && !challengerCorrect) return "CREATOR_WON";
  if (challengerCorrect && !creatorCorrect) return "CHALLENGER_WON";
  return "DRAW";
}

export const DEBATE_XP = {
  win: 150,
  draw: 50,
  participate: 20,
};
