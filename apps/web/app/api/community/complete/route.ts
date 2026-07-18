import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MONAD_EXPLORER_CHALLENGE, FINAL_QUESTION } from "@/lib/community/data";
import { checkRequirements } from "@/lib/community/requirements";

const schema = z.object({ finalAnswer: z.string() });

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const requirements = await checkRequirements(user.id);
  if (!requirements.learnMonad || !requirements.fiveQuests || !requirements.testnetInteraction) {
    return NextResponse.json({ error: "requirements_not_met" }, { status: 400 });
  }
  if (parsed.data.finalAnswer !== FINAL_QUESTION.correctOptionId) {
    return NextResponse.json({ error: "incorrect_answer" }, { status: 400 });
  }

  const challenge = await prisma.communityChallenge.upsert({
    where: { slug: MONAD_EXPLORER_CHALLENGE.slug },
    update: {},
    create: {
      slug: MONAD_EXPLORER_CHALLENGE.slug,
      title: MONAD_EXPLORER_CHALLENGE.title,
      description: MONAD_EXPLORER_CHALLENGE.description,
      createdBy: MONAD_EXPLORER_CHALLENGE.createdBy,
      requirements: MONAD_EXPLORER_CHALLENGE.requirements,
      rewards: MONAD_EXPLORER_CHALLENGE.rewards,
    },
  });

  const existing = await prisma.challengeCompletion.findUnique({
    where: { userId_challengeId: { userId: user.id, challengeId: challenge.id } },
  });
  if (existing) {
    return NextResponse.json({ alreadyCompleted: true });
  }

  await prisma.$transaction([
    prisma.challengeCompletion.create({
      data: {
        userId: user.id,
        challengeId: challenge.id,
        xpAwarded: MONAD_EXPLORER_CHALLENGE.rewards.xp,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: MONAD_EXPLORER_CHALLENGE.rewards.xp } },
    }),
    prisma.achievement.upsert({
      where: { userId_achievementId: { userId: user.id, achievementId: "monad-explorer" } },
      update: {},
      create: { userId: user.id, achievementId: "monad-explorer" },
    }),
  ]);

  return NextResponse.json({ alreadyCompleted: false, xpAwarded: MONAD_EXPLORER_CHALLENGE.rewards.xp });
}
