import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ASSETS, currentPrices, STARTING_CAPITAL } from "@/lib/engines/trading-engine";

const tradeSchema = z.object({
  asset: z.enum(ASSETS.map((a) => a.symbol) as [string, ...string[]]),
  side: z.enum(["BUY", "SELL"]),
  amountUsd: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  sellAll: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const parsed = tradeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { asset, side, amountUsd, quantity, sellAll } = parsed.data;
  const price = currentPrices()[asset as keyof ReturnType<typeof currentPrices>];

  const portfolio = await prisma.portfolio.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, cashBalance: STARTING_CAPITAL },
  });

  const existingTrades = await prisma.trade.findMany({
    where: { userId: user.id, asset },
  });
  const netHeld = existingTrades.reduce(
    (s, t) => s + (t.side === "BUY" ? t.quantity : -t.quantity),
    0,
  );

  let tradeQuantity: number;
  let cashDelta: number;

  if (side === "BUY") {
    if (!amountUsd) {
      return NextResponse.json({ error: "amountUsd_required" }, { status: 400 });
    }
    if (amountUsd > portfolio.cashBalance) {
      return NextResponse.json({ error: "insufficient_cash" }, { status: 400 });
    }
    tradeQuantity = amountUsd / price;
    cashDelta = -amountUsd;
  } else {
    tradeQuantity = sellAll ? netHeld : (quantity ?? 0);
    if (tradeQuantity <= 0 || tradeQuantity > netHeld + 1e-9) {
      return NextResponse.json({ error: "insufficient_holdings" }, { status: 400 });
    }
    cashDelta = tradeQuantity * price;
  }

  const newCashBalance = portfolio.cashBalance + cashDelta;
  const totalTradesBefore = await prisma.trade.count({ where: { userId: user.id } });
  const isFirstTrade = totalTradesBefore === 0;

  // Portfolio value after this trade = new cash + all holdings (including this trade) at current prices.
  const prices = currentPrices();
  const allTrades = await prisma.trade.findMany({ where: { userId: user.id } });
  const holdingsByAsset: Record<string, number> = {};
  for (const t of [...allTrades, { asset, side, quantity: tradeQuantity }]) {
    holdingsByAsset[t.asset] =
      (holdingsByAsset[t.asset] ?? 0) + (t.side === "BUY" ? t.quantity : -t.quantity);
  }
  const holdingsValue = Object.entries(holdingsByAsset).reduce(
    (s, [sym, qty]) => s + qty * (prices[sym as keyof typeof prices] ?? 0),
    0,
  );
  const portfolioValueAfter = newCashBalance + holdingsValue;

  const [, trade] = await prisma.$transaction([
    prisma.portfolio.update({
      where: { userId: user.id },
      data: { cashBalance: newCashBalance },
    }),
    prisma.trade.create({
      data: {
        userId: user.id,
        asset,
        side,
        quantity: tradeQuantity,
        price,
        portfolioValueAfter,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { skillTrading: { increment: 2 } },
    }),
    ...(isFirstTrade
      ? [
          prisma.achievement.upsert({
            where: { userId_achievementId: { userId: user.id, achievementId: "first-swap" } },
            update: {},
            create: { userId: user.id, achievementId: "first-swap" },
          }),
          prisma.user.update({ where: { id: user.id }, data: { xp: { increment: 50 } } }),
        ]
      : []),
  ]);

  return NextResponse.json({
    trade: {
      id: trade.id,
      asset: trade.asset,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
    },
    cashBalance: newCashBalance,
    firstTradeAchievement: isFirstTrade,
  });
}
