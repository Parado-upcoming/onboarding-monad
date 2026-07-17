import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ASSETS,
  computeArenaStats,
  currentPrices,
  priceSeries,
  STARTING_CAPITAL,
  type AssetSymbol,
} from "@/lib/engines/trading-engine";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const portfolio = await prisma.portfolio.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, cashBalance: STARTING_CAPITAL },
  });

  const trades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  const prices = currentPrices();
  const stats = computeArenaStats(trades, prices, portfolio.cashBalance);

  const chartAssetParam = req.nextUrl.searchParams.get("asset");
  const chartAsset: AssetSymbol = (ASSETS.find((a) => a.symbol === chartAssetParam)?.symbol ??
    "MON") as AssetSymbol;

  return NextResponse.json({
    cashBalance: portfolio.cashBalance,
    prices,
    stats,
    trades: trades
      .slice()
      .reverse()
      .slice(0, 20)
      .map((t) => ({
        id: t.id,
        asset: t.asset,
        side: t.side,
        quantity: t.quantity,
        price: t.price,
        createdAt: t.createdAt,
      })),
    chart: { asset: chartAsset, series: priceSeries(chartAsset, 96) },
    assets: ASSETS,
  });
}
