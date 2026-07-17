import type { Prisma, TradeDebate } from "@prisma/client";
import { prisma } from "@/lib/db";
import { priceAt, type AssetSymbol } from "@/lib/engines/trading-engine";
import { resolveDebateOutcome, DEBATE_XP, type DebatePosition } from "@/lib/engines/debate-engine";

/** Resolves an expired, challenged debate in place if it hasn't been resolved yet. Safe to call repeatedly. */
export async function maybeResolveDebate(debate: TradeDebate): Promise<TradeDebate> {
  if (
    debate.outcome !== "PENDING" ||
    !debate.challengerId ||
    !debate.challengerPosition ||
    debate.expiresAt > new Date()
  ) {
    return debate;
  }

  const resolutionPrice = priceAt(debate.asset as AssetSymbol, debate.expiresAt);
  const outcome = resolveDebateOutcome(
    debate.startPrice,
    resolutionPrice,
    debate.creatorPosition as DebatePosition,
    debate.challengerPosition as DebatePosition,
  );

  const winnerId =
    outcome === "CREATOR_WON" ? debate.creatorId : outcome === "CHALLENGER_WON" ? debate.challengerId : null;
  const loserId =
    outcome === "CREATOR_WON" ? debate.challengerId : outcome === "CHALLENGER_WON" ? debate.creatorId : null;

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.tradeDebate.update({
      where: { id: debate.id },
      data: { outcome, resolutionPrice, resolvedAt: new Date() },
    }),
  ];

  if (outcome === "DRAW") {
    ops.push(
      prisma.user.update({
        where: { id: debate.creatorId },
        data: { xp: { increment: DEBATE_XP.draw } },
      }),
      prisma.user.update({
        where: { id: debate.challengerId },
        data: { xp: { increment: DEBATE_XP.draw } },
      }),
    );
  } else if (winnerId && loserId) {
    ops.push(
      prisma.user.update({
        where: { id: winnerId },
        data: {
          xp: { increment: DEBATE_XP.win },
          skillTrading: { increment: 5 },
          skillRiskManagement: { increment: 3 },
        },
      }),
      prisma.user.update({
        where: { id: loserId },
        data: { xp: { increment: DEBATE_XP.participate } },
      }),
      prisma.achievement.upsert({
        where: { userId_achievementId: { userId: winnerId, achievementId: "debate-champion" } },
        update: {},
        create: { userId: winnerId, achievementId: "debate-champion" },
      }),
    );
  }

  const [updated] = await prisma.$transaction(ops);
  return updated as TradeDebate;
}
