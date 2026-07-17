import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeStreak } from "@/lib/engines/progression";

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    const session = await getSession();

    if (!session.nonce) {
      return NextResponse.json({ ok: false, error: "missing_nonce" }, { status: 401 });
    }

    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({
      signature,
      nonce: session.nonce,
      domain: req.headers.get("host") ?? undefined,
    });

    if (!result.success) {
      return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
    }

    const walletAddress = result.data.address.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { walletAddress } });
    const now = new Date();
    const streakCount = computeStreak(
      existing?.streakCount ?? 0,
      existing?.lastActiveAt ?? null,
      now,
    );

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: { lastActiveAt: now, streakCount },
      create: { walletAddress, lastActiveAt: now, streakCount },
    });

    session.userId = user.id;
    session.walletAddress = walletAddress;
    session.nonce = undefined;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "verification_failed" }, { status: 401 });
  }
}
