"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createBidSchema, type CreateBidInput } from "@/lib/validations/job";
import { revalidatePath } from "next/cache";

export async function placeBid(data: CreateBidInput) {
  const session = await auth();
  if (!session || session.user.role !== "PROVIDER") {
    return { error: "Nicht autorisiert." };
  }

  const validated = createBidSchema.parse(data);

  const provider = await db.providerProfile.findUnique({
    where: { userId: session.user.id },
    include: { subscription: true },
  });

  if (!provider) return { error: "Profil nicht gefunden." };

  // Check subscription status
  const sub = provider.subscription;
  if (!sub) return { error: "Kein Abonnement vorhanden." };

  const isTrialActive =
    sub.status === "TRIALING" && sub.trialEndsAt && sub.trialEndsAt > new Date();
  const isSubActive = sub.status === "ACTIVE";

  if (!isTrialActive && !isSubActive) {
    return { error: "Dein Abonnement ist nicht aktiv. Bitte verlängere dein Abo." };
  }

  // Check job exists and is open
  const job = await db.job.findUnique({ where: { id: validated.jobId } });
  if (!job || job.status !== "OPEN") {
    return { error: "Dieser Auftrag ist nicht mehr verfügbar." };
  }

  // Check premium window
  if (
    job.premiumAccessUntil &&
    job.premiumAccessUntil > new Date() &&
    sub.tier !== "PREMIUM"
  ) {
    return { error: "Dieser Auftrag ist derzeit nur für Premium-Anbieter verfügbar." };
  }

  // Check if already bid
  const existingBid = await db.bid.findUnique({
    where: { jobId_providerId: { jobId: validated.jobId, providerId: provider.id } },
  });

  if (existingBid) {
    return { error: "Du hast bereits ein Angebot für diesen Auftrag abgegeben." };
  }

  await db.bid.create({
    data: {
      jobId: validated.jobId,
      providerId: provider.id,
      amount: validated.amount,
      message: validated.message,
      estimatedDays: validated.estimatedDays || null,
    },
  });

  // Create notification for client + auto-open chat
  const jobWithClient = await db.job.findUnique({
    where: { id: validated.jobId },
    include: { client: true },
  });

  if (jobWithClient) {
    await db.notification.create({
      data: {
        userId: jobWithClient.client.userId,
        type: "NEW_BID",
        title: "Neues Angebot erhalten",
        body: `${session.user.name} hat ein Angebot für "${jobWithClient.title}" abgegeben.`,
        link: `/dashboard/auftraege/${validated.jobId}/nachrichten`,
      },
    });

    // Auto-create first message to open chat channel
    await db.message.create({
      data: {
        jobId: validated.jobId,
        senderId: session.user.id,
        content: `📋 Angebot eingereicht: ${validated.amount.toFixed(2)} €${validated.estimatedDays ? ` | ca. ${validated.estimatedDays} Tage` : ""}\n\n${validated.message}`,
      },
    });
  }

  revalidatePath(`/anbieter/auftraege/${validated.jobId}`);
  revalidatePath(`/dashboard/auftraege/${validated.jobId}`);
  return { success: true };
}

export async function withdrawBid(bidId: string) {
  const session = await auth();
  if (!session || session.user.role !== "PROVIDER") {
    return { error: "Nicht autorisiert." };
  }

  const provider = await db.providerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const bid = await db.bid.findUnique({ where: { id: bidId } });

  if (!bid || bid.providerId !== provider?.id) {
    return { error: "Angebot nicht gefunden." };
  }

  if (bid.status !== "PENDING") {
    return { error: "Angebot kann nicht zurückgezogen werden." };
  }

  await db.bid.update({
    where: { id: bidId },
    data: { status: "WITHDRAWN" },
  });

  revalidatePath("/anbieter/angebote");
  return { success: true };
}
