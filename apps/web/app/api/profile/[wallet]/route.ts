import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toPlayerProfile } from "@/lib/engines/progression";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ wallet: string }> },
) {
  const { wallet } = await params;
  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet.toLowerCase() },
    include: {
      _count: {
        select: {
          questProgress: { where: { status: "COMPLETED" } },
          achievements: true,
        },
      },
      achievements: { orderBy: { unlockedAt: "desc" } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...toPlayerProfile(user),
      questsCompleted: user._count.questProgress,
      achievementsCount: user._count.achievements,
      achievements: user.achievements.map((a) => a.achievementId),
    },
  });
}
