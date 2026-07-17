import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nextMissionFor } from "@/lib/engines/quest-engine";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const progress = await prisma.questProgress.findMany({
    where: { userId: user.id },
  });

  const completedIds = progress
    .filter((p) => p.status === "COMPLETED")
    .map((p) => p.questId);

  const nextMission = nextMissionFor(completedIds);

  return NextResponse.json({
    progress: progress.map((p) => ({
      questId: p.questId,
      status: p.status,
      xpAwarded: p.xpAwarded,
      completedAt: p.completedAt,
    })),
    nextMissionId: nextMission?.id ?? null,
  });
}
