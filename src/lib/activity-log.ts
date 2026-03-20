import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function logActivity(
  userId: string,
  action: string,
  meta?: Record<string, unknown>
) {
  try {
    await db.userActivityLog.create({
      data: {
        userId,
        action,
        meta: meta ? (meta as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch {
    // Non-critical – do not break the main flow
  }
}
