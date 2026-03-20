import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 500);

  const logs = await db.userActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return NextResponse.json(logs);
}
