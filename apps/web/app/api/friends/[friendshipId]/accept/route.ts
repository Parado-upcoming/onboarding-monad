import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ friendshipId: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { friendshipId } = await params;
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });

  if (!friendship || friendship.addresseeId !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED" },
  });

  return NextResponse.json({ ok: true });
}
