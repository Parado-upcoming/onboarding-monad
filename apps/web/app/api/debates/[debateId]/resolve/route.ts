import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { maybeResolveDebate } from "@/lib/debates/resolve-debate";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ debateId: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { debateId } = await params;
  const debate = await prisma.tradeDebate.findUnique({ where: { id: debateId } });
  if (!debate) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const resolved = await maybeResolveDebate(debate);
  return NextResponse.json({ outcome: resolved.outcome });
}
