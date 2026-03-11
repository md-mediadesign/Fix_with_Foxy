"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createJobSchema, type CreateJobInput } from "@/lib/validations/job";
import { PREMIUM_WINDOW_HOURS, JOB_EXPIRY_DAYS } from "@/lib/constants";
import { addHours, addDays } from "date-fns";
import { revalidatePath } from "next/cache";

export async function createJob(data: CreateJobInput) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return { error: "Nicht autorisiert." };
  }

  const validated = createJobSchema.parse(data);

  const clientProfile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!clientProfile) {
    return { error: "Profil nicht gefunden." };
  }

  const job = await db.job.create({
    data: {
      clientId: clientProfile.id,
      categoryId: validated.categoryId,
      title: validated.title,
      description: validated.description,
      city: validated.city,
      zipCode: validated.zipCode,
      budgetMin: validated.budgetMin || null,
      budgetMax: validated.budgetMax || null,
      desiredDate: validated.desiredDate ? new Date(validated.desiredDate) : null,
      urgency: validated.urgency || null,
      status: "DRAFT",
    },
  });

  return { success: true, jobId: job.id };
}

export async function publishJob(jobId: string) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return { error: "Nicht autorisiert." };
  }

  const clientProfile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  const job = await db.job.findUnique({
    where: { id: jobId },
  });

  if (!job || job.clientId !== clientProfile?.id) {
    return { error: "Auftrag nicht gefunden." };
  }

  if (job.status !== "DRAFT") {
    return { error: "Auftrag kann nicht veröffentlicht werden." };
  }

  const now = new Date();

  await db.job.update({
    where: { id: jobId },
    data: {
      status: "OPEN",
      publishedAt: now,
      premiumAccessUntil: addHours(now, PREMIUM_WINDOW_HOURS),
      expiresAt: addDays(now, JOB_EXPIRY_DAYS),
    },
  });

  // TODO: Trigger notifications for premium providers (WhatsApp)
  // TODO: Schedule notification for non-premium providers after window

  revalidatePath("/dashboard/auftraege");
  return { success: true };
}

export async function updateJob(
  jobId: string,
  data: {
    title?: string;
    description?: string;
    city?: string;
    zipCode?: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
    desiredDate?: string | null;
    urgency?: string | null;
  }
) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return { error: "Nicht autorisiert." };
  }

  const clientProfile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  const job = await db.job.findUnique({ where: { id: jobId } });

  if (!job || job.clientId !== clientProfile?.id) {
    return { error: "Auftrag nicht gefunden." };
  }

  if (!["DRAFT", "OPEN"].includes(job.status)) {
    return { error: "Auftrag kann nicht mehr bearbeitet werden." };
  }

  await db.job.update({
    where: { id: jobId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
      ...(data.budgetMin !== undefined && { budgetMin: data.budgetMin }),
      ...(data.budgetMax !== undefined && { budgetMax: data.budgetMax }),
      ...(data.desiredDate !== undefined && {
        desiredDate: data.desiredDate ? new Date(data.desiredDate) : null,
      }),
      ...(data.urgency !== undefined && { urgency: data.urgency }),
    },
  });

  revalidatePath(`/dashboard/auftraege/${jobId}`);
  revalidatePath("/dashboard/auftraege");
  return { success: true };
}

export async function cancelJob(jobId: string) {
  const session = await auth();
  if (!session) return { error: "Nicht autorisiert." };

  const clientProfile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  const job = await db.job.findUnique({ where: { id: jobId } });

  if (!job || job.clientId !== clientProfile?.id) {
    return { error: "Auftrag nicht gefunden." };
  }

  if (!["DRAFT", "OPEN"].includes(job.status)) {
    return { error: "Auftrag kann nicht storniert werden." };
  }

  await db.job.update({
    where: { id: jobId },
    data: { status: "CANCELLED" },
  });

  // Reject all pending bids
  await db.bid.updateMany({
    where: { jobId, status: "PENDING" },
    data: { status: "REJECTED" },
  });

  revalidatePath("/dashboard/auftraege");
  return { success: true };
}

