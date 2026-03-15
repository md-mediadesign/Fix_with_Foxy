"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getUnreadNotifications() {
  const session = await auth();
  if (!session) return { count: 0, items: [] };

  const items = await db.notification.findMany({
    where: { userId: session.user.id, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return { count: items.length, items };
}

export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session) return;
  await db.notification.update({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session) return;
  await db.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
}
