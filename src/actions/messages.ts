"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function sendMessage(jobId: string, content: string) {
  const session = await auth();
  if (!session) return { error: "Nicht autorisiert." };

  if (!content.trim() || content.length > 2000) {
    return { error: "Nachricht ist ungültig." };
  }

  // Verify user is involved in this job
  const job = await db.job.findUnique({
    where: { id: jobId },
    include: {
      client: true,
      bids: { include: { provider: true } },
    },
  });

  if (!job) return { error: "Auftrag nicht gefunden." };

  const isClient = job.client.userId === session.user.id;
  const isProvider = job.bids.some((b: any) => b.provider.userId === session.user.id);

  if (!isClient && !isProvider) {
    return { error: "Nicht autorisiert." };
  }

  const message = await db.message.create({
    data: {
      jobId,
      senderId: session.user.id,
      content: content.trim(),
    },
  });

  // Create notification for the other party
  const recipientUserId = isClient
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? job.bids.find((b: any) => b.status === "AWARDED" || b.status === "PENDING")?.provider.userId
    : job.client.userId;

  if (recipientUserId) {
    await db.notification.create({
      data: {
        userId: recipientUserId,
        type: "MESSAGE_RECEIVED",
        title: "Neue Nachricht",
        body: `${session.user.name}: ${content.slice(0, 100)}${content.length > 100 ? "..." : ""}`,
        link: `/dashboard/auftraege/${jobId}/nachrichten`,
      },
    });
  }

  revalidatePath(`/dashboard/auftraege/${jobId}/nachrichten`);
  return { success: true, message };
}

export async function getMessages(jobId: string) {
  const session = await auth();
  if (!session) return [];

  return db.message.findMany({
    where: { jobId },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function markMessagesRead(jobId: string) {
  const session = await auth();
  if (!session) return;

  await db.message.updateMany({
    where: {
      jobId,
      senderId: { not: session.user.id },
      isRead: false,
    },
    data: { isRead: true },
  });
}
