import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const achievements = await prisma.achievement.findMany({
    where: { userId: user.id },
    orderBy: { unlockedAt: "desc" },
  });

  return NextResponse.json({
    achievements: achievements.map((a: Prisma.AchievementGetPayload<object>) => ({
      achievementId: a.achievementId,
      unlockedAt: a.unlockedAt,
      txHash: a.txHash,
      tokenId: a.tokenId,
    })),
  });
}
