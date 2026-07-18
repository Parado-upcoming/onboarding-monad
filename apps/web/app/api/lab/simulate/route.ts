import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ASSETS, priceAt } from "@/lib/engines/trading-engine";
import { simulateLiquidityPool } from "@/lib/engines/lab-engine";

const schema = z.object({
  asset: z.enum(ASSETS.map((a) => a.symbol) as [string, ...string[]]),
  depositValueUsd: z.number().positive().max(1_000_000),
  horizonDays: z.number().positive().max(365),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { asset, depositValueUsd, horizonDays } = parsed.data;

  const now = new Date();
  const exitDate = new Date(now.getTime() + horizonDays * 86_400_000);
  const entryPrice = priceAt(asset as (typeof ASSETS)[number]["symbol"], now);
  const exitPrice = priceAt(asset as (typeof ASSETS)[number]["symbol"], exitDate);

  const result = simulateLiquidityPool(depositValueUsd, entryPrice, exitPrice, asset, horizonDays);

  const priorSimCount = await prisma.labSession.count({ where: { userId: user.id } });
  const isFirst = priorSimCount === 0;
  const xpAwarded = isFirst ? 100 : 15;

  await prisma.$transaction([
    prisma.labSession.create({
      data: {
        userId: user.id,
        poolPair: `${asset}/USD`,
        depositValueUsd,
        feesEarned: result.feesEarnedUsd,
        impermanentLoss: result.impermanentLossPct,
        netResult: result.netResultUsd,
        closedAt: now,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: xpAwarded },
        skillDefi: { increment: isFirst ? 10 : 2 },
      },
    }),
  ]);

  return NextResponse.json({ result, xpAwarded });
}
