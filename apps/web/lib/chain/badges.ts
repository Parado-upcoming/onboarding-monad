/** Flagship achievements get an on-chain badge NFT in addition to the registry record. Keep in sync with contracts/test/OnboardingBadge.t.sol constants. */
export const FLAGSHIP_BADGE_TYPES: Record<string, number> = {
  "first-swap": 0,
  "monad-pioneer": 1,
  "debate-champion": 2,
};

export function badgeTypeFor(achievementId: string): number | undefined {
  return FLAGSHIP_BADGE_TYPES[achievementId];
}
