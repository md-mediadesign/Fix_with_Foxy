"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { sendBulkWhatsApp } from "@/lib/whatsapp";
import { logActivity } from "@/lib/activity-log";

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

export async function resetUserPassword(userId: string, newPassword: string) {
  const admin = await requireAdmin();

  if (newPassword.length < 8) {
    return { error: "Passwort muss mindestens 8 Zeichen lang sein." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "RESET_PASSWORD",
      targetType: "User",
      targetId: userId,
    },
  });

  await logActivity(userId, "PASSWORD_CHANGE", { resetBy: admin.id });

  revalidatePath(`/admin/benutzer/${userId}`);
  return { success: true };
}

export async function deleteUserAccount(userId: string) {
  const admin = await requireAdmin();

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true },
  });

  if (!target) return { error: "Benutzer nicht gefunden." };

  // Admin accounts can only be deleted by themselves
  if (target.role === "ADMIN" && target.id !== admin.id) {
    return { error: "Admin-Konten können nur vom Inhaber selbst gelöscht werden." };
  }

  await db.user.delete({ where: { id: userId } });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "DELETE_USER",
      targetType: "User",
      targetId: userId,
      reason: `Account ${target.name} gelöscht`,
    },
  });

  revalidatePath("/admin/benutzer");
  return { success: true, selfDeleted: target.id === admin.id };
}

export async function changeUserRole(userId: string, newRole: UserRole) {
  const admin = await requireAdmin();

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { clientProfile: true, providerProfile: true },
  });

  if (!user) throw new Error("Benutzer nicht gefunden");
  if (user.id === admin.id) throw new Error("Eigene Rolle kann nicht geändert werden");

  await db.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  // Create clientProfile if switching to CLIENT and none exists
  if (newRole === "CLIENT" && !user.clientProfile) {
    await db.clientProfile.create({ data: { userId } });
  }

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "CHANGE_ROLE",
      targetType: "User",
      targetId: userId,
      metadata: { from: user.role, to: newRole },
    },
  });

  revalidatePath("/admin/benutzer");
  revalidatePath(`/admin/benutzer/${userId}`);
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  city?: string;
  zipCode?: string;
}) {
  const admin = await requireAdmin();

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "Ein Konto mit dieser E-Mail existiert bereits." };

  const passwordHash = await bcrypt.hash(data.password, 12);

  await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      ...(data.role === "CLIENT" && {
        clientProfile: { create: { city: data.city || null } },
      }),
      ...(data.role === "PROVIDER" && {
        providerProfile: {
          create: {
            phone: data.phone || "",
            city: data.city || "",
            zipCode: data.zipCode || "",
          },
        },
      }),
    },
  });

  await db.adminAction.create({
    data: {
      adminId: admin.id,
      action: "CREATE_USER",
      targetType: "User",
      targetId: data.email,
      metadata: { role: data.role },
    },
  });

  revalidatePath("/admin/benutzer");
  return { success: true };
}

export async function sendTestWhatsAppToAdmins() {
  await requireAdmin();

  const admins = await db.user.findMany({
    where: { role: "ADMIN", isActive: true, phone: { not: null } },
    select: { name: true, phone: true },
  });

  const phones = admins.map((a) => a.phone!).filter(Boolean);
  await sendBulkWhatsApp(
    phones,
    `✅ Test-Nachricht von Werkspot Admin\n\nDiese Nachricht bestätigt, dass WhatsApp-Benachrichtigungen korrekt funktionieren.\n🕐 ${new Date().toLocaleString("de-DE")}`
  );

  return { success: true, sent: phones.length, total: admins.length };
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
