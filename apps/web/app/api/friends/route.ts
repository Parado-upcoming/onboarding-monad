import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toPlayerProfile } from "@/lib/engines/progression";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
    include: { requester: true, addressee: true },
  });

  const accepted = friendships
    .filter((f) => f.status === "ACCEPTED")
    .map((f) => (f.requesterId === user.id ? f.addressee : f.requester));

  const incomingPending = friendships
    .filter((f) => f.status === "PENDING" && f.addresseeId === user.id)
    .map((f) => ({ friendshipId: f.id, user: f.requester }));

  const outgoingPending = friendships
    .filter((f) => f.status === "PENDING" && f.requesterId === user.id)
    .map((f) => ({ friendshipId: f.id, user: f.addressee }));

  return NextResponse.json({
    accepted: accepted.map(toPlayerProfile),
    incomingPending: incomingPending.map((p) => ({
      friendshipId: p.friendshipId,
      user: toPlayerProfile(p.user),
    })),
    outgoingPending: outgoingPending.map((p) => ({
      friendshipId: p.friendshipId,
      user: toPlayerProfile(p.user),
    })),
  });
}

const requestSchema = z.object({ walletAddress: z.string().min(4) });

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const targetAddress = parsed.data.walletAddress.toLowerCase();
  if (targetAddress === user.walletAddress) {
    return NextResponse.json({ error: "cannot_friend_self" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { walletAddress: targetAddress } });
  if (!target) {
    return NextResponse.json({ error: "wallet_not_found" }, { status: 404 });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: user.id },
      ],
    },
  });

  if (existing?.status === "ACCEPTED") {
    return NextResponse.json({ error: "already_friends" }, { status: 400 });
  }

  // They already requested us -- accept instead of creating a duplicate pending request.
  if (existing?.status === "PENDING" && existing.requesterId === target.id) {
    const accepted = await prisma.friendship.update({
      where: { id: existing.id },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ status: "accepted", friendshipId: accepted.id });
  }

  if (existing?.status === "PENDING") {
    return NextResponse.json({ error: "request_already_sent" }, { status: 400 });
  }

  const created = await prisma.friendship.create({
    data: { requesterId: user.id, addresseeId: target.id, status: "PENDING" },
  });

  return NextResponse.json({ status: "requested", friendshipId: created.id });
}
