import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCaseById } from "@/lib/investigation/cases";

const schema = z.object({
  conclusion: z.enum(["ACCUMULATING", "SELLING", "FARMING", "UNCLEAR"]),
  timeTakenSeconds: z.number().int().min(0).max(3600),
});

function speedBonus(seconds: number) {
  if (seconds < 20) return 10;
  if (seconds < 45) return 5;
  return 0;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { caseId } = await params;
  const investigationCase = getCaseById(caseId);
  if (!investigationCase) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existing = await prisma.investigationAttempt.findUnique({
    where: { userId_caseId: { userId: user.id, caseId } },
  });
  if (existing) {
    return NextResponse.json({ alreadyAttempted: true, correct: existing.correct });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { conclusion, timeTakenSeconds } = parsed.data;
  const correct = conclusion === investigationCase.correctConclusion;
  const xpAwarded = correct
    ? investigationCase.xpReward + speedBonus(timeTakenSeconds)
    : 15;

  const isFirstCorrect =
    correct &&
    (await prisma.investigationAttempt.count({
      where: { userId: user.id, correct: true },
    })) === 0;

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.investigationAttempt.create({
      data: {
        userId: user.id,
        caseId,
        conclusion,
        correct,
        xpAwarded,
        timeTakenSeconds,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: xpAwarded }, skillOnchain: { increment: correct ? 8 : 2 } },
    }),
  ];

  if (isFirstCorrect) {
    ops.push(
      prisma.achievement.upsert({
        where: {
          userId_achievementId: { userId: user.id, achievementId: "on-chain-detective" },
        },
        update: {},
        create: { userId: user.id, achievementId: "on-chain-detective" },
      }),
    );
  }

  await prisma.$transaction(ops);

  return NextResponse.json({
    alreadyAttempted: false,
    correct,
    xpAwarded,
    correctConclusion: investigationCase.correctConclusion,
    explanation: investigationCase.explanation,
    achievementId: isFirstCorrect ? "on-chain-detective" : null,
  });
}
