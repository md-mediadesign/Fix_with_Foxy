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
import { logActivity } from "@/lib/activity-log";
import { sendWelcomeEmail } from "@/lib/email";

export async function registerClient(data: RegisterClientInput) {
  let validated: RegisterClientInput;
  try {
    validated = registerClientSchema.parse(data);
  } catch {
    return { error: "Bitte überprüfe deine Eingaben." };
  }

  const existing = await db.user.findUnique({
    where: { email: validated.email },
  });

  if (existing) {
    return { error: "Ein Konto mit dieser E-Mail existiert bereits." };
  }

  const passwordHash = await bcrypt.hash(validated.password, 12);

  const user = await db.user.create({
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

  await logActivity(user.id, "REGISTER", { role: "CLIENT" });
  sendWelcomeEmail(user.email, user.name, "CLIENT").catch(() => {});

  try {
    await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: true };
    }
    throw error;
  }

  return { success: true };
}

export async function registerProvider(data: RegisterProviderInput) {
  let validated: RegisterProviderInput;
  try {
    validated = registerProviderSchema.parse(data);
  } catch {
    return { error: "Bitte überprüfe deine Eingaben." };
  }

  const existing = await db.user.findUnique({
    where: { email: validated.email },
  });

  if (existing) {
    return { error: "Ein Konto mit dieser E-Mail existiert bereits." };
  }

  const passwordHash = await bcrypt.hash(validated.password, 12);
  const now = new Date();
  const trialEnd = addDays(now, TRIAL_DAYS);

  const providerUser = await db.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      passwordHash,
      role: "PROVIDER",
      providerProfile: {
        create: {
          companyName: validated.companyName || null,
          phone: validated.phone ?? null,
          city: validated.city,
          zipCode: validated.zipCode ?? null,
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

  await logActivity(providerUser.id, "REGISTER", { role: "PROVIDER" });
  sendWelcomeEmail(providerUser.email, providerUser.name, "PROVIDER").catch(() => {});

  try {
    await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirectTo: "/anbieter/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: true };
    }
    throw error;
  }

  return { success: true };
}

export async function loginAction(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true, isActive: true },
  });

  if (!user || !user.passwordHash || !user.isActive) {
    return { error: "Ungültige E-Mail oder Passwort." };
  }

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

  await logActivity(user.id, "LOGIN");
}
