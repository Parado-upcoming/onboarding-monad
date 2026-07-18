import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  tokenId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ achievementId: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { achievementId } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const existing = await prisma.achievement.findUnique({
    where: { userId_achievementId: { userId: user.id, achievementId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.achievement.update({
    where: { userId_achievementId: { userId: user.id, achievementId } },
    data: { txHash: parsed.data.txHash, tokenId: parsed.data.tokenId },
  });

  return NextResponse.json({ achievement: updated });
}
