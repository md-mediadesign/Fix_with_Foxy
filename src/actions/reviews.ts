"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createReviewSchema, type CreateReviewInput } from "@/lib/validations/job";
import { revalidatePath } from "next/cache";

export async function createReview(data: CreateReviewInput) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return { error: "Nicht autorisiert." };
  }

  const validated = createReviewSchema.parse(data);

  const job = await db.job.findUnique({
    where: { id: validated.jobId },
    include: {
      client: true,
      awardedBid: true,
      reviews: true,
    },
  });

  if (!job || job.client.userId !== session.user.id) {
    return { error: "Auftrag nicht gefunden." };
  }

  if (job.status !== "COMPLETED" && job.status !== "REVIEWED") {
    return { error: "Bewertung nur nach Abschluss möglich." };
  }

  if (job.reviews.length > 0) {
    return { error: "Du hast diesen Auftrag bereits bewertet." };
  }

  if (!job.awardedBid) {
    return { error: "Kein zugewiesener Anbieter." };
  }

  const review = await db.review.create({
    data: {
      jobId: validated.jobId,
      providerId: job.awardedBid.providerId,
      rating: validated.rating,
      title: validated.title || null,
      comment: validated.comment || null,
    },
  });

  // Update job status
  await db.job.update({
    where: { id: validated.jobId },
    data: { status: "REVIEWED" },
  });

  // Update provider average rating
  const allReviews = await db.review.findMany({
    where: { providerId: job.awardedBid.providerId, deletedAt: null },
  });

  const avgRating =
    allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await db.providerProfile.update({
    where: { id: job.awardedBid.providerId },
    data: {
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.length,
    },
  });

  // Notify provider via DB, E-Mail and WhatsApp
  const provider = await db.providerProfile.findUnique({
    where: { id: job.awardedBid.providerId },
    include: { user: true },
  });

  if (provider) {
    await db.notification.create({
      data: {
        userId: provider.userId,
        type: "REVIEW_RECEIVED",
        title: "Neue Bewertung erhalten",
        body: `${session.user.name} hat dich mit ${validated.rating} Sternen bewertet.`,
        link: `/anbieter/bewertungen`,
      },
    });

    try {
      const { sendReviewReceivedEmail } = await import("@/lib/email");
      await sendReviewReceivedEmail(
        provider.user.email,
        provider.companyName ?? provider.user.name,
        job.title,
        validated.rating,
        validated.comment
      );

      const { sendReviewReceivedWhatsApp } = await import("@/lib/whatsapp");
      await sendReviewReceivedWhatsApp(
        provider.whatsappPhone ?? provider.phone,
        provider.companyName ?? provider.user.name,
        job.title,
        validated.rating
      );
    } catch (err) {
      console.error("[createReview] Benachrichtigung fehlgeschlagen:", err);
    }
  }

  revalidatePath(`/dashboard/auftraege/${validated.jobId}`);
  return { success: true, reviewId: review.id };
}
