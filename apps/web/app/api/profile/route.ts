import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toPlayerProfile } from "@/lib/engines/progression";

const updateSchema = z.object({
  displayName: z.string().trim().min(1).max(24).optional(),
  avatarUrl: z.string().url().max(500).optional(),
});

export async function PATCH(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = updateSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: body.data,
  });

  return NextResponse.json({ user: toPlayerProfile(updated) });
}
