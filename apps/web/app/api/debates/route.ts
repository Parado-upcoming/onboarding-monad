import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ASSETS, priceAt } from "@/lib/engines/trading-engine";
import { maybeResolveDebate } from "@/lib/debates/resolve-debate";

const POSITIONS = ["BULLISH", "BEARISH", "NEUTRAL"] as const;

const debateInclude = { creator: true, challenger: true } as const;

type DebateWithUsers = Prisma.TradeDebateGetPayload<{ include: typeof debateInclude }>;

function serializeDebate(d: DebateWithUsers) {
  return {
    id: d.id,
    asset: d.asset,
    timeframeHours: d.timeframeHours,
    creator: { walletAddress: d.creator.walletAddress, displayName: d.creator.displayName },
    creatorPosition: d.creatorPosition,
    thesis: d.thesis,
    challenger: d.challenger
      ? { walletAddress: d.challenger.walletAddress, displayName: d.challenger.displayName }
      : null,
    challengerPosition: d.challengerPosition,
    challengerThesis: d.challengerThesis,
    startPrice: d.startPrice,
    resolutionPrice: d.resolutionPrice,
    outcome: d.outcome,
    createdAt: d.createdAt,
    expiresAt: d.expiresAt,
    resolvedAt: d.resolvedAt,
  };
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const [openRaw, mineRaw] = await Promise.all([
    prisma.tradeDebate.findMany({
      where: { challengerId: null, creatorId: { not: user.id }, expiresAt: { gt: new Date() } },
      include: debateInclude,
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.tradeDebate.findMany({
      where: { OR: [{ creatorId: user.id }, { challengerId: user.id }] },
      include: debateInclude,
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const mine = await Promise.all(mineRaw.map((d) => maybeResolveDebate(d).then(() => d)));
  // Re-fetch mine after potential resolution to get updated outcome/xp-affecting fields.
  const mineResolved = await prisma.tradeDebate.findMany({
    where: { id: { in: mine.map((d) => d.id) } },
    include: debateInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    open: openRaw.map(serializeDebate),
    mine: mineResolved.map(serializeDebate),
  });
}

const createSchema = z.object({
  asset: z.enum(ASSETS.map((a) => a.symbol) as [string, ...string[]]),
  timeframeHours: z.number().int().min(1).max(168),
  position: z.enum(POSITIONS),
  thesis: z.string().trim().min(10).max(500),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { asset, timeframeHours, position, thesis } = parsed.data;

  const startPrice = priceAt(asset as (typeof ASSETS)[number]["symbol"]);
  const expiresAt = new Date(Date.now() + timeframeHours * 60 * 60 * 1000);

  const debate = await prisma.tradeDebate.create({
    data: {
      creatorId: user.id,
      asset,
      timeframeHours,
      creatorPosition: position,
      thesis,
      startPrice,
      expiresAt,
    },
    include: debateInclude,
  });

  return NextResponse.json({ debate: serializeDebate(debate) });
}
