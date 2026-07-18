import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const attempts = await prisma.investigationAttempt.findMany({
    where: { userId: user.id },
  });

  return NextResponse.json({
    attempts: attempts.map((a) => ({
      caseId: a.caseId,
      correct: a.correct,
      xpAwarded: a.xpAwarded,
    })),
  });
}
