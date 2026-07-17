export interface ArenaLeaderboardEntry {
  walletAddress: string;
  displayName: string | null;
  roi: number;
  winRate: number | null;
  maxDrawdownPct: number;
  totalTrades: number;
  portfolioValue: number;
}

export interface ArenaCategoryWinner {
  key: string;
  label: string;
  emoji: string;
  walletAddress: string;
  displayName: string | null;
  value: string;
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;
}

/**
 * Humor-flavored Arena categories. Deliberately not just "highest ROI wins everything" —
 * a lucky degenerate and a disciplined risk manager both get their own spotlight.
 */
export function computeArenaCategories(entries: ArenaLeaderboardEntry[]): ArenaCategoryWinner[] {
  const traded = entries.filter((e) => e.totalTrades > 0);
  if (!traded.length) return [];
  const categories: ArenaCategoryWinner[] = [];

  const byRiskAdjustedDesc = [...traded].sort(
    (a, b) => b.roi / (b.maxDrawdownPct + 0.01) - a.roi / (a.maxDrawdownPct + 0.01),
  );
  const best = byRiskAdjustedDesc[0];
  categories.push({
    key: "best-trader",
    label: "Best Trader",
    emoji: "🏆",
    walletAddress: best.walletAddress,
    displayName: best.displayName,
    value: `${pct(best.roi)} ROI, ${(best.maxDrawdownPct * 100).toFixed(0)}% max DD`,
  });

  const byRoiDesc = [...traded].sort((a, b) => b.roi - a.roi);
  categories.push({
    key: "highest-roi",
    label: "Highest ROI",
    emoji: "🚀",
    walletAddress: byRoiDesc[0].walletAddress,
    displayName: byRoiDesc[0].displayName,
    value: pct(byRoiDesc[0].roi),
  });

  const byDrawdownAsc = [...traded].sort((a, b) => a.maxDrawdownPct - b.maxDrawdownPct);
  categories.push({
    key: "lowest-drawdown",
    label: "Best Risk Manager",
    emoji: "🛡️",
    walletAddress: byDrawdownAsc[0].walletAddress,
    displayName: byDrawdownAsc[0].displayName,
    value: `${(byDrawdownAsc[0].maxDrawdownPct * 100).toFixed(1)}% max drawdown`,
  });

  const withWinRate = traded.filter((e) => e.winRate != null);
  if (withWinRate.length) {
    const byWinRateDesc = [...withWinRate].sort((a, b) => b.winRate! - a.winRate!);
    categories.push({
      key: "most-consistent",
      label: "Most Consistent",
      emoji: "🎯",
      walletAddress: byWinRateDesc[0].walletAddress,
      displayName: byWinRateDesc[0].displayName,
      value: `${(byWinRateDesc[0].winRate! * 100).toFixed(0)}% win rate`,
    });
  }

  const byTradesDesc = [...traded].sort((a, b) => b.totalTrades - a.totalTrades);
  categories.push({
    key: "biggest-degenerate",
    label: "Biggest Degenerate",
    emoji: "🎰",
    walletAddress: byTradesDesc[0].walletAddress,
    displayName: byTradesDesc[0].displayName,
    value: `${byTradesDesc[0].totalTrades} trades`,
  });

  const worst = byRoiDesc[byRoiDesc.length - 1];
  if (worst.roi < 0) {
    categories.push({
      key: "exit-liquidity",
      label: "Exit Liquidity Provider",
      emoji: "🩹",
      walletAddress: worst.walletAddress,
      displayName: worst.displayName,
      value: pct(worst.roi),
    });
  }

  return categories;
}
