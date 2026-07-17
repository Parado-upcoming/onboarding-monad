import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  position: z.enum(["BULLISH", "BEARISH", "NEUTRAL"]),
  thesis: z.string().trim().min(10).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ debateId: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { debateId } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const debate = await prisma.tradeDebate.findUnique({ where: { id: debateId } });
  if (!debate) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (debate.creatorId === user.id) {
    return NextResponse.json({ error: "cannot_challenge_own_debate" }, { status: 400 });
  }
  if (debate.challengerId) {
    return NextResponse.json({ error: "already_challenged" }, { status: 400 });
  }
  if (debate.expiresAt <= new Date()) {
    return NextResponse.json({ error: "debate_expired" }, { status: 400 });
  }
  if (parsed.data.position === debate.creatorPosition) {
    return NextResponse.json({ error: "must_take_opposing_position" }, { status: 400 });
  }

  const updated = await prisma.tradeDebate.update({
    where: { id: debateId },
    data: {
      challengerId: user.id,
      challengerPosition: parsed.data.position,
      challengerThesis: parsed.data.thesis,
    },
  });

  return NextResponse.json({ ok: true, debateId: updated.id });
}
