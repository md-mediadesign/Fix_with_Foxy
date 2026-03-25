import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  const checks = [
    {
      name: "user.findFirst",
      fn: () => db.user.findFirst({ select: { id: true, email: true, mustChangePassword: true } }),
    },
    {
      name: "providerProfile.findFirst",
      fn: () => db.providerProfile.findFirst({ select: { id: true } }),
    },
    {
      name: "subscription.findFirst",
      fn: () => db.subscription.findFirst({ select: { id: true } }),
    },
    {
      name: "notification.findFirst",
      fn: () => db.notification.findFirst({ select: { id: true } }),
    },
    {
      name: "adminAction.findFirst",
      fn: () => db.adminAction.findFirst({ select: { id: true } }),
    },
    {
      name: "message.findFirst",
      fn: () => db.message.findFirst({ select: { id: true } }),
    },
  ];

  for (const check of checks) {
    try {
      await check.fn();
      results[check.name] = "OK";
    } catch (e) {
      results[check.name] = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json(results);
}
