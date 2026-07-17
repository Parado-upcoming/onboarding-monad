import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toPlayerProfile } from "@/lib/engines/progression";
import { computeArenaStats, currentPrices } from "@/lib/engines/trading-engine";
import { computeArenaCategories, type ArenaLeaderboardEntry } from "@/lib/engines/leaderboard";

export async function GET() {
  const topByXp = await prisma.user.findMany({
    orderBy: { xp: "desc" },
    take: 50,
    include: {
      _count: { select: { questProgress: { where: { status: "COMPLETED" } } } },
    },
  });

  const portfolios = await prisma.portfolio.findMany({
    include: { user: { include: { trades: true } } },
  });

  const prices = currentPrices();
  const arenaEntries: ArenaLeaderboardEntry[] = portfolios.map((p) => {
    const stats = computeArenaStats(p.user.trades, prices, p.cashBalance);
    return {
      walletAddress: p.user.walletAddress,
      displayName: p.user.displayName,
      roi: stats.roi,
      winRate: stats.winRate,
      maxDrawdownPct: stats.maxDrawdownPct,
      totalTrades: stats.totalTrades,
      portfolioValue: stats.portfolioValue,
    };
  });

  arenaEntries.sort((a, b) => b.roi - a.roi);

  return NextResponse.json({
    xp: topByXp.map((u) => ({
      ...toPlayerProfile(u),
      questsCompleted: u._count.questProgress,
    })),
    arena: {
      entries: arenaEntries,
      categories: computeArenaCategories(arenaEntries),
    },
  });
}
