"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Nicht autorisiert");
  }
  return session.user;
}

export async function suspendUser(userId: string, reason: string) {
  const admin = await requireAdmin();

  await db.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "SUSPEND_USER",
      targetType: "User",
      targetId: userId,
      reason,
    },
  });

  revalidatePath("/admin/benutzer");
}

export async function activateUser(userId: string) {
  const admin = await requireAdmin();

  await db.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "ACTIVATE_USER",
      targetType: "User",
      targetId: userId,
    },
  });

  revalidatePath("/admin/benutzer");
}

export async function deleteReview(reviewId: string, reason: string) {
  const admin = await requireAdmin();

  await db.review.update({
    where: { id: reviewId },
    data: { isPublic: false, deletedAt: new Date() },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "DELETE_REVIEW",
      targetType: "Review",
      targetId: reviewId,
      reason,
    },
  });

  revalidatePath("/admin/bewertungen");
}

export async function createCategory(name: string, slug: string, icon: string) {
  const admin = await requireAdmin();

  const category = await db.category.create({
    data: {
      name,
      slug,
      icon: icon || null,
    },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "CREATE_CATEGORY",
      targetType: "Category",
      targetId: category.id,
    },
  });

  revalidatePath("/admin/kategorien");
}

export async function verifyProvider(providerProfileId: string, userId: string) {
  const admin = await requireAdmin();

  await db.providerProfile.update({
    where: { id: providerProfileId },
    data: { isVerified: true },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "VERIFY_PROVIDER",
      targetType: "ProviderProfile",
      targetId: providerProfileId,
    },
  });

  revalidatePath("/admin/benutzer");
  revalidatePath(`/admin/benutzer/${userId}`);
}

export async function unverifyProvider(providerProfileId: string, userId: string) {
  const admin = await requireAdmin();

  await db.providerProfile.update({
    where: { id: providerProfileId },
    data: { isVerified: false },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "UNVERIFY_PROVIDER",
      targetType: "ProviderProfile",
      targetId: providerProfileId,
    },
  });

  revalidatePath("/admin/benutzer");
  revalidatePath(`/admin/benutzer/${userId}`);
}

export async function editReview(
  reviewId: string,
  data: { rating?: number; title?: string; comment?: string }
) {
  const admin = await requireAdmin();

  await db.review.update({
    where: { id: reviewId },
    data: {
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.comment !== undefined && { comment: data.comment }),
    },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "EDIT_REVIEW",
      targetType: "Review",
      targetId: reviewId,
      metadata: data,
    },
  });

  revalidatePath("/admin/bewertungen");
}

export async function resetMonthlyAwards(providerProfileId: string, userId: string) {
  const admin = await requireAdmin();

  await db.subscription.update({
    where: { providerId: providerProfileId },
    data: { monthlyAwardsUsed: 0 },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "RESET_MONTHLY_AWARDS",
      targetType: "Subscription",
      targetId: providerProfileId,
    },
  });

  revalidatePath("/admin/abonnements");
  revalidatePath(`/admin/benutzer/${userId}`);
}

export async function cancelJobAdmin(jobId: string, reason: string) {
  const admin = await requireAdmin();

  await db.job.update({
    where: { id: jobId },
    data: { status: "CANCELLED" },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "CANCEL_JOB",
      targetType: "Job",
      targetId: jobId,
      reason,
    },
  });

  revalidatePath("/admin/auftraege");
}

export async function toggleCategory(categoryId: string) {
  const admin = await requireAdmin();

  const category = await db.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new Error("Kategorie nicht gefunden");
  }

  await db.category.update({
    where: { id: categoryId },
    data: { isActive: !category.isActive },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: category.isActive ? "DEACTIVATE_CATEGORY" : "ACTIVATE_CATEGORY",
      targetType: "Category",
      targetId: categoryId,
    },
  });

  revalidatePath("/admin/kategorien");
}