export async function awardBid(jobId: string, bidId: string) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return { error: "Nicht autorisiert." };
  }

  const clientProfile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  const job = await db.job.findUnique({
    where: { id: jobId },
    include: { bids: true },
  });

  if (!job || job.clientId !== clientProfile?.id) {
    return { error: "Auftrag nicht gefunden." };
  }

  if (job.status !== "OPEN") {
    return { error: "Auftrag ist nicht mehr offen." };
  }

  const bid = await db.bid.findUnique({
    where: { id: bidId },
    include: {
      provider: { include: { subscription: true } },
    },
  });

  if (!bid || bid.jobId !== jobId) {
    return { error: "Angebot nicht gefunden." };
  }

  // Check provider subscription limits
  const subscription = bid.provider.subscription;
  if (!subscription) {
    return { error: "Anbieter hat kein aktives Abonnement." };
  }

  const isTrialActive =
    subscription.status === "TRIALING" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt > new Date();

  const isSubActive = subscription.status === "ACTIVE";

  if (!isTrialActive && !isSubActive) {
    return { error: "Anbieter hat kein aktives Abonnement." };
  }

  if (subscription.monthlyAwardsUsed >= subscription.monthlyAwardsLimit) {
    return { error: "Dieser Anbieter hat sein monatliches Auftragslimit erreicht." };
  }

  // Award the bid
  await db.$transaction([
    db.bid.update({
      where: { id: bidId },
      data: { status: "AWARDED" },
    }),
    db.bid.updateMany({
      where: { jobId, id: { not: bidId }, status: "PENDING" },
      data: { status: "REJECTED" },
    }),
    db.job.update({
      where: { id: jobId },
      data: {
        status: "AWARDED",
        awardedBidId: bidId,
        awardedAt: new Date(),
      },
    }),
    db.subscription.update({
      where: { id: subscription.id },
      data: { monthlyAwardsUsed: { increment: 1 } },
    }),
  ]);

  // Notify awarded provider via DB, E-Mail and WhatsApp
  try {
    const providerUser = await db.user.findUnique({
      where: { id: bid.provider.userId },
    });

    await db.notification.create({
      data: {
        userId: bid.provider.userId,
        type: "JOB_AWARDED",
        title: "Auftrag erhalten!",
        body: `Du hast den Zuschlag für "${job.title}" erhalten.`,
        link: `/anbieter/dashboard`,
      },
    });

    if (providerUser?.email) {
      const { sendJobAwardedEmail } = await import("@/lib/email");
      await sendJobAwardedEmail(
        providerUser.email,
        bid.provider.companyName ?? providerUser.name,
        job.title,
        job.city,
        bid.amount
      );
    }

    const { sendJobAwardedWhatsApp } = await import("@/lib/whatsapp");
    await sendJobAwardedWhatsApp(
      bid.provider.whatsappPhone ?? bid.provider.phone,
      bid.provider.companyName ?? providerUser?.name ?? "Anbieter",
      job.title,
      bid.amount
    );
  } catch (err) {
    console.error("[awardBid] Benachrichtigung fehlgeschlagen:", err);
  }

  revalidatePath(`/dashboard/auftraege/${jobId}`);
  return { success: true };
}

export async function markJobInProgress(jobId: string) {
  const session = await auth();
  if (!session || session.user.role !== "PROVIDER") {
    return { error: "Nicht autorisiert." };
  }

  const provider = await db.providerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const job = await db.job.findUnique({
    where: { id: jobId },
    include: { awardedBid: true },
  });

  if (!job || job.awardedBid?.providerId !== provider?.id) {
    return { error: "Auftrag nicht gefunden." };
  }

  if (job.status !== "AWARDED") {
    return { error: "Status kann nicht geändert werden." };
  }

  await db.job.update({
    where: { id: jobId },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath(`/anbieter/auftraege/${jobId}`);
  return { success: true };
}

export async function markJobCompleted(jobId: string) {
  const session = await auth();
  if (!session) return { error: "Nicht autorisiert." };

  const job = await db.job.findUnique({
    where: { id: jobId },
    include: { awardedBid: true, client: true },
  });

  if (!job) return { error: "Auftrag nicht gefunden." };

  // Both client and provider can mark as completed
  const isClient = session.user.role === "CLIENT" && job.client.userId === session.user.id;
  const isProvider = session.user.role === "PROVIDER";

  if (!isClient && !isProvider) {
    return { error: "Nicht autorisiert." };
  }

  if (job.status !== "IN_PROGRESS" && job.status !== "AWARDED") {
    return { error: "Status kann nicht geändert werden." };
  }

  await db.job.update({
    where: { id: jobId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  // Increment provider's completed jobs count
  if (job.awardedBid) {
    await db.providerProfile.update({
      where: { id: job.awardedBid.providerId },
      data: { completedJobs: { increment: 1 } },
    });
  }

  revalidatePath(`/dashboard/auftraege/${jobId}`);
  revalidatePath(`/anbieter/auftraege/${jobId}`);
  return { success: true };
}
