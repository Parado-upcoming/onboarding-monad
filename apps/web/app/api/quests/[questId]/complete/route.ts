import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getQuestById, scoreQuestAnswers } from "@/lib/engines/quest-engine";
import { computeStreak, SKILL_FIELD_MAP, toPlayerProfile } from "@/lib/engines/progression";
import type { SkillKey } from "@/lib/engines/progression";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ questId: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { questId } = await params;
  const quest = getQuestById(questId);
  if (!quest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const existing = await prisma.questProgress.findUnique({
    where: { userId_questId: { userId: user.id, questId } },
  });
  if (existing?.status === "COMPLETED") {
    return NextResponse.json({
      alreadyCompleted: true,
      user: toPlayerProfile(user),
    });
  }

  const body = await req.json().catch(() => ({}));
  const answers = (body?.answers ?? {}) as Record<string, string>;
  const score = scoreQuestAnswers(quest, answers);

  const now = new Date();
  const streakCount = computeStreak(user.streakCount, user.lastActiveAt, now);

  const skillUpdates: Prisma.UserUpdateInput = {};
  for (const [key, amount] of Object.entries(quest.skillReward)) {
    const field = SKILL_FIELD_MAP[key as SkillKey];
    if (field && amount) {
      (skillUpdates as Record<string, unknown>)[field] = { increment: amount };
    }
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: quest.xpReward },
        streakCount,
        lastActiveAt: now,
        ...skillUpdates,
      },
    }),
    prisma.questProgress.upsert({
      where: { userId_questId: { userId: user.id, questId } },
      update: {
        status: "COMPLETED",
        answerData: answers,
        xpAwarded: quest.xpReward,
        completedAt: now,
      },
      create: {
        userId: user.id,
        questId,
        status: "COMPLETED",
        answerData: answers,
        xpAwarded: quest.xpReward,
        completedAt: now,
      },
    }),
    ...(quest.achievementId
      ? [
          prisma.achievement.upsert({
            where: {
              userId_achievementId: {
                userId: user.id,
                achievementId: quest.achievementId,
              },
            },
            update: {},
            create: { userId: user.id, achievementId: quest.achievementId },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({
    alreadyCompleted: false,
    score,
    xpAwarded: quest.xpReward,
    achievementId: quest.achievementId ?? null,
    user: toPlayerProfile(updatedUser),
  });
}
