"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProviderProfile(data: {
  companyName?: string;
  description?: string;
  phone?: string;
  whatsappPhone?: string;
  city?: string;
  zipCode?: string;
  serviceRadius?: number;
  categoryIds?: string[];
}) {
  const session = await auth();
  if (!session || session.user.role !== "PROVIDER") {
    return { error: "Nicht autorisiert." };
  }

  const provider = await db.providerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!provider) return { error: "Profil nicht gefunden." };

  await db.providerProfile.update({
    where: { id: provider.id },
    data: {
      companyName: data.companyName,
      description: data.description,
      phone: data.phone,
      whatsappPhone: data.whatsappPhone,
      city: data.city,
      zipCode: data.zipCode,
      serviceRadius: data.serviceRadius,
    },
  });

  // Update categories if provided
  if (data.categoryIds) {
    await db.providerCategory.deleteMany({ where: { providerId: provider.id } });
    await db.providerCategory.createMany({
      data: data.categoryIds.map((categoryId) => ({
        providerId: provider.id,
        categoryId,
      })),
    });
  }

  revalidatePath("/anbieter/profil");
  return { success: true };
}

export async function updateClientProfile(data: {
  name?: string;
  city?: string;
  zipCode?: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return { error: "Nicht autorisiert." };
  }

  if (data.name) {
    await db.user.update({
      where: { id: session.user.id },
      data: { name: data.name },
    });
  }

  const clientProfile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (clientProfile) {
    await db.clientProfile.update({
      where: { id: clientProfile.id },
      data: {
        city: data.city,
        zipCode: data.zipCode,
      },
    });
  }

  revalidatePath("/dashboard/profil");
  return { success: true };
}

export async function changePassword(data: {
  currentPassword?: string;
  newPassword: string;
  skipCurrentCheck?: boolean; // true when forced change (mustChangePassword)
}) {
  const session = await auth();
  if (!session?.user) return { error: "Nicht autorisiert." };

  if (data.newPassword.length < 8) {
    return { error: "Passwort muss mindestens 8 Zeichen lang sein." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true, mustChangePassword: true },
  });

  if (!user) return { error: "Benutzer nicht gefunden." };

  // If not a forced reset, verify current password
  if (!data.skipCurrentCheck && !user.mustChangePassword) {
    if (!data.currentPassword) return { error: "Aktuelles Passwort erforderlich." };
    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash ?? "");
    if (!isValid) return { error: "Aktuelles Passwort ist falsch." };
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12);

  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  return { success: true };
}

export async function searchProviders(query: string, city: string) {
  return db.providerProfile.findMany({
    where: {
      isVerified: true,
      user: { isActive: true },
      ...(query && {
        OR: [
          { companyName: { contains: query, mode: "insensitive" } },
          { user: { name: { contains: query, mode: "insensitive" } } },
          { categories: { some: { category: { name: { contains: query, mode: "insensitive" } } } } },
        ],
      }),
      ...(city && { city: { contains: city, mode: "insensitive" } }),
    },
    include: {
      user: { select: { name: true, avatarUrl: true } },
      categories: { include: { category: { select: { name: true } } } },
      subscription: { select: { tier: true, status: true } },
    },
    orderBy: { averageRating: "desc" },
    take: 30,
  });
}

export async function getProviderPublicProfile(providerId: string) {
  return db.providerProfile.findUnique({
    where: { id: providerId },
    include: {
      user: { select: { name: true, avatarUrl: true, createdAt: true } },
      categories: { include: { category: true } },
      portfolioImages: { orderBy: { sortOrder: "asc" } },
      reviews: {
        where: { isPublic: true, deletedAt: null },
        include: {
          job: { select: { title: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      subscription: {
        select: { tier: true, status: true },
      },
    },
  });
}
