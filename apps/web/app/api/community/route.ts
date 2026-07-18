import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MONAD_EXPLORER_CHALLENGE } from "@/lib/community/data";
import { checkRequirements } from "@/lib/community/requirements";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const requirements = await checkRequirements(user.id);

  const challenge = await prisma.communityChallenge.findUnique({
    where: { slug: MONAD_EXPLORER_CHALLENGE.slug },
  });
  const completed = challenge
    ? await prisma.challengeCompletion.findUnique({
        where: { userId_challengeId: { userId: user.id, challengeId: challenge.id } },
      })
    : null;

  return NextResponse.json({
    challenge: MONAD_EXPLORER_CHALLENGE,
    requirements,
    allRequirementsMetExceptFinal:
      requirements.learnMonad && requirements.fiveQuests && requirements.testnetInteraction,
    completed: !!completed,
  });
}
