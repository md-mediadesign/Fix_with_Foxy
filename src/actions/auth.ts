"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import {
  registerClientSchema,
  registerProviderSchema,
  type RegisterClientInput,
  type RegisterProviderInput,
} from "@/lib/validations/auth";
import { TRIAL_DAYS, PLAN_LIMITS } from "@/lib/constants";
import { addDays } from "date-fns";

export async function registerClient(data: RegisterClientInput) {
  const validated = registerClientSchema.parse(data);

  const existing = await db.user.findUnique({
    where: { email: validated.email },
  });

  if (existing) {
    return { error: "Ein Konto mit dieser E-Mail existiert bereits." };
  }

  const passwordHash = await bcrypt.hash(validated.password, 12);

  await db.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      passwordHash,
      role: "CLIENT",
      clientProfile: {
        create: {
          city: validated.city,
        },
      },
    },
  });

  await signIn("credentials", {
    email: validated.email,
    password: validated.password,
    redirect: false,
  });

  return { success: true };
}

export async function registerProvider(data: RegisterProviderInput) {
  const validated = registerProviderSchema.parse(data);

  const existing = await db.user.findUnique({
    where: { email: validated.email },
  });

  if (existing) {
    return { error: "Ein Konto mit dieser E-Mail existiert bereits." };
  }

  const passwordHash = await bcrypt.hash(validated.password, 12);
  const now = new Date();
  const trialEnd = addDays(now, TRIAL_DAYS);

  await db.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      passwordHash,
      role: "PROVIDER",
      providerProfile: {
        create: {
          companyName: validated.companyName || null,
          phone: validated.phone,
          city: validated.city,
          zipCode: validated.zipCode,
          description: validated.description || null,
          serviceRadius: validated.serviceRadius,
          categories: {
            create: validated.categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
          subscription: {
            create: {
              tier: "BASIC",
              status: "TRIALING",
              trialEndsAt: trialEnd,
              currentPeriodStart: now,
              currentPeriodEnd: trialEnd,
              monthlyAwardsLimit: PLAN_LIMITS.BASIC.monthlyAwards,
            },
          },
        },
      },
    },
  });

  await signIn("credentials", {
    email: validated.email,
    password: validated.password,
    redirect: false,
  });

  return { success: true };
}

export async function loginAction(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: { role: true, passwordHash: true, isActive: true },
  });

  if (!user || !user.passwordHash || !user.isActive) {
    return { error: "Ungültige E-Mail oder Passwort." };
  }

  const bcrypt = await import("bcryptjs");
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { error: "Ungültige E-Mail oder Passwort." };
  }

  const redirectTo =
    user.role === "ADMIN"
      ? "/admin"
      : user.role === "PROVIDER"
        ? "/anbieter/dashboard"
        : "/dashboard";

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Anmeldung fehlgeschlagen." };
    }
    throw error; // Re-throw NEXT_REDIRECT so Next.js handles navigation
  }
}
